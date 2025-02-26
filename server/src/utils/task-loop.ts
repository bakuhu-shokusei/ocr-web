class TaskLoop {
  active: boolean

  constructor(
    private hasMoreTasks: () => boolean,
    private getNextTask: () => () => Promise<void>,
  ) {
    this.active = false
  }

  private async loop() {
    if (!this.hasMoreTasks()) {
      this.active = false
      return
    }
    this.active = true
    const next = this.getNextTask()
    await next()
    this.loop()
  }

  check() {
    if (this.active) return
    this.loop()
  }
}
