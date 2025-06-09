import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import multer from 'multer'
import { db, type Page } from '@/db/ocr'
import { createSignedUrl } from './s3'
import { CLOUDFRONT_PATH } from '@/env'

const BUFFER_PATH = path.resolve(process.cwd(), 'images_buffer')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.body
    const { name } = path.parse(decodeURIComponent(file.originalname))
    const _path = path.resolve(BUFFER_PATH, userName, bookName, name)
    if (!existsSync(_path)) {
      mkdirSync(_path, { recursive: true })
    }
    cb(null, _path)
  },
  filename(req, file, cb) {
    const { ext } = path.parse(decodeURIComponent(file.originalname))
    cb(null, `img${ext}`)
  },
})
export const multerUpload = multer({
  storage,
})

type SubDirItem = {
  path: string
  info: DirectoryInfo
}

type DirectoryInfo =
  | {
      type: 'book'
      imagePath: string
      name: string
      id: number
    }
  | {
      type: 'directory'
      name: string
    }

export async function listSubdirectoriesWithInfo(
  _path: string,
): Promise<SubDirItem[]> {
  const result = await db.listDirectoryContents(_path)

  if (result.success) {
    const existInfo = await db.checkBooksExist(result.data)

    const normalDirs = result.data.filter((_, i) => existInfo[i] === null)
    const normalSubDirItems: SubDirItem[] = normalDirs.map((p) => {
      const pathToReturn = p
      const pageName = p.replace(/\/$/, '').split('/').pop() || ''
      return {
        path: pathToReturn,
        info: {
          type: 'directory' as const,
          name: pageName,
        },
      }
    })

    const bookDirs = result.data.filter((_, i) => existInfo[i] !== null)
    const bookIds = existInfo.filter((i) => i !== null)
    const images = await db.getFirstPageImages(bookDirs)
    const bookSubDirItems: SubDirItem[] = bookDirs.map((p, i) => {
      const pathToReturn = p
      const pageName = p.replace(/\/$/, '').split('/').pop() || ''
      return {
        path: pathToReturn,
        info: {
          type: 'book' as const,
          imagePath: createSignedUrl(CLOUDFRONT_PATH! + images[i]),
          name: pageName,
          id: bookIds[i],
        },
      }
    })

    return [...normalSubDirItems, ...bookSubDirItems]
  } else {
    return []
  }
}

export async function getPageByBook(
  bookId: number,
  page: number,
): Promise<Page> {
  const detail = (await db.getBookPages(bookId, { page, limit: 1 })).data[0]
  detail.image_url = createSignedUrl(CLOUDFRONT_PATH! + detail.image_url)
  return detail
}
