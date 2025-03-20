import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { loginRouter, verifyLogin } from '@/api/login'
import { assetsRouter } from '@/api/assets'
import { ASSETS_PATH } from './env'

const app = express()
app.use(cookieParser())
app.use(bodyParser.json())
const port = 3001

app.use(loginRouter)
app.use(assetsRouter)
app.use('/assets', verifyLogin, express.static(ASSETS_PATH!))
app.use('/logs', verifyLogin, express.static('logs'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
