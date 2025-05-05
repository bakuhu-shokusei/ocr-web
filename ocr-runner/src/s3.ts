import fs from 'fs'
import path from 'path'
import {
  S3Client,
  ListObjectsV2CommandOutput,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import {
  EC2Client,
  TerminateInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2'
import { pipeline } from 'stream'
import { promisify } from 'util'
import axios from 'axios'

const REGION = 'ap-northeast-1'
export const BUCKET_NAME = 'ocr-assets'

const s3 = new S3Client({ region: REGION })

export type DirectoryTree = {
  [name: string]: DirectoryTree | string
}

async function listAllKeys(bucketName: string): Promise<string[]> {
  let continuationToken: string | undefined = undefined
  const allKeys: string[] = []

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
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
function buildDirectoryTree(keys: string[]): DirectoryTree {
  const tree: DirectoryTree = {}

  for (const key of keys) {
    const parts = key.split('/').filter(Boolean)
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
): Promise<DirectoryTree> {
  const keys = await listAllKeys(bucketName)
  const tree = buildDirectoryTree(keys)
  return tree
}

const streamPipeline = promisify(pipeline)
/**
 * Downloads a single file from S3 and saves it with a new local name.
 * @param bucketName - S3 bucket name
 * @param s3Key - Full key of the S3 object (e.g., "folder/image.jpg")
 * @param localFilePath - Full local file path to save as (e.g., "./img/cat-renamed.jpg")
 */
export async function downloadS3FileWithRename(
  bucketName: string,
  s3Key: string,
  localFilePath: string,
): Promise<void> {
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  })

  const response = await s3.send(getCommand)
  const bodyStream = response.Body as NodeJS.ReadableStream

  // Make sure the destination directory exists
  fs.mkdirSync(path.dirname(localFilePath), { recursive: true })

  await streamPipeline(bodyStream, fs.createWriteStream(localFilePath))
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

export async function terminateSelf(type: 'stop' | 'terminate') {
  const instanceId = (
    await axios.get('http://169.254.169.254/latest/meta-data/instance-id')
  ).data
  const ec2 = new EC2Client({ region: REGION })
  await ec2.send(
    new (type === 'terminate'
      ? TerminateInstancesCommand
      : StopInstancesCommand)({ InstanceIds: [instanceId] }),
  )
}
