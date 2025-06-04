import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { convertFormat, saveBack } from '../utils'
import { saveOCRJson, listPages, getPageInfo } from '../api'
import type { Box, JsonOutput } from '../utils'

interface EditStatus {
  boxes: Box[]
  selectedIndex: number // selected box
}
interface Detail {
  ready: boolean
  imageUrl: string
  textContent: string
  textContentCopy: string
  layout: {
    boxes: Box[] // original
    editHistory: EditStatus[]
    editIndex: number // pointer to the current history
  }
}

const INIT_STATE: Detail = {
  ready: false,
  imageUrl: '',
  textContent: '',
  textContentCopy: '',
  layout: {
    boxes: [],
    editHistory: [],
    editIndex: 0,
  },
}

type Mode = 'drag' | 'edit' | 'add'

export const useProofreadingStore = defineStore('proofreading', () => {
  const bookPath = ref('')
  const pageList = ref<string[]>([])
  const currentPage = ref<number>(1) // start from 1
  const pageDetail = ref<Detail>(structuredClone(INIT_STATE))
  const mode = ref<Mode>('drag')
  let ocrInfo: JsonOutput

  const totalPages = computed(() => {
    return pageList.value.length
  })
  const currentPageFullPath = computed(() => {
    return pageList.value[currentPage.value - 1]
  })
  const currentPageName = computed(() => {
    return currentPageFullPath.value.split('/').pop() || ''
  })

  const initialize = async (_bookPath: string, _page: number) => {
    pageDetail.value.ready = false
    if (bookPath.value !== _bookPath) {
      const pages = await listPages(_bookPath)
      if (Array.isArray(pages)) {
        bookPath.value = _bookPath
        pageList.value = pages
        pageDetail.value = structuredClone(INIT_STATE)
      }
    }
    currentPage.value = _page
    await updatePage()
  }

  const updatePage = async () => {
    pageDetail.value.ready = false
    const pageInfo = await getPageInfo(currentPageFullPath.value)
    if (!pageInfo) return
    ocrInfo = pageInfo.ocr
    const boxes = convertFormat(pageInfo.ocr).boxes
    pageDetail.value = {
      ready: true,
      imageUrl: pageInfo.imgPath,
      textContent: pageInfo.ocr.txt,
      textContentCopy: pageInfo.ocr.txt,
      layout: {
        boxes,
        editHistory: [{ boxes: structuredClone(boxes), selectedIndex: -1 }],
        editIndex: 0,
      },
    }
  }

  const getContentToSave = (): JsonOutput => {
    // save json
    const newJson = saveBack(
      {
        boxes: currentEditStatus.value.boxes,
        text: pageDetail.value.textContentCopy,
      },
      ocrInfo,
    )
    return newJson
  }
  const saveChanges = async (showAnimation: boolean) => {
    if (showAnimation) {
      pageDetail.value.ready = false
    }

    const content = getContentToSave()
    await saveOCRJson(currentPageFullPath.value, content)

    if (showAnimation) {
      pageDetail.value.ready = true
    }
  }
  const resetChanges = () => {
    pageDetail.value.textContentCopy = pageDetail.value.textContent
    const layout = pageDetail.value.layout
    layout.editHistory = [
      { boxes: structuredClone(toRaw(layout.boxes)), selectedIndex: -1 },
    ]
    layout.editIndex = 0
  }

  // layout
  const resetSelected = () => {
    currentEditStatus.value.selectedIndex = -1
  }
  const selectBox = (index: number /* start at 0 */) => {
    const boxes = currentEditStatus.value.boxes
    if (index < 0 || index >= boxes.length) return
    currentEditStatus.value.selectedIndex = index
  }
  const currentEditStatus = computed<EditStatus>(() => {
    return pageDetail.value.layout.editHistory[
      pageDetail.value.layout.editIndex
    ]
  })
  const dragBox = (e: { newIndicies: number[]; oldIndicies: number[] }) => {
    const { newIndicies, oldIndicies } = e
    if (
      !currentEditStatus.value ||
      JSON.stringify(newIndicies) === JSON.stringify(oldIndicies)
    )
      return

    const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
    const oldBoxes = newEditStatus.boxes
    const newBoxes: Box[] = Array.from({ length: oldBoxes.length })

    for (let i = 0; i < oldIndicies.length; i++) {
      newBoxes[newIndicies[i]] = oldBoxes[oldIndicies[i]]
    }
    const remaining = oldBoxes.filter((_, i) => !oldIndicies.includes(i))
    for (let i = 0; i < newBoxes.length; i++) {
      while (newBoxes[i] !== undefined) {
        i++
      }
      if (i >= newBoxes.length) break
      newBoxes[i] = remaining.shift()!
    }

    newEditStatus.boxes = newBoxes
    pushHistory(newEditStatus)
  }

  const MAX_RECORD = 10
  const pushHistory = (editStatus: EditStatus) => {
    const layout = pageDetail.value.layout
    layout.editHistory = [
      ...layout.editHistory.slice(0, layout.editIndex + 1),
      editStatus,
    ]
    layout.editIndex++
    while (layout.editHistory.length > MAX_RECORD) {
      layout.editHistory.shift()
      layout.editIndex--
    }
  }

  const undoHistory = () => {
    if (pageDetail.value.layout.editIndex > 0) {
      pageDetail.value.layout.editIndex--
    }
  }
  const canUndo = computed(() => {
    return pageDetail.value.layout.editIndex > 0
  })
  const redoHistory = () => {
    if (
      pageDetail.value.layout.editIndex <
      pageDetail.value.layout.editHistory.length - 1
    ) {
      pageDetail.value.layout.editIndex++
    }
  }
  const canRedo = computed(() => {
    return (
      pageDetail.value.layout.editIndex <
      pageDetail.value.layout.editHistory.length - 1
    )
  })

  const saveBox = (index: number, content: string) => {
    const { boxes } = currentEditStatus.value
    if (boxes[index]) {
      boxes[index].text = content
    }
  }
  const saveDraggedBox = (
    index: number,
    position: Pick<Box, 'xmin' | 'ymin'>,
  ) => {
    const box = currentEditStatus.value.boxes[index]
    if (!box) return
    const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
    const width = box.xmax - box.xmin
    const height = box.ymax - box.ymin
    newEditStatus.boxes[index] = {
      ...box,
      xmin: position.xmin,
      xmax: position.xmin + width,
      ymin: position.ymin,
      ymax: position.ymin + height,
    }
    pushHistory(newEditStatus)
  }
  const saveResizedBox = (
    index: number,
    position: Omit<Box, 'text' | 'uuid'>,
  ) => {
    const box = currentEditStatus.value.boxes[index]
    if (!box) return
    const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
    newEditStatus.boxes[index] = {
      ...box,
      xmin: position.xmin,
      xmax: position.xmax,
      ymin: position.ymin,
      ymax: position.ymax,
    }
    pushHistory(newEditStatus)
  }
  const insertNewBox = (box: Box, isNew: boolean) => {
    if (isNew) {
      const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
      const { boxes, selectedIndex } = newEditStatus
      const newIndex = boxes[selectedIndex] ? selectedIndex + 1 : 0
      boxes.splice(newIndex, 0, box)
      pushHistory(newEditStatus)
      return newIndex
    } else {
      const { boxes, selectedIndex } = currentEditStatus.value
      const newIndex = boxes[selectedIndex] ? selectedIndex + 1 : 0
      boxes[newIndex] = box
      return newIndex
    }
  }
  const deleteBox = () => {
    const { boxes, selectedIndex } = currentEditStatus.value
    if (boxes[selectedIndex]) {
      const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
      newEditStatus.boxes.splice(selectedIndex, 1)
      if (!newEditStatus.boxes[newEditStatus.selectedIndex]) {
        newEditStatus.selectedIndex = -1
      }
      pushHistory(newEditStatus)
    }
  }
  const canDeleteBox = computed(() => {
    const { boxes, selectedIndex } = currentEditStatus.value
    return !!boxes[selectedIndex]
  })
  const replaceTxt = () => {
    const newContent = currentEditStatus.value.boxes
      .map((i) => i.text)
      .join('\n')
    const textArea = document.querySelector<HTMLTextAreaElement>(
      '#txt-content-textarea',
    )
    if (textArea) {
      textArea.focus()
      textArea.select()
      document.execCommand('insertText', false, newContent)
    }
  }

  const setMode = (m: Mode) => {
    mode.value = m
  }

  return {
    bookPath,
    currentPage,
    currentPageName,
    initialize,
    pageDetail,
    totalPages,
    resetChanges,
    saveChanges,
    resetSelected,
    selectBox,
    currentEditStatus,
    dragBox,
    undoHistory,
    canUndo,
    redoHistory,
    canRedo,
    saveBox,
    deleteBox,
    canDeleteBox,
    replaceTxt,
    getContentToSave,
    mode,
    setMode,
    saveDraggedBox,
    saveResizedBox,
    insertNewBox,
  }
})
