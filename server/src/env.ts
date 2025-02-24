import { createHash } from 'node:crypto'
import * as dotenv from 'dotenv'
dotenv.config({ debug: true })

const { USERS, PWS, ASSETS_PATH } = process.env

class Users {
  public users: User[]
  constructor() {
    const names = (USERS || '').split(',')
    const pws = (PWS || '').split(',')
    this.users = []
    for (let i = 0; i < names.length; i++) {
      this.users.push(new User(names[i], pws[i]))
    }
  }

  getUser(userName: string, password: string) {
    return this.users.find(
      (i) => i.userName === userName && i.password === password,
    )
  }

  getUserBySessionId(sessionId: string) {
    return this.users.find((i) => i.sessionId === sessionId)
  }
}

class User {
  public sessionId: string
  constructor(
    public userName: string,
    public password: string,
  ) {
    this.sessionId = createHash('md5')
      .update(`${userName}${password}`)
      .digest('hex')
      .substring(0, 20)
  }
}

export const users = new Users()

export { Users, ASSETS_PATH }
