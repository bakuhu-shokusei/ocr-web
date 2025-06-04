import { posix } from 'node:path'
import express, { type Request, type Response } from 'express'
import { verifyLogin } from './login'
import {
  listSubdirectoriesWithoutUserName,
  listSubdirectoriesWithInfo,
  getPageInfo,
  updateJsonFile,
  loopEachOCRJson,
  deleteS3Folder,
} from '@/utils/s3'

export const assetsRouter = express.Router()

// assetsRouter.post(
//   '/api/upload',
//   verifyLogin,
//   multerUpload.fields([{ name: 'image' }]),
//   async (req: Request, res: Response) => {
//     const userName: string = (req as any).currentUser.userName
//     const { bookName } = req.body
//     await uploadImages(userName, bookName)
//
//     res.json({
//       status: 'success',
//     })
//   },
// )

// A. list folders of a path
assetsRouter.get(
  '/api/list-directory',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName = (req as any).currentUser.userName
    const path = req.query.path
    const prefix = [userName, path].join('/')
    const directories = await listSubdirectoriesWithInfo(prefix)

    res.json({
      status: 'success',
      data: directories,
    })
  },
)

// B1. for a book path, list all its pages
assetsRouter.get(
  '/api/list-pages',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName = (req as any).currentUser.userName
    const path = req.query.path
    const prefix = [userName, path].join('/')
    const pages = await listSubdirectoriesWithoutUserName(prefix)

    res.json({
      status: 'success',
      data: pages,
    })
  },
)

// B2. for a page, get its image url and ocr.json
assetsRouter.get(
  '/api/get-page-info',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName = (req as any).currentUser.userName
    const path = req.query.path
    const prefix = [userName, path].join('/')
    try {
      const pages = await getPageInfo(prefix)

      res.json({
        status: 'success',
        data: pages,
      })
    } catch {
      res.json({
        status: 'failed',
      })
    }
  },
)

assetsRouter.post(
  '/api/save-ocr-info',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { path, data } = req.body
    await updateJsonFile(posix.join(userName, path, 'ocr.json'), data)
    res.json({
      status: 'success',
    })
  },
)

assetsRouter.get(
  '/api/download-book',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const path = req.query.path as string
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    await loopEachOCRJson(posix.join(userName, path), (ocr) => {
      res.write(ocr.txt)
      res.write('\n\n')
    })
    res.end()
  },
)

assetsRouter.delete(
  '/api/delete-book',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { path } = req.body
    await deleteS3Folder(posix.join(userName, path))
    res.json({
      status: 'success',
    })
  },
)

// assetsRouter.post('/api/search', verifyLogin, (req: Request, res: Response) => {
//   const userName: string = (req as any).currentUser.userName
//   const { keyword, bookNames } = req.body
//   const result = searchText(userName, bookNames, keyword)
//   res.json({
//     status: 'success',
//     data: result,
//   })
// })
