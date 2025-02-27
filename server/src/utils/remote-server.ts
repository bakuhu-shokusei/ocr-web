enum Status {
  NotReady,
  Starting,
  Ready,
  Failed,
}

async function getCurrentStatus(): Promise<Status> {
  return Status.Ready
}

export class RemoteServer {
  status: Status

  constructor() {
    this.status = Status.NotReady
    this.updateStatus()
  }

  private async updateStatus() {
    this.status = await getCurrentStatus()
  }

  async waitUntilReady(): Promise<string> {
    if (this.status === Status.Ready) return Promise.resolve('localhost')
    return new Promise((res) => {})
  }
}

