import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import { users } from '../env'

export const loginRouter = express.Router()

loginRouter.post('/api/login', (req: Request, res: Response) => {
  const { userName, password } = req.body
  const user = users.getUser(userName, password)
  if (user) {
    res.cookie('SessionID', user.sessionId)
    res.status(200).json({
      status: 'success',
    })
  } else {
    res.status(401).json({
      status: 'failed',
    })
  }
})

export function verifyLogin(req: Request, res: Response, next: NextFunction) {
  const user = users.getUserBySessionId(req.cookies['SessionID'])
  if (user) {
    ;(req as any).currentUser = user
    next()
  } else {
    res.status(401).json({ message: 'Please login' })
  }
}
