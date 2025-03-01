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
  padding: 12px;

  .text-content {
    height: 100%;
    resize: none;
    margin-bottom: 12px;
    font-family: var(--font-japanese);
    &.is-vertical {
      writing-mode: vertical-rl;
    }
  }
}
</style>
