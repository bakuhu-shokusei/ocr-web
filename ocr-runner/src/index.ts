import { resolve, posix } from 'node:path'
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import {
  getBucketStructure,
  downloadS3FileWithRename,
  DirectoryTree,
  BUCKET_NAME,
  uploadJsonToS3,
  terminateSelf,
} from './s3'

async function start() {
  const tree = await getBucketStructure(BUCKET_NAME)
  const tasks = getUnfinishedTasks(tree)
  await downloadImagesFromS3(tasks)
  await runOCR()
  await uploadOCRResults(tasks)
  await terminateSelf('terminate')
}

const BUFFER_PATH = resolve(process.cwd(), 'images_buffer')
const INPUT_PATH = resolve(BUFFER_PATH, 'input')
const OUTPUT_PATH = resolve(BUFFER_PATH, 'output')

type Task = {
  user: string
  book: string
  page: string
  imageName: string
}

function getUnfinishedTasks(tree: DirectoryTree): Task[] {
  const tasks: Task[] = []
  const users = Object.keys(tree)
  users.forEach((user) => {
    const books = tree[user]
    Object.keys(books).forEach((bookName) => {
      const pages = (tree[user] as DirectoryTree)[bookName] as DirectoryTree
      Object.keys(pages).forEach((page) => {
        const files = pages[page] as DirectoryTree
        const imageName = Object.keys(files).find((i) => i.startsWith('img.'))!
        if (!files['ocr.json']) {
          tasks.push({ user, book: bookName, page, imageName })
        }
      })
    })
  })
  return tasks
}

async function downloadImagesFromS3(tasks: Task[]) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const imageSuffix = task.imageName.split('.').pop()
    const imgPath = resolve(INPUT_PATH, 'img', `${i}.${imageSuffix}`)
    await downloadS3FileWithRename(
      BUCKET_NAME,
      posix.join(task.user, task.book, task.page, task.imageName),
      imgPath,
    )
  }
}

// The following runs in git bash
// docker run --rm --gpus all -v //c/Users/shenm/repos/ocr-web/ocr-runner/images_buffer:/images_buffer -w //root/kotenocr_cli kotenocr-cli-py37:latest python main.py infer //images_buffer/input //images_buffer/output -a
function runOCR(): Promise<void> {
  return new Promise((resolve, reject) => {
    // prettier-ignore
    const dockerArgs = [
      "run",
      "--rm",
      "--gpus", "all",
      "-v", `${BUFFER_PATH}:/images_buffer`,
      "-w", "/root/kotenocr_cli",
      "kotenocr-cli-py37:latest",
      "python", "main.py", "infer",
      "/images_buffer/input",
      "/images_buffer/output",
      "-a"
    ];

    const docker = spawn('docker', dockerArgs, { stdio: 'inherit' })

    docker.on('error', (err) => {
      reject(new Error(`Failed to start docker process: ${err.message}`))
    })

    docker.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Docker process exited with code ${code}`))
      }
    })
  })
}

async function uploadOCRResults(tasks: Task[]) {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    const jsonPath = resolve(OUTPUT_PATH, 'input', 'json', `${i}.json`)
    const jsonContent = JSON.parse(readFileSync(jsonPath).toString())
    jsonContent.txt = jsonContent.contents.map((i: any) => i[4]).join('\n')
    await uploadJsonToS3(
      jsonContent,
      BUCKET_NAME,
      posix.join(task.user, task.book, task.page, 'ocr.json'),
    )
  }
}

start().then(() => {
  console.log('done')
})
