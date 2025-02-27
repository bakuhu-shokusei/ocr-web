export interface Box {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
  text: string
}

type BoxOutput = [number, number, number, number, string]
export type JsonOutput = {
  contents: BoxOutput[]
  imginfo: {
    img_width: number
    img_height: number
    img_path: string
    img_name: string
  }
  txt: string
}

export type PageInfo = {
  boxes: Box[]
  text: string
}

export function convertFormat(old: JsonOutput): PageInfo {
  const [width, height] = [old.imginfo.img_width, old.imginfo.img_height]
  const boxes = old.contents.map((i) => ({
    xmin: i[0] / width,
    ymin: i[1] / height,
    xmax: i[2] / width,
    ymax: i[3] / height,
    text: i[4],
  }))
  return { text: old.txt, boxes }
}

export function saveBack(pageInfo: PageInfo, old: JsonOutput): JsonOutput {
  const [width, height] = [old.imginfo.img_width, old.imginfo.img_height]
  return {
    contents: pageInfo.boxes.map((i) => [
      Math.round(i.xmin * width),
      Math.round(i.ymin * height),
      Math.round(i.xmax * width),
      Math.round(i.ymax * height),
      i.text,
    ]),
    imginfo: old.imginfo,
    txt: pageInfo.text,
  }
}

export function genKey(box: Box) {
  const key = [box.xmin, box.ymin, box.xmax, box.ymax]
    .map((i) => Math.round(i * 10 ** 6))
    .join('-')
  return key
}
