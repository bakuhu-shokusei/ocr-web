import { resolve, posix, parse } from 'node:path'
import {
  readdirSync,
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
} from 'node:fs'
import multer from 'multer'
import { ASSETS_PATH, CLOUDFRONT_PATH } from '../env'
import {
  getBucketStructure,
  uploadDirectoryToS3,
  uploadJsonToS3,
  BUCKET_NAME,
  DirectoryTree,
  deleteS3Folder,
  createSignedUrl,
} from './s3'

interface Page {
  imgPath: string
  pageName: string
  ocrPath?: string
}
type Books = Record<string, Page[]>

createDirIfNotExist(resolve(ASSETS_PATH!))

function createDirIfNotExist(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}
export async function getAssets(userName: string): Promise<Books> {
  const tree = await getBucketStructure(BUCKET_NAME, userName)
  const bookNames = Object.keys(tree)
  const books: Books = {}
  bookNames.forEach((bookName) => {
    books[bookName] = books[bookName] || []

    const pages = Object.keys(tree[bookName])
    sortStrings(pages)
    pages.forEach((page) => {
      const files = (tree[bookName] as DirectoryTree)[page] as DirectoryTree
      const innerFiles = Object.keys(files)
      const imgName = innerFiles.find((i) => i.startsWith('img'))!
      const imgPath = files[imgName] as string
      const ocrPath = files['ocr.json'] as string

      books[bookName].push({
        imgPath: createSignedUrl(CLOUDFRONT_PATH + imgPath),
        pageName: page,
        ocrPath,
      })
    })
  })
  return books
}

const BUFFER_PATH = resolve(process.cwd(), 'images_buffer')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.body
    const { name } = parse(decodeURIComponent(file.originalname))
    const path = resolve(BUFFER_PATH, userName, bookName, name)
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true })
    }
    cb(null, path)
  },
  filename(req, file, cb) {
    const { ext } = parse(decodeURIComponent(file.originalname))
    cb(null, `img${ext}`)
  },
})
export const multerUpload = multer({
  storage,
})

export async function uploadImages(userName: string, bookName: string) {
  const bookPath = resolve(BUFFER_PATH, userName, bookName)
  await uploadDirectoryToS3(
    bookPath,
    BUCKET_NAME,
    posix.join(userName, bookName),
  )
  rmSync(bookPath, { recursive: true })
}

export async function saveOCRFile(
  userName: string,
  bookName: string,
  page: string,
  data: any,
) {
  await uploadJsonToS3(
    data,
    BUCKET_NAME,
    posix.join(userName, bookName, page, 'ocr.json'),
  )
}

function sortStrings(array: string[]) {
  array.sort((a, b) => a.localeCompare(b, 'ja-JP'))
}

export function getBookAsText(userName: string, bookName: string): string {
  const path = resolve(ASSETS_PATH!, userName, bookName)
  if (!existsSync(path)) return ''
  const pages = readdirSync(path, {
    withFileTypes: true,
  })
    .filter((i) => i.isDirectory())
    .map((i) => i.name)
  sortStrings(pages)
  return pages
    .map((page) => {
      const ocrFilePath = resolve(
        ASSETS_PATH!,
        userName,
        bookName,
        page,
        'ocr.json',
      )
      const ocrInfo = JSON.parse(readFileSync(ocrFilePath).toString())
      return ocrInfo.txt
    })
    .join('\n\n')
}

export async function deleteBook(userName: string, bookName: string) {
  await deleteS3Folder(BUCKET_NAME, posix.join(userName, bookName))
}

interface SearchResult {
  [s: string]: {
    index: number // index of array
    matchedText: string
    pageName: string
  }[]
}
export function searchText(
  userName: string,
  bookNames: string[],
  keyword: string,
) {
  const result: SearchResult = {}
  for (const bookName of bookNames) {
    const matchedPages: SearchResult[string] = []

    const pages = readdirSync(resolve(ASSETS_PATH!, userName, bookName), {
      withFileTypes: true,
    })
      .filter((i) => i.isDirectory())
      .map((i) => i.name)
    sortStrings(pages)
    for (let i = 0; i < pages.length; i++) {
      const ocrFilePath = resolve(
        ASSETS_PATH!,
        userName,
        bookName,
        pages[i],
        'ocr.json',
      )
      const ocrInfo = JSON.parse(readFileSync(ocrFilePath).toString())
      const txtContent = ocrInfo.txt
      if (typeof txtContent === 'string') {
        const lines = txtContent.split('\n')
        const matchedLines = lines.filter((l) => l.includes(keyword))
        if (matchedLines.length > 0) {
          matchedPages.push({
            index: i,
            matchedText: matchedLines.join('\n'),
            pageName: pages[i],
          })
        }
      }
    }

    if (matchedPages.length > 0) {
      result[bookName] = matchedPages
    }
  }
  return result
}
