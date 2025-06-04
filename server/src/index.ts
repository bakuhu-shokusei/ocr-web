import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import { loginRouter } from '@/api/login'
import { assetsRouter } from '@/api/assets'

const app = express()
app.use(cookieParser())
app.use(bodyParser.json())
const port = 3001

app.use(loginRouter)
app.use(assetsRouter)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
