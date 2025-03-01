<template>
  <div class="controls">
    <Pagination
      :current="page"
      :total="totalPages"
      :default-page-size="1"
      :show-size-changer="false"
      show-quick-jumper
      @change="onPageChange($event)"
    />
    <Button
      :style="{ marginLeft: 'auto', marginRight: '8px' }"
      @click="resetChanges"
    >
      リセット
    </Button>
    <Button :icon="h(SaveOutlined)" type="primary" @click="savePageInfo">
      保存
    </Button>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { Pagination, Button, message } from 'ant-design-vue'
import { SaveOutlined } from '@ant-design/icons-vue'
import { useProofreadingStore } from '../../store/proofreading'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const proofreadingStore = useProofreadingStore()
const { book, saveChanges, resetChanges } = proofreadingStore
const { totalPages, page } = storeToRefs(proofreadingStore)

const router = useRouter()

const onPageChange = (page: number) => {
  router.push({ name: 'proofreading', params: { book, page } })
}
const savePageInfo = async () => {
  await saveChanges()
  message.success('saved successfully')
}
</script>

<style lang="scss" scoped>
.controls {
  padding: 12px;
  border-top: 1px solid rgba(5, 5, 5, 0.06);
  display: flex;
  align-items: center;
}
</style>
