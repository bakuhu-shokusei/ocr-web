enum Status {
  NotReady,
  Starting,
  Ready,
  Failed,
}

async function getCurrentStatus(): Promise<Status> {
  return Status.Ready
}

class RemoteServer {
  status: Status

  constructor() {
    this.status = Status.NotReady
    this.updateStatus()
  }

  private async updateStatus() {
    this.status = await getCurrentStatus()
  }

  async waitUntilReady() {
    if (this.status === Status.Ready) return Promise.resolve()
    return new Promise((res) => {})
  }
}

export const remoteServer = new RemoteServer()
