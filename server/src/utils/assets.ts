import { resolve, parse } from 'node:path'
import { readdirSync, openAsBlob, writeFileSync } from 'node:fs'
import { ASSETS_PATH } from '../env'

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
export function getAssets(userName: string): Books {
  const bookNames = readdirSync(resolve(ASSETS_PATH!, userName), {
    withFileTypes: true,
  }).filter((i) => i.isDirectory())
  const books: Books = {}
  bookNames
    .map((i) => i.name)
    .forEach((bookName) => {
      const pages = readdirSync(resolve(ASSETS_PATH!, userName, bookName), {
        withFileTypes: true,
      }).filter((i) => i.isDirectory())
      pages
        .map((i) => i.name)
        .forEach((page) => {
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

async function uploadFiles(
  userName: string,
  bookName: string,
  pages: string[],
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
  const response = await fetch(`http://localhost:3000/start-ocr`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()
  if (data.status !== 'ok') {
    throw 'ocr api failed'
  }
  const result = data.result

  // write json to files
  pages.forEach((page, idx) => {
    const path = resolve(ASSETS_PATH!, userName, bookName, page, 'ocr.json')
    const jsonData = result[`${idx}.json`]
    writeFileSync(path, JSON.stringify(jsonData))
  })
}

function hasNoneDoneImages(): boolean {
  const users = getUsers()
  for (const user of users) {
    const books = getAssets(user)
    const hasUnfinished = Object.values(books).some((pages) => {
      return pages.some((page) => !page.ocrPath)
    })
    if (hasUnfinished) return true
  }
  return false
}
