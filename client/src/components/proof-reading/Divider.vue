<template>
  <div class="divider" :class="direction" @mousedown="mouseDown" tabindex="0">
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
interface Delata {
  deltaX: number
  deltaY: number
}
const props = defineProps<{
  direction: 'vertical' | 'horizontal'
  onMouseDown: () => (d: Delata) => void
}>()

const mouseDown = (e: MouseEvent) => {
  const cb = props.onMouseDown()
  const prevX = e.clientX
  const prevY = e.clientY
  function onMove(e: MouseEvent) {
    cb({ deltaX: e.clientX - prevX, deltaY: e.clientY - prevY })
  }
  function onEnd() {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}
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
