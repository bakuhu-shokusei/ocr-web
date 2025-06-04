<template>
  <div class="controls">
    <Pagination
      :current="currentPage"
      :total="totalPages"
      :default-page-size="1"
      :show-size-changer="false"
      show-quick-jumper
      :simple="width <= 680"
      class="pagination"
      @change="onPageChange($event)"
    />
    <Button
      :style="{ marginLeft: 'auto', marginRight: '8px' }"
      @click="resetChanges"
    >
      リセット
    </Button>
    <Button type="primary" @click="savePageInfo"> 保存 </Button>
  </div>
</template>

<script setup lang="ts">
import { Pagination, Button, message } from 'ant-design-vue'
import { useProofreadingStore } from '../../store/proofreading'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useWindowSize } from '@vueuse/core'

const { width } = useWindowSize()

const proofreadingStore = useProofreadingStore()
const { bookPath, saveChanges, resetChanges } = proofreadingStore
const { totalPages, currentPage } = storeToRefs(proofreadingStore)

const router = useRouter()

const onPageChange = (page: number) => {
  router.push({ name: 'proofreading', params: { path: bookPath, page } })
}
const savePageInfo = async () => {
  await saveChanges(true)
  message.success('saved successfully')
}
</script>

<style lang="scss" scoped>
.pagination {
  white-space: pre;
  :deep(.ant-pagination-simple-pager) {
    input {
      padding: 0;
    }
  }
}

.controls {
  padding: 12px;
  border-top: 1px solid rgba(5, 5, 5, 0.06);
  display: flex;
  align-items: center;
}
</style>
