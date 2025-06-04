import { resolve, parse } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import multer from 'multer'

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
