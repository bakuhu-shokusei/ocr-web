<template>
  <div class="layout-boxes">
    <div ref="boxesContainer" class="boxes-area">
      <div
        v-for="box in reversedList"
        :key="box.uuid"
        class="single-box"
        :class="{
          selected: box.index === currentEditStatus?.selectedIndex,
          'sortable-selected': sortableSelected.has(box.index),
        }"
        :data-box-index="box.index"
      >
        <p class="text-number">{{ box.index + 1 }}</p>
        <Input
          :value="box.text"
          class="box-input"
          @update:value="proofreadingStore.saveBox(box.index, $event)"
          @focus="proofreadingStore.selectBox(box.index)"
        />
      </div>
    </div>
    <div class="control-area">
      <Button
        :icon="h(UndoOutlined)"
        :disabled="!canUndo"
        @click="proofreadingStore.undoHistory"
      />
      <Button
        :icon="h(RedoOutlined)"
        :disabled="!canRedo"
        @click="proofreadingStore.redoHistory"
      />
      <Button
        :icon="h(DeleteOutlined)"
        danger
        :disabled="!canDeleteBox"
        @click="proofreadingStore.deleteBox"
      />
      <Button
        :icon="h(EditOutlined)"
        :type="mode === 'edit' ? 'primary' : 'default'"
        @click="proofreadingStore.toggleEditMode"
      />
      <Button
        :icon="h(PlusOutlined)"
        :type="mode === 'add' ? 'primary' : 'default'"
        @click="proofreadingStore.toggleAddMode"
      />
      <Button
        :icon="h(ArrowDownOutlined)"
        @click="proofreadingStore.replaceTxt"
        :style="{ marginLeft: 'auto' }"
      >
        確定
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, h, nextTick, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Input, Button } from 'ant-design-vue'
import {
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  ArrowDownOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { useProofreadingStore } from '../../store/proofreading'

const proofreadingStore = useProofreadingStore()
const { currentEditStatus, canRedo, canUndo, canDeleteBox, mode } =
  storeToRefs(proofreadingStore)

const boxesContainer = ref<HTMLDivElement>()

watch(
  () => currentEditStatus.value?.selectedIndex,
  (index) => {
    if (typeof index !== 'number') return
    nextTick(() => {
      const selected = boxesContainer.value?.querySelector(
        `.single-box[data-box-index="${index}"]`,
      )
      if (selected instanceof Element) {
        selected.querySelector('input')?.focus()
        selected.scrollIntoView({ behavior: 'smooth' })
      }
    })
  },
)

const reversedList = computed(() => {
  return currentEditStatus.value?.boxes
    .map((i, index) => ({ ...i, index }))
    .reverse()
})

const sortableSelected = ref<Set<number>>(new Set())
let sortable: Sortable
const setUpSortable = () => {
  const getNewIndexes = (e: SortableEvent) => {
    return e.newIndicies
      .map((i) => {
        const index = i.multiDragElement.getAttribute('data-box-index')
        return parseInt(index || '')
      })
      .filter((i) => !isNaN(i))
  }
  sortable = new Sortable(boxesContainer.value!, {
    direction: 'horizontal',
    handle: '.text-number',
    animation: 150,
    multiDrag: true,
    onEnd(e) {
      const oldIndicies = e.oldIndicies.map((i) => i.index)
      const newIndicies = e.newIndicies.map((i) => i.index)
      if (oldIndicies.length === 0 && e.oldIndex !== undefined)
        oldIndicies.push(e.oldIndex)
      if (newIndicies.length === 0 && e.newIndex !== undefined)
        newIndicies.push(e.newIndex)
      const revertIndex = (i: number) =>
        currentEditStatus.value.boxes.length - 1 - i
      proofreadingStore.dragBox({
        oldIndicies: oldIndicies.map(revertIndex),
        newIndicies: newIndicies.map(revertIndex),
      })
      proofreadingStore.resetSelected()
      nextTick(resetSortable)
    },
    onSelect(e) {
      proofreadingStore.resetSelected()
      sortableSelected.value = new Set(getNewIndexes(e))
    },
    onDeselect(e) {
      sortableSelected.value = new Set(getNewIndexes(e))
    },
  })
}
const resetSortable = () => {
  sortableSelected.value = new Set()
  sortable?.destroy()
  nextTick(setUpSortable)
}
onMounted(() => {
  setUpSortable()
})
onUnmounted(() => {
  sortable.destroy()
})
watch(
  () => currentEditStatus.value.selectedIndex,
  (newIndex, oldIndex) => {
    if (newIndex !== -1 && oldIndex === -1) {
      resetSortable()
    }
  },
)
watch(() => currentEditStatus.value.boxes.length, resetSortable)
</script>

<script lang="ts">
import Sortable, { MultiDrag, type SortableEvent } from 'sortablejs'
import { onMounted } from 'vue'

Sortable.mount(new MultiDrag())
</script>

<style lang="scss" scoped>
h3 {
  margin: 0;
}

.layout-boxes {
  padding: 0 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) max-content;

  .boxes-area {
    height: 100%;
    box-sizing: border-box;
    padding: 12px 0;
    overflow: auto;
    scrollbar-width: thin;
    display: flex;
    gap: 8px;
    & > div:first-child {
      margin-left: auto;
    }
    .single-box {
      background-color: #f0f0f0;
      border-radius: 6px;
      padding: 0 2px 1px 2px;
      display: grid;
      grid-template-columns: max-content;
      grid-template-rows: auto minmax(0, 1fr);
      .text-number {
        font-size: 12px;
        margin-bottom: 4px;
        padding-top: 4px;
        text-align: center;
        color: var(--text-secondary);
        cursor: pointer;
        user-select: none;
      }
      .box-input {
        flex: 1;
        padding: 4px 8px;
        writing-mode: vertical-rl;
      }
      &.selected {
        background-color: rgba(var(--primary-blue-rgb), 0.5);
        .text-number {
          font-weight: bold;
          color: var(--text-main);
        }
        .box-input {
          font-weight: bold;
        }
      }
      &.sortable-selected {
        background-color: #f9c7c8;
      }
    }
  }

  .control-area {
    color: var(--text-main);
    font-family: var(--font-japanese);
    margin: 8px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
