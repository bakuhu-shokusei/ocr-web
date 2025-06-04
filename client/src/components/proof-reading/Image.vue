<template>
  <div
    class="image-container"
    :class="{
      'is-edit-mode': mode === 'edit',
      'is-drag-mode': mode === 'drag',
    }"
  >
    <h3 class="file-name">{{ currentPageName }}</h3>
    <div
      ref="imgContainer"
      class="image-container-body"
      @mousedown="dragToMove"
    >
      <div
        ref="actualImage"
        class="actual-image"
        :style="{
          backgroundImage: `url(${pageDetail.imageUrl})`,
          aspectRatio: `${imageOriginalSize[0]} / ${imageOriginalSize[1]}`,
        }"
        :class="{
          'fit-width': fitWidthOrHeight === 'width',
          'fit-height': fitWidthOrHeight === 'height',
          [`scale-level-${zoomLevel.toFixed(1).replace('.', '-')}`]: true,
        }"
        @mousedown="addNewBoxMouseDown"
        @touchstart="addNewBoxTouchStart"
      >
        <div
          v-for="({ box, selected, style }, idx) in boxesStyle"
          :key="box.uuid"
          :style="style"
          class="layout-box"
          :class="{ selected, hidden: mode === 'edit' && selected }"
          @click="proofreadingStore.selectBox(idx)"
        >
          <p class="box-number">{{ idx + 1 }}</p>
        </div>
        <VueDraggableResizable
          v-if="mode === 'edit' && boxBeingEdited"
          :key="boxBeingEdited.index"
          v-bind="boxBeingEdited.draggableOptions"
          @drag-stop="boxBeingEdited.onDrag"
          @resize-stop="boxBeingEdited.onResize"
        >
          <div class="layout-box resizable">
            <p class="box-number">{{ boxBeingEdited.index + 1 }}</p>
          </div>
        </VueDraggableResizable>
      </div>
    </div>
    <div class="image-controls">
      <div class="pannel-container">
        <div class="control-pannel">
          <Button
            :icon="h(DragOutlined)"
            :type="mode === 'drag' ? 'primary' : 'default'"
            @click="proofreadingStore.setMode('drag')"
          />
          <Button
            :icon="h(EditOutlined)"
            :type="mode === 'edit' ? 'primary' : 'default'"
            @click="proofreadingStore.setMode('edit')"
          />
          <Button
            :icon="h(PlusOutlined)"
            :type="mode === 'add' ? 'primary' : 'default'"
            @click="proofreadingStore.setMode('add')"
          />
        </div>
      </div>
    </div>
    <div class="controls">
      <div class="controls-text">拡大倍率</div>
      <Slider
        v-model:value="zoomLevel"
        :min="1"
        :max="5"
        :step="0.5"
        :style="{ maxWidth: '220px', flex: 1, margin: '0 16px' }"
        :tooltip-open="false"
      />
      <div class="controls-text">{{ zoomLevel }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { ref, computed, watch, h } from 'vue'
import { useStorage, useElementSize } from '@vueuse/core'
import { Slider, Button } from 'ant-design-vue'
import { DragOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import VueDraggableResizable from 'vue-draggable-resizable'
import { useProofreadingStore } from '../../store/proofreading'
import { generateUUID, type Box } from '../../utils'
import { createDragHandler } from '../../utils/drag'

const proofreadingStore = useProofreadingStore()
const { pageDetail, currentPageName, currentEditStatus, mode } =
  storeToRefs(proofreadingStore)

const imageOriginalSize = ref<[number, number]>([1, 1])
watch(
  () => pageDetail.value.imageUrl,
  (url) => {
    const img = new Image()
    img.addEventListener('load', () => {
      imageOriginalSize.value = [img.naturalWidth, img.naturalHeight]
    })
    img.src = url
  },
  { immediate: true },
)

const imgContainer = ref<HTMLDivElement>()
const imgContainerSize = useElementSize(imgContainer)
const actualImage = ref<HTMLDivElement>()
const actualImageSize = useElementSize(actualImage)
const fitWidthOrHeight = computed(() => {
  const w0 = imgContainerSize.width.value
  const h0 = imgContainerSize.height.value
  const [w, h] = imageOriginalSize.value
  return w0 / h0 < w / h ? 'width' : 'height'
})

const zoomLevel = useStorage('image-zoom-level', 1)
const boxesStyle = computed<
  { box: Box; selected: boolean; style: CSSProperties }[]
>(() => {
  const toString = (p: number) => `${(p * 100).toFixed(5)}%`
  return (currentEditStatus.value?.boxes || []).map((box, idx) => {
    return {
      box,
      selected: idx === currentEditStatus.value.selectedIndex,
      style: {
        left: toString(box.xmin),
        top: toString(box.ymin),
        width: toString(box.xmax - box.xmin),
        height: toString(box.ymax - box.ymin),
      },
    }
  })
})

const boxBeingEdited = computed(() => {
  const { boxes, selectedIndex } = currentEditStatus.value
  const box = boxes[selectedIndex]
  const w0 = actualImageSize.width.value
  const h0 = actualImageSize.height.value
  if (!box || !w0 || !h0) return null

  const { xmin, xmax, ymin, ymax } = box

  const draggableOptions = {
    x: w0 * xmin,
    y: h0 * ymin,
    w: w0 * (xmax - xmin),
    h: h0 * (ymax - ymin),
    parent: true,
    handles: ['tl', 'tr', 'mr', 'br', 'bl', 'ml'],
    active: true,
  }
  const onDrag = (left: number, top: number) => {
    const xmin = left / w0
    const ymin = top / h0
    proofreadingStore.saveDraggedBox(selectedIndex, { xmin, ymin })
  }
  const onResize = (
    left: number,
    top: number,
    width: number,
    height: number,
  ) => {
    const xmin = left / w0
    const xmax = (left + width) / w0
    const ymin = top / h0
    const ymax = (top + height) / h0
    proofreadingStore.saveResizedBox(selectedIndex, { xmin, xmax, ymin, ymax })
  }
  return { draggableOptions, index: selectedIndex, onDrag, onResize }
})

const { onMouseDown: addNewBoxMouseDown, onTouchStart: addNewBoxTouchStart } =
  createDragHandler((initPosition) => {
    if (mode.value !== 'add') return

    const container = actualImage.value
    if (!container) return
    const [w0, h0] = [container.clientWidth, container.clientHeight]
    const { left: l0, top: t0 } = container.getBoundingClientRect()
    const [prevX, prevY] = [
      initPosition.clientX - l0,
      initPosition.clientY - t0,
    ]
    let isNew = true
    let newIndex: number
    return {
      onMove(p) {
        const [newX, newY] = [p.clientX - l0, p.clientY - t0]
        const box: Box = {
          uuid: generateUUID(),
          xmin: Math.min(prevX, newX) / w0,
          ymin: Math.min(prevY, newY) / h0,
          xmax: Math.max(prevX, newX) / w0,
          ymax: Math.max(prevY, newY) / h0,
          text: '',
        }
        newIndex = proofreadingStore.insertNewBox(box, isNew)
        isNew = false
      },
      onFinish() {
        proofreadingStore.selectBox(newIndex)
      },
    }
  })

const dragToMove = (e: MouseEvent) => {
  if (mode.value !== 'drag') return

  e.preventDefault()
  const container = e.currentTarget as HTMLElement
  if (!container) return
  const [scrollLeft, scrollTop] = [container.scrollLeft, container.scrollTop]
  const [prevX, prevY] = [e.clientX, e.clientY]
  /*
   * if it's a drag action(true): do not select
   * if it's a click action(false): select
   */
  let moved = false
  function onMove(e: MouseEvent) {
    const [clientX, clientY] = [e.clientX, e.clientY]
    const deltaX = clientX - prevX
    const deltaY = clientY - prevY
    container.scrollLeft = scrollLeft - deltaX
    container.scrollTop = scrollTop - deltaY

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) moved = true
  }
  function cancelClick(e: MouseEvent) {
    e.stopPropagation()
    document.removeEventListener('click', cancelClick, true)
  }
  function onEnd() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    if (moved) {
      // prevent triggering click event
      document.addEventListener('click', cancelClick, true)
    }
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}

watch(
  () => currentEditStatus.value?.selectedIndex,
  (index) => {
    if (typeof index !== 'number') return
    const selected = imgContainer.value?.querySelectorAll('.layout-box')[index]
    if (selected instanceof Element) {
      selected.scrollIntoView({ behavior: 'smooth' })
    }
  },
)
</script>

<style lang="scss" scoped>
h3,
p {
  margin: 0;
}

.image-container {
  padding: 0 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: max-content minmax(0, 1fr) 0 max-content;
  overflow: hidden;

  &.is-drag-mode {
    .image-container-body {
      cursor: grab;
    }
  }

  .file-name {
    margin: 12px 0;
    font-size: 12px;
    line-height: 16px;
    color: var(--text-secondary);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    align-items: center;
    margin-right: auto;
    width: 100%;
  }

  .controls {
    display: flex;
    align-items: center;
    padding: 8px 0;
    overflow: hidden;
    .controls-text {
      color: var(--text-main);
      font-family: var(--font-japanese);
      font-size: 12px;
      line-height: 16px;
    }
  }

  .image-container-body {
    flex: 1;
    overflow: auto;
    scrollbar-width: thin;
    position: relative;
    .actual-image {
      position: absolute;
      top: 0;
      left: 0;
      background-size: 100% 100%;
      &.fit-height {
        &.scale-level-1-0 {
          height: 100%;
        }
        &.scale-level-1-5 {
          height: 150%;
        }
        &.scale-level-2-0 {
          height: 200%;
        }
        &.scale-level-2-5 {
          height: 250%;
        }
        &.scale-level-3-0 {
          height: 300%;
        }
        &.scale-level-3-5 {
          height: 350%;
        }
        &.scale-level-4-0 {
          height: 400%;
        }
        &.scale-level-4-5 {
          height: 450%;
        }
        &.scale-level-5-0 {
          height: 500%;
        }
      }
      &.fit-width {
        &.scale-level-1-0 {
          width: 100%;
        }
        &.scale-level-1-5 {
          width: 150%;
        }
        &.scale-level-2-0 {
          width: 200%;
        }
        &.scale-level-2-5 {
          width: 250%;
        }
        &.scale-level-3-0 {
          width: 300%;
        }
        &.scale-level-3-5 {
          width: 350%;
        }
        &.scale-level-4-0 {
          width: 400%;
        }
        &.scale-level-4-5 {
          width: 450%;
        }
        &.scale-level-5-0 {
          width: 500%;
        }
      }
    }
    .layout-box {
      $border-width: 2px;
      position: absolute;
      box-sizing: content-box;
      transform: translate(-$border-width, -$border-width);
      border: $border-width solid rgba(var(--primary-blue-rgb), 0.3);
      &.selected {
        border-color: rgba(var(--primary-blue-rgb), 1);
        background-color: rgba(var(--primary-blue-rgb), 0.1);
      }
      &.hidden {
        display: none;
      }
      &.resizable {
        width: 100%;
        height: 100%;
      }
      .box-number {
        position: absolute;
        width: 100%;
        bottom: 100%;
        text-align: center;
        color: rgba(var(--primary-blue-rgb), 0.6);
        font-size: 12px;
      }
    }
  }

  .image-controls {
    position: relative;
    .pannel-container {
      position: absolute;
      bottom: 8px;
      padding: 8px 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      overflow: hidden;
      .control-pannel {
        display: flex;
        background-color: #fff;
        padding: 8px 16px;
        border-radius: 16px;
        gap: 8px;
        box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
      }
    }
  }
}
</style>

<style lang="scss">
@import 'vue-draggable-resizable/style.css';
</style>
