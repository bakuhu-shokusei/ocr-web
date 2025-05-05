import express, { type Request, type Response } from 'express'
import { verifyLogin } from './login'
import {
  deleteBook,
  getAssets,
  getBookAsText,
  saveOCRFile,
  searchText,
  uploadImages,
  multerUpload,
} from '@/utils/assets'

export const assetsRouter = express.Router()

assetsRouter.post(
  '/api/upload',
  verifyLogin,
  multerUpload.fields([{ name: 'image' }]),
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.body
    await uploadImages(userName, bookName)

    res.json({
      status: 'success',
    })
  },
)

assetsRouter.post(
  '/api/save-ocr-info',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { bookName, page, data } = req.body
    await saveOCRFile(userName, bookName, page, data)
    res.json({
      status: 'success',
    })
  },
)

assetsRouter.get(
  '/api/list-assets',
  verifyLogin,
  async (req: Request, res: Response) => {
    const books = await getAssets((req as any).currentUser.userName)
    res.json({
      status: 'success',
      data: books,
    })
  },
)

assetsRouter.get(
  '/api/download-book',
  verifyLogin,
  (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.query
    const content = getBookAsText(userName, bookName as string)
    res.setHeader('Content-disposition', `attachment; filename=${bookName}.txt`)
    res.setHeader('Content-type', 'text/plain')
    res.send(content)
  },
)

assetsRouter.delete(
  '/api/delete-book',
  verifyLogin,
  async (req: Request, res: Response) => {
    const userName: string = (req as any).currentUser.userName
    const { bookName } = req.body
    await deleteBook(userName, bookName)
    res.json({
      status: 'success',
    })
  },
)

assetsRouter.post('/api/search', verifyLogin, (req: Request, res: Response) => {
  const userName: string = (req as any).currentUser.userName
  const { keyword, bookNames } = req.body
  const result = searchText(userName, bookNames, keyword)
  res.json({
    status: 'success',
    data: result,
  })
})
