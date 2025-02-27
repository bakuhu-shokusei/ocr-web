<template>
  <div class="image-container">
    <h3 class="file-name">{{ pageDetail.imageFileName }}</h3>
    <div ref="imgContainer" class="image-container-body" @mousedown="mouseDown">
      <div
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
      >
        <div
          v-for="({ box, style }, idx) in boxesStyle"
          :key="genKey(box)"
          :style="style"
          class="layout-box"
          :class="{ selected: idx === currentEditStatus?.selectedIndex }"
          @click="proofreadingStore.selectBox(idx)"
        >
          <p class="box-number">{{ idx + 1 }}</p>
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
import { ref, computed, watch } from 'vue'
import { useStorage, useElementSize } from '@vueuse/core'
import { Slider } from 'ant-design-vue'
import { storeToRefs } from 'pinia'
import { useProofreadingStore } from '../../store/proofreading'
import { genKey, type Box } from '../../utils'

const proofreadingStore = useProofreadingStore()
const { pageDetail, currentEditStatus } = storeToRefs(proofreadingStore)

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
const fitWidthOrHeight = computed(() => {
  const w0 = imgContainerSize.width.value
  const h0 = imgContainerSize.height.value
  const [w, h] = imageOriginalSize.value
  return w0 / h0 < w / h ? 'width' : 'height'
})

const zoomLevel = useStorage('image-zoom-level', 1)
const boxesStyle = computed<{ box: Box; style: CSSProperties }[]>(() => {
  const toString = (p: number) => `${(p * 100).toFixed(5)}%`
  return (currentEditStatus.value?.boxes || []).map((box) => {
    return {
      box,
      style: {
        left: toString(box.xmin),
        top: toString(box.ymin),
        width: toString(box.xmax - box.xmin),
        height: toString(box.ymax - box.ymin),
      },
    }
  })
})

const mouseDown = (e: MouseEvent) => {
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
  grid-template-rows: max-content minmax(0, 1fr) max-content;

  .controls {
    display: flex;
    align-items: center;
    padding: 8px 0;
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
    cursor: grab;
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
      position: absolute;
      border: 2px solid rgba(var(--primary-blue-rgb), 0.3);
      &.selected {
        border-color: rgba(var(--primary-blue-rgb), 1);
        background-color: rgba(var(--primary-blue-rgb), 0.1);
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
}
</style>
