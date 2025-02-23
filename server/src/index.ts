import express from 'express'
import cors from 'cors'
import { loginRouter } from '@/api/login'

const app = express()
app.use(cors())
const port = 3000

app.use('/login', loginRouter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
