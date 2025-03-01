<template>
  <div v-if="pageDetail.layout" class="layout-boxes">
    <div ref="boxesContainer" class="boxes-area">
      <Draggable
        :model-value="reversedList"
        :item-key="genKey"
        direction="horizontal"
        handle=".text-number"
        :animation="150"
        @change="proofreadingStore.dragBox($event)"
      >
        <template #item="{ element, index }">
          <div
            class="single-box"
            :class="{
              selected: element.index === currentEditStatus?.selectedIndex,
              'last-box': index === 0,
            }"
            @click="proofreadingStore.selectBox(element.index)"
            :data-box-index="element.index"
          >
            <p class="text-number">{{ element.index + 1 }}</p>
            <Input
              :value="element.text"
              class="box-input"
              @update:value="proofreadingStore.saveBox(element.index, $event)"
            />
          </div>
        </template>
      </Draggable>
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
import { computed, ref, watch, h, nextTick } from 'vue'
import Draggable from 'vuedraggable'
import { storeToRefs } from 'pinia'
import { Input, Button } from 'ant-design-vue'
import {
  UndoOutlined,
  RedoOutlined,
  DeleteOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons-vue'
import { useProofreadingStore } from '../../store/proofreading'
import { genKey } from '../../utils'

const proofreadingStore = useProofreadingStore()
const { pageDetail, currentEditStatus, canRedo, canUndo, canDeleteBox } =
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
        // selected.scrollIntoView({ behavior: 'smooth' })
      }
    })
  },
)

const reversedList = computed(() => {
  return currentEditStatus.value?.boxes
    .map((i, index) => ({ ...i, index }))
    .reverse()
})
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
    /* this div is created by sortable */
    & > div {
      height: 100%;
      box-sizing: border-box;
      padding: 12px 0;
      overflow: auto;
      scrollbar-width: thin;
      display: flex;
      gap: 8px;
      .single-box {
        &.last-box {
          margin-left: auto;
        }
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
