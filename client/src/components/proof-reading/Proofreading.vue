<template>
  <div>
    <div v-if="pageDetail.imageFileName" class="content">
      <div class="display-area" :class="{ 'has-layout': pageDetail.layout }">
        <Image />
        <Divider :onMouseDown="verticalResize" direction="vertical" />
        <Layout v-if="pageDetail.layout" />
        <Divider
          v-if="pageDetail.layout"
          :onMouseDown="horizontalResize"
          direction="horizontal"
        />
        <Text />
      </div>
      <Controls />
    </div>
    <Transition>
      <div v-show="!pageDetail.ready" class="loading">
        <Spin size="large" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { Spin } from 'ant-design-vue'
import { useProofreadingStore } from '../../store/proofreading'
import Image from './Image.vue'
import Text from './Text.vue'
import Controls from './Controls.vue'
import Divider from './Divider.vue'
import Layout from './Layout.vue'

const proofreadingStore = useProofreadingStore()
const { pageDetail } = storeToRefs(proofreadingStore)

const imageWidthPercentage = useStorage('proofreading-image-width', '50%')
const layoutHeightPercentage = useStorage('proofreading-layout-height', '50%')

const verticalResize = () => {
  const imageWidth = document.querySelector('.image-container')?.clientWidth
  const containerWidth = document.querySelector('.display-area')?.clientWidth
  return (delta: { deltaX: number }) => {
    if (!imageWidth || !containerWidth) return
    const MIN_SPACE = 160
    const min = MIN_SPACE / containerWidth!
    const max = 1 - min
    const target = (imageWidth + delta.deltaX) / containerWidth
    imageWidthPercentage.value =
      (Math.max(min, Math.min(max, target)) * 100).toFixed(2) + '%'
  }
}

const horizontalResize = () => {
  const layoutHeight = document.querySelector('.layout-boxes')?.clientHeight
  const containerHeight = document.querySelector('.display-area')?.clientHeight
  return (delta: { deltaY: number }) => {
    if (!layoutHeight || !containerHeight) return
    const MIN_SPACE = 100
    const min = MIN_SPACE / containerHeight!
    const max = 1 - min
    const target = (layoutHeight + delta.deltaY) / containerHeight
    layoutHeightPercentage.value =
      (Math.max(min, Math.min(max, target)) * 100).toFixed(2) + '%'
  }
}
</script>

<style lang="scss" scoped>
.loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);

  &.v-enter-active,
  &.v-leave-active {
    transition: background 0.3s ease;
  }
  &.v-enter-from,
  &.v-leave-to {
    background: rgba(0, 0, 0, 0);
  }
}

.content {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) auto;
  .display-area {
    flex: 1;
    &:not(.has-layout) {
      display: flex;
      :deep(.image-container) {
        width: v-bind(imageWidthPercentage);
      }
      :deep(.text-container) {
        flex: 1;
      }
    }
    &.has-layout {
      display: grid;
      grid-template-columns:
        minmax(0, v-bind(imageWidthPercentage))
        16px
        minmax(0, 1fr);
      grid-template-rows:
        minmax(0, v-bind(layoutHeightPercentage))
        16px
        minmax(0, 1fr);
      :deep(.image-container) {
        grid-column: 1 / 2;
        grid-row: 1 / 4;
      }
      :deep(.text-container) {
        grid-column: 3 / 4;
        grid-row: 3 / 4;
      }
      :deep(.divider.vertical) {
        grid-column: 2 / 3;
        grid-row: 1 / 4;
      }
      :deep(.divider.horizontal) {
        grid-column: 3 / 4;
        grid-row: 2 / 3;
      }
      :deep(.layout-boxes) {
        grid-column: 3 / 4;
        grid-row: 1 / 2;
      }
    }

    :deep(.file-name) {
      font-size: 12px;
      line-height: 16px;
      color: var(--text-secondary);
      margin: 12px 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      display: flex;
      align-items: center;
    }
  }
}
</style>
