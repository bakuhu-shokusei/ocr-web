export interface Box {
  uuid: string
  xmin: number
  ymin: number
  xmax: number
  ymax: number
  text: string
}

export type BoxOutput = [number, number, number, number, string]
export type JsonOutput = {
  contents: BoxOutput[]
  imginfo: {
    img_width: number
    img_height: number
  }
  txt: string
}

export type PageInfo = {
  boxes: Box[]
  text: string
}

export function convertFormat(
  contents: BoxOutput[],
  width: number,
  height: number,
): Box[] {
  return contents.map((i) => ({
    uuid: generateUUID(),
    xmin: i[0] / width,
    ymin: i[1] / height,
    xmax: i[2] / width,
    ymax: i[3] / height,
    text: i[4],
  }))
}

export function saveBack(
  boxes: Box[],
  width: number,
  height: number,
): BoxOutput[] {
  return boxes.map((i) => [
    Math.round(i.xmin * width),
    Math.round(i.ymin * height),
    Math.round(i.xmax * width),
    Math.round(i.ymax * height),
    i.text,
  ])
}

export function generateUUID() {
  let d = new Date().getTime()
  let d2 =
    (typeof performance !== 'undefined' &&
      performance.now &&
      performance.now() * 1000) ||
    0
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = Math.random() * 16
    if (d > 0) {
      r = (d + r) % 16 | 0
      d = Math.floor(d / 16)
    } else {
      r = (d2 + r) % 16 | 0
      d2 = Math.floor(d2 / 16)
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
