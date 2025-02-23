import express, { type Request, type Response } from 'express'

export const loginRouter = express.Router()

loginRouter.get('/', (_req: Request, res: Response) => {
  res.send('test')
})
