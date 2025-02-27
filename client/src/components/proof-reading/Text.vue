<template>
  <div class="text-container">
    <Textarea
      class="text-content is-vertical"
      id="txt-content-textarea"
      v-model:value="pageDetail.textContentCopy"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Textarea } from 'ant-design-vue'
import { useProofreadingStore } from '../../store/proofreading'

const proofreadingStore = useProofreadingStore()
const { pageDetail } = storeToRefs(proofreadingStore)
</script>

<style lang="scss" scoped>
h3 {
  margin: 0;
}

.text-container {
  padding: 0 12px;
  display: flex;
  flex-direction: column;

  .text-content {
    flex: 1;
    resize: none;
    margin-bottom: 12px;
    font-family: var(--font-japanese);
    &.is-vertical {
      writing-mode: vertical-rl;
    }
  }

  .controls {
    display: flex;
    align-items: center;
    padding: 8px 0;
    .controls-text {
      font-family: var(--font-japanese);
      color: var(--text-main);
      font-size: 12px;
      line-height: 16px;
      margin-right: 8px;
    }
  }
}
</style>
