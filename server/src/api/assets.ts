import { resolve, parse } from 'node:path'
import { mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import express, { type Request, type Response } from 'express'
import multer from 'multer'
import { ASSETS_PATH } from '../env'
import { verifyLogin } from './login'

export const assetsRouter = express.Router()

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.body
    const { name } = parse(decodeURIComponent(file.originalname))
    const path = resolve(ASSETS_PATH!, userName, bookName, name)
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
const upload = multer({
  storage,
})

assetsRouter.post(
  '/api/upload',
  verifyLogin,
  upload.fields([{ name: 'image' }]),
  (req: Request, res: Response) => {
    res.json({
      status: 'success',
    })
  },
)

assetsRouter.get(
  '/api/list-assets',
  verifyLogin,
  (req: Request, res: Response) => {
    const books = getAssets((req as any).currentUser.userName)
    res.json({
      status: 'success',
      data: books,
    })
  },
)

interface Page {
  imgPath: string
  pageName: string
  ocrResult: JsonOutput | null
}
type Books = Record<string, Page[]>
type BoxOutput = [number, number, number, number, string]
type JsonOutput = {
  contents: BoxOutput[]
  imginfo: {
    img_width: number
    img_height: number
    img_path: string
    img_name: string
  }
}

function getAssets(userName: string) {
  const bookNames = readdirSync(resolve(ASSETS_PATH!, userName))
  const books: Books = {}
  bookNames.forEach((bookName) => {
    const pages = readdirSync(resolve(ASSETS_PATH!, userName, bookName))
    pages.forEach((page) => {
      const innerFiles = readdirSync(
        resolve(ASSETS_PATH!, userName, bookName, page),
      )
      books[bookName] = books[bookName] || []
      let imgPath = [
        '',
        'assets',
        userName,
        bookName,
        page,
        innerFiles.find((i) => i.startsWith('img'))!,
      ].join('/')
      imgPath = encodeURI(imgPath)

      const ocrJsonPath = resolve(
        ASSETS_PATH!,
        userName,
        bookName,
        page,
        'ocr.json',
      )
      let ocrResult: JsonOutput | null = null
      if (existsSync(ocrJsonPath)) {
        try {
          ocrResult = JSON.parse(readFileSync(ocrJsonPath).toString())
        } catch {}
      }

      books[bookName].push({
        imgPath,
        pageName: page,
        ocrResult,
      })
    })
  })
  return books
}
