import express, { type Request, type Response } from 'express'
import { verifyLogin } from './login'
import { listSubdirectoriesWithInfo, getPageByBook } from '@/utils/assets'
import { db } from '@/db/ocr'

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
    const directories = await listSubdirectoriesWithInfo(
      req.query.path as string,
    )

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
    const bookId = req.query.bookId
    const total = await db.getNumberOfPages(parseInt(bookId as string))

    res.json({
      status: 'success',
      data: total,
    })
  },
)

// B2. for a page, get its image url and ocr.json
assetsRouter.get(
  '/api/get-page-info',
  verifyLogin,
  async (req: Request, res: Response) => {
    const bookId = parseInt(req.query.bookId as string)
    const page = parseInt(req.query.page as string)
    try {
      const pages = await getPageByBook(bookId, page)

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

// C1.
assetsRouter.post(
  '/api/save-ocr-info',
  verifyLogin,
  async (req: Request, res: Response) => {
    const { pageId, data, text } = req.body
    await db.updatePageOCRAndText(pageId, data, text)
    res.json({
      status: 'success',
    })
  },
)

// D1
assetsRouter.get(
  '/api/get-book-name',
  verifyLogin,
  async (req: Request, res: Response) => {
    const bookId = parseInt(req.query.bookId as string)
    try {
      const book = await db.getBookById(bookId)

      res.json({
        status: 'success',
        name: book!.name,
      })
    } catch {
      res.json({
        status: 'failed',
      })
    }
  },
)

assetsRouter.get(
  '/api/download-book',
  verifyLogin,
  async (req: Request, res: Response) => {
    const bookId = parseInt(req.query.bookId as string)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const text = await db.getBookText(bookId)
    res.send(text)
  },
)

assetsRouter.delete(
  '/api/delete-book',
  verifyLogin,
  async (req: Request, res: Response) => {
    const { bookId } = req.body
    await db.deleteBook(bookId)
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
