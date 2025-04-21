<template>
  <div
    class="divider"
    :class="direction"
    @mousedown="onMouseDown"
    @touchstart="onTouchStart"
    tabindex="0"
  >
    <div class="inner">
      <svg
        width="16px"
        height="16px"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 24 24"
      >
        <path fill="currentColor" d="M11 21H9V3h2zm4-18h-2v18h2z"></path>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createDragHandler } from '../../utils/drag'

interface Delata {
  deltaX: number
  deltaY: number
}
const props = defineProps<{
  direction: 'vertical' | 'horizontal'
  onMouseDown: () => (d: Delata) => void
}>()

const { onMouseDown, onTouchStart } = createDragHandler((initPosition) => {
  const cb = props.onMouseDown()
  const prevX = initPosition.clientX
  const prevY = initPosition.clientY
  return {
    onMove(p) {
      cb({ deltaX: p.clientX - prevX, deltaY: p.clientY - prevY })
    },
  }
})
</script>

<style lang="scss" scoped>
.divider {
  cursor: ew-resize;
  .inner {
    background-color: rgba(5, 5, 5, 0.03);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-main);
    &:hover {
      background-color: rgba(5, 5, 5, 0.06);
    }
  }
  &.horizontal {
    cursor: ns-resize;
    .inner {
      & > svg {
        transform: rotate(90deg);
      }
    }
  }
}
</style>
