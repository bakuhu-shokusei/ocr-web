import {
  S3Client,
  ListObjectsV2CommandOutput,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  _Object,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import {
  CLOUDFRONT_KEYPAIR_ID,
  CLOUDFRONT_PATH,
  CLOUDFRONT_PRIVATE_KEY,
} from '@/env'

const REGION = 'ap-northeast-1'
export const BUCKET_NAME = 'ocr-assets'

const s3 = new S3Client({ region: REGION })

type SubDirItem = {
  path: string
  info: DirectoryInfo
}

type DirectoryInfo =
  | {
      type: 'book'
      imagePath: string
      name: string
    }
  | {
      type: 'invalid'
    }
  | {
      type: 'directory'
      name: string
    }

async function listSubdirectories(prefix: string): Promise<string[]> {
  const subdirectories = new Set<string>()
  let continuationToken: string | undefined

  do {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: continuationToken,
    }

    try {
      const command = new ListObjectsV2Command(params)
      const response: ListObjectsV2CommandOutput = await s3.send(command)

      // Add common prefixes (subdirectories) to our set
      if (response.CommonPrefixes) {
        response.CommonPrefixes.forEach((commonPrefix) => {
          if (commonPrefix.Prefix) {
            subdirectories.add(commonPrefix.Prefix)
          }
        })
      }

      continuationToken = response.NextContinuationToken
    } catch (error) {
      console.error('Error listing objects:', error)
      throw error
    }
  } while (continuationToken)

  const result = Array.from(subdirectories)
  sortStrings(result)
  return result
}

export async function listSubdirectoriesWithoutUserName(
  prefix: string,
): Promise<string[]> {
  const dirs = await listSubdirectories(prefix)
  return dirs.map((i) => removeUserNameFromPath(i))
}

function removeUserNameFromPath(dir: string) {
  // remove user name at the beginning
  const tmp = dir.split('/')
  tmp.shift()
  return tmp.join('/')
}

export async function listSubdirectoriesWithInfo(
  prefix: string = '',
): Promise<SubDirItem[]> {
  const subDirs = await listSubdirectories(prefix)
  const allInfo = await Promise.all(subDirs.map((dir) => getDirectoryInfo(dir)))
  const allInfoWithDir = allInfo.map((info, idx) => ({
    info,
    dir: subDirs[idx],
  }))
  const items: SubDirItem[] = []
  for (const { info, dir } of allInfoWithDir) {
    if (info.type === 'invalid') continue

    const path = removeUserNameFromPath(dir)

    items.push({ path, info })
  }
  return items
}

async function getDirectoryInfo(prefix: string): Promise<DirectoryInfo> {
  const name = prefix.replace(/\/$/, '').split('/').pop() || ''
  // Ensure prefix ends with '/' for directory check
  const normalizedPrefix = prefix.endsWith('/') ? prefix : prefix + '/'

  try {
    // Get just the first subdirectory
    const firstSubdir = await getFirstSubdirectory(normalizedPrefix)

    if (!firstSubdir) {
      return { type: 'invalid' }
    }

    const imagePath = normalizedPrefix + firstSubdir + '/img.avif'

    if (await fileExists(imagePath)) {
      return {
        type: 'book',
        imagePath: createSignedUrl(CLOUDFRONT_PATH + imagePath),
        name,
      }
    } else {
      return { type: 'directory', name }
    }
  } catch (error) {
    console.error('Error checking directory:', error)
    return { type: 'invalid' }
  }
}

async function getFirstSubdirectory(prefix: string): Promise<string | null> {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    Delimiter: '/',
    MaxKeys: 1,
  }

  const command = new ListObjectsV2Command(params)
  const response = await s3.send(command)

  if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
    const firstPrefix = response.CommonPrefixes[0].Prefix
    if (firstPrefix) {
      const pathWithoutPrefix = firstPrefix.substring(prefix.length)
      return pathWithoutPrefix.replace(/\/$/, '')
    }
  }

  return null
}

async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3.send(command)
    return true
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error // Re-throw other errors
  }
}

async function getJsonFile<T = any>(key: string): Promise<T> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3.send(command)

    if (!response.Body) {
      throw new Error('File body is empty')
    }

    // Convert stream to string
    const bodyString = await response.Body.transformToString()

    // Parse JSON and return
    return JSON.parse(bodyString) as T
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      throw `JSON file not found: ${key}`
    }
    if (error instanceof SyntaxError) {
      throw `Invalid JSON in file: ${key}`
    }
    throw error
  }
}

export async function getPageInfo(bookPath: string) {
  const imagePath = bookPath + 'img.avif'
  const ocr = await getJsonFile(bookPath + 'ocr.json')
  return {
    imgPath: createSignedUrl(CLOUDFRONT_PATH + imagePath),
    ocr,
  }
}

export async function updateJsonFile(
  key: string,
  jsonObject: any,
): Promise<void> {
  try {
    // First check if the file exists
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3.send(headCommand)

    // File exists, proceed with update
    const jsonString = JSON.stringify(jsonObject, null, 2)

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: jsonString,
      ContentType: 'application/json',
    })

    await s3.send(putCommand)
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      throw new Error(`JSON file does not exist: ${key}`)
    }
    throw error
  }
}

export async function deleteS3Folder(prefix: string): Promise<void> {
  let continuationToken: string | undefined = undefined

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    })

    const listResponse: ListObjectsV2CommandOutput = await s3.send(listCommand)
    const objects = listResponse.Contents

    if (!objects || objects.length === 0) {
      return
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
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
  // to update: in "bahaviors" of cloudfrond, edit
  return url
  return getSignedUrl({
    keyPairId: CLOUDFRONT_KEYPAIR_ID!,
    privateKey: CLOUDFRONT_PRIVATE_KEY!,
    url: url,
    dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
  })
}

export async function loopEachOCRJson(
  key: string,
  cb: (v: { txt: string }) => void,
) {
  const dirs = await listSubdirectories(key)
  for (const dir of dirs) {
    const ocr = await getJsonFile(dir + 'ocr.json')
    cb(ocr)
  }
}

function sortStrings(array: string[]) {
  array.sort((a, b) => a.localeCompare(b, 'ja-JP'))
}
