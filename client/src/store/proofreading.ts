import axios from 'axios'
import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { useAssetsStore } from './assets'
import { convertFormat, saveBack } from '../utils'
import type { Box, JsonOutput } from '../utils'

interface EditStatus {
  boxes: Box[]
  selectedIndex: number // selected box
}
interface Detail {
  ready: boolean
  imageFileName: string
  imageUrl: string
  textContent: string
  textContentCopy: string
  layout: {
    boxes: Box[] // original
    editHistory: EditStatus[]
    editIndex: number // pointer to the current history
  }
}

export const useProofreadingStore = defineStore('proofreading', () => {
  const { books } = useAssetsStore()

  const book = ref<string>()
  const page = ref<number>() // start from 1
  const pageDetail = ref<Detail>({
    ready: false,
    imageFileName: '',
    imageUrl: '',
    textContent: '',
    textContentCopy: '',
    layout: {
      boxes: [],
      editHistory: [],
      editIndex: 0,
    },
  })
  let ocrInfo: JsonOutput

  const totalPages = computed(() => {
    if (!book.value) return 0
    return books[book.value].length ?? 0
  })
  const draftChanged = computed(() => {
    return pageDetail.value.textContent !== pageDetail.value.textContentCopy
  })

  const initialize = (_book: string, _page?: number) => {
    book.value = _book
    page.value = _page ?? 1
    update()
  }

  const update = async () => {
    if (!book.value || !page.value) return
    pageDetail.value.ready = false
    const detail = books[book.value]?.[page.value - 1]
    if (!detail) return
    ocrInfo = await getOCRJson(detail.ocrPath!)
    const boxes = convertFormat(ocrInfo).boxes
    pageDetail.value = {
      ready: true,
      imageFileName: detail.pageName,
      imageUrl: detail.imgPath,
      textContent: ocrInfo.txt,
      textContentCopy: ocrInfo.txt,
      layout: {
        boxes,
        editHistory: [{ boxes: structuredClone(boxes), selectedIndex: -1 }],
        editIndex: 0,
      },
    }
  }

  const updatePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage
      update()
    }
  }

  const saveChanges = async () => {
    pageDetail.value.ready = false

    if (!book.value || !page.value) return
    const detail = books[book.value]?.[page.value - 1]
    if (!detail) return

    // save json
    await saveOCRJson(
      book.value,
      detail.pageName,
      saveBack(
        {
          boxes: currentEditStatus.value.boxes,
          text: pageDetail.value.textContentCopy,
        },
        ocrInfo,
      ),
    )
    pageDetail.value.ready = true
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
  const dragBox = (e: { moved?: { newIndex: number; oldIndex: number } }) => {
    if (!e.moved || !pageDetail.value.layout || !currentEditStatus.value) return
    const newEditStatus = structuredClone(toRaw(currentEditStatus.value))
    const newBoxes = newEditStatus.boxes
    const toIndex = newBoxes.length - 1 - e.moved.newIndex
    const fromIndex = newBoxes.length - 1 - e.moved.oldIndex
    const element = newBoxes[fromIndex]
    newBoxes.splice(fromIndex, 1)
    newBoxes.splice(toIndex, 0, element)
    newEditStatus.selectedIndex = toIndex
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

  return {
    book,
    page,
    initialize,
    pageDetail,
    totalPages,
    updatePage,
    draftChanged,
    resetChanges,
    saveChanges,
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
  }
})

async function getOCRJson(url: string): Promise<JsonOutput> {
  const response = await axios.get<JsonOutput>(url)
  return response.data
}

async function saveOCRJson(bookName: string, page: string, data: JsonOutput) {
  await axios.post('/api/save-ocr-info', {
    bookName,
    page,
    data,
  })
}
