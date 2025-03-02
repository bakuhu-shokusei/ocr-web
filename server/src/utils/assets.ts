import { resolve, parse } from 'node:path'
import {
  readdirSync,
  openAsBlob,
  writeFileSync,
  existsSync,
  readFileSync,
  rmSync,
  mkdirSync,
} from 'node:fs'
import { ASSETS_PATH } from '../env'
import { logger } from './logger'

const log = (s: string) => logger.info(`[assets] ${s}`)

interface Page {
  imgPath: string
  pageName: string
  ocrPath?: string
}
type Books = Record<string, Page[]>

function getUsers(): string[] {
  const userNames = readdirSync(resolve(ASSETS_PATH!), {
    withFileTypes: true,
  }).filter((i) => i.isDirectory())
  return userNames.map((i) => i.name)
}
function getImageName(userName: string, bookName: string, page: string) {
  const innerFiles = readdirSync(
    resolve(ASSETS_PATH!, userName, bookName, page),
  )
  return innerFiles.find((i) => i.startsWith('img'))!
}
function createDirIfNotExist(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}
export function getAssets(userName: string): Books {
  createDirIfNotExist(resolve(ASSETS_PATH!, userName))
  const bookNames = readdirSync(resolve(ASSETS_PATH!, userName), {
    withFileTypes: true,
  }).filter((i) => i.isDirectory())
  const books: Books = {}
  bookNames
    .map((i) => i.name)
    .forEach((bookName) => {
      const pages = readdirSync(resolve(ASSETS_PATH!, userName, bookName), {
        withFileTypes: true,
      })
        .filter((i) => i.isDirectory())
        .map((i) => i.name)
      sortStrings(pages)
      pages.forEach((page) => {
        const innerFiles = readdirSync(
          resolve(ASSETS_PATH!, userName, bookName, page),
        )
        books[bookName] = books[bookName] || []
        const getFileUrl = (fileName: string) => {
          let p = ['', 'assets', userName, bookName, page, fileName].join('/')
          return encodeURI(p)
        }
        const imgPath = getFileUrl(getImageName(userName, bookName, page))
        const ocrPath = innerFiles.includes('ocr.json')
          ? getFileUrl('ocr.json')
          : undefined

        books[bookName].push({
          imgPath,
          pageName: page,
          ocrPath,
        })
      })
    })
  return books
}

export function saveOCRFile(
  userName: string,
  bookName: string,
  page: string,
  data: any,
) {
  const base = resolve(ASSETS_PATH!, userName, bookName, page)
  if (!existsSync(base)) return
  const path = resolve(base, 'ocr.json')
  writeFileSync(path, JSON.stringify(data))
}

async function uploadFiles(
  userName: string,
  bookName: string,
  pages: string[],
  remoteHost: string,
) {
  const files = await Promise.all(
    pages.map((page) =>
      openAsBlob(
        resolve(
          ASSETS_PATH!,
          userName,
          bookName,
          page,
          getImageName(userName, bookName, page),
        ),
      ),
    ),
  )
  const formData = new FormData()

  formData.append('bookName', bookName)
  files.forEach((file, idx) => {
    const { ext } = parse(getImageName(userName, bookName, pages[idx]))
    formData.append('image', file, `${idx}${ext}`)
  })
  log('upload images')
  const response = await fetch(`http://${remoteHost}:3000/start-ocr`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()
  if (data.status !== 'ok') {
    throw 'ocr api failed'
  }
  log('got ocr results')
  const result = data.result

  // write json to files
  pages.forEach((page, idx) => {
    const jsonData = result[`${idx}.json`]
    saveOCRFile(userName, bookName, page, jsonData)
  })
}

export function hasNoneDoneImages(): boolean {
  const users = getUsers()
  for (const user of users) {
    const books = getAssets(user)
    const pagesByBook = Object.values(books)
    const hasUnfinished = pagesByBook.some((pages) => {
      return pages.some((page) => !page.ocrPath)
    })
    if (hasUnfinished) return true
  }
  return false
}

export function getNextToDo(): (remoteHost: string) => Promise<void> {
  const users = getUsers()
  for (const user of users) {
    const books = getAssets(user)
    const bookNames = Object.keys(books)
    const unfinishedBook = bookNames.find((bn) => {
      return books[bn].some((page) => !page.ocrPath)
    })
    if (unfinishedBook) {
      const unfinishedPages = books[unfinishedBook].filter(
        (page) => !page.ocrPath,
      )
      return async (remoteHost) => {
        log(`found unfinished book: ${unfinishedBook}`)
        await uploadFiles(
          user,
          unfinishedBook,
          unfinishedPages.map((i) => i.pageName),
          remoteHost,
        )
      }
    }
  }
  return async () => {}
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

export function deleteBook(userName: string, bookName: string) {
  const path = resolve(ASSETS_PATH!, userName, bookName)
  if (existsSync(path)) {
    rmSync(path, {
      recursive: true,
      force: true,
    })
  }
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
