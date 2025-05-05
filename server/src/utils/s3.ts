import {
  S3Client,
  ListObjectsV2CommandOutput,
  ListObjectsV2Command,
  PutObjectCommandInput,
  PutObjectCommand,
  DeleteObjectsCommand,
  _Object,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import fs from 'fs'
import path from 'path'
import mime from 'mime'
import { CLOUDFRONT_KEYPAIR_ID, CLOUDFRONT_PRIVATE_KEY } from '@/env'

const REGION = 'ap-northeast-1'
export const BUCKET_NAME = 'ocr-assets'

const s3 = new S3Client({ region: REGION })

export type DirectoryTree = {
  [name: string]: DirectoryTree | string
}

async function listAllKeys(
  bucketName: string,
  prefix?: string,
): Promise<string[]> {
  let continuationToken: string | undefined = undefined
  const allKeys: string[] = []

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
      Prefix: prefix,
    })

    const response: ListObjectsV2CommandOutput = await s3.send(command)

    const keys = response.Contents?.map((obj) => obj.Key!).filter(Boolean) ?? []
    allKeys.push(...keys)

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined
  } while (continuationToken)

  return allKeys
}

/**
 * Build a nested directory tree structure from flat S3 keys
 */
function buildDirectoryTree(
  keys: string[],
  prefixToTrim: string = '',
): DirectoryTree {
  const tree: DirectoryTree = {}
  const prefixLength = prefixToTrim.length

  for (const key of keys) {
    const trimmedKey = key.slice(prefixLength) // Make keys relative to the folder
    const parts = trimmedKey.split('/').filter(Boolean)
    let current: DirectoryTree = tree

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLeaf = i === parts.length - 1

      if (!current[part]) {
        current[part] = isLeaf ? key : {}
      }

      if (!isLeaf) {
        current = current[part] as DirectoryTree
      }
    }
  }

  return tree
}

/**
 * Get the full directory structure of the S3 bucket
 */
export async function getBucketStructure(
  bucketName: string,
  folderPrefix: string = '',
): Promise<DirectoryTree> {
  const normalizedPrefix = folderPrefix.replace(/^\/|\/$/g, '') + '/'
  const keys = await listAllKeys(bucketName, normalizedPrefix)
  const tree = buildDirectoryTree(keys, normalizedPrefix)
  return tree
}

// ;(async () => {
//   const tree = await getBucketStructure(BUCKET_NAME, 'ocr-user')
//   console.log(JSON.stringify(tree, null, 2))
// })()

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = entries.flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name)
    return entry.isDirectory() ? getAllFiles(fullPath) : [fullPath]
  })
  return files
}

/**
 * Upload a local directory to an S3 bucket
 */
export async function uploadDirectoryToS3(
  localDir: string,
  bucketName: string,
  s3Prefix: string = '',
): Promise<void> {
  const files = getAllFiles(localDir)

  for (const filePath of files) {
    // Get relative path to preserve folder structure in S3
    const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/') // Windows fix
    const s3Key = path.posix.join(s3Prefix, relativePath)

    const fileStream = fs.createReadStream(filePath)

    // Detect MIME type
    const contentType = mime.getType(filePath) || 'application/octet-stream'

    const uploadParams: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileStream,
      ContentType: contentType,
    }

    const upload = new Upload({
      client: s3,
      params: uploadParams,
    })

    await upload.done()
  }
}

// ;(async () => {
//   const localDir = path.join(__dirname, 'my-local-folder')
//
//   await uploadDirectoryToS3(localDir, BUCKET_NAME, 'uploads/')
// })()

export async function uploadFileToS3(
  localFilePath: string,
  bucketName: string,
  s3Key: string,
): Promise<void> {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File does not exist: ${localFilePath}`)
  }

  const fileStream = fs.createReadStream(localFilePath)

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: s3Key,
    Body: fileStream,
  }

  const upload = new Upload({
    client: s3,
    params: uploadParams,
  })

  await upload.done()
}

export async function uploadJsonToS3(
  jsonObject: any,
  bucketName: string,
  s3Key: string,
): Promise<void> {
  const jsonString = JSON.stringify(jsonObject)

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: jsonString,
    ContentType: 'application/json',
  })

  await s3.send(command)
}

/**
 * Delete all objects under a specific prefix (folder) in an S3 bucket
 * @param bucketName - The S3 bucket name
 * @param prefix - The prefix (folder path), e.g., "my-folder/"
 */
export async function deleteS3Folder(
  bucketName: string,
  prefix: string,
): Promise<void> {
  let continuationToken: string | undefined = undefined

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const listResponse: ListObjectsV2CommandOutput = await s3.send(listCommand)
    const objects = listResponse.Contents

    if (!objects || objects.length === 0) {
      return
    }

    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: objects.map((obj: _Object) => ({ Key: obj.Key! })),
        Quiet: true,
      },
    }

    const deleteCommand = new DeleteObjectsCommand(deleteParams)
    await s3.send(deleteCommand)

    continuationToken = listResponse.IsTruncated
      ? listResponse.NextContinuationToken
      : undefined
  } while (continuationToken)
}

export function createSignedUrl(url: string) {
  return getSignedUrl({
    keyPairId: CLOUDFRONT_KEYPAIR_ID!,
    privateKey: CLOUDFRONT_PRIVATE_KEY!,
    url: url,
    dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
  })
}
