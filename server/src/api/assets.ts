import { resolve, parse } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import express, { type Request, type Response } from 'express'
import multer from 'multer'
import { ASSETS_PATH } from '../env'
import { verifyLogin } from './login'
import { getAssets, saveOCRFile } from '@/utils/assets'
import { taskRunner } from '@/utils/task-runner'

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
    taskRunner.check()
    res.json({
      status: 'success',
    })
  },
)

assetsRouter.post(
  '/api/save-ocr-info',
  verifyLogin,
  (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { bookName, page, data } = req.body
    saveOCRFile(userName, bookName, page, data)
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
