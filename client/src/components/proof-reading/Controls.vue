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
    <Button :icon="h(SaveOutlined)" type="primary" @click="saveChanges">
      保存
    </Button>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { Pagination, Button } from 'ant-design-vue'
import { SaveOutlined } from '@ant-design/icons-vue'
import { useProofreadingStore } from '../../store/proofreading'
import { storeToRefs } from 'pinia'

const proofreadingStore = useProofreadingStore()
const { updatePage, saveChanges, resetChanges } = proofreadingStore
const { totalPages, page } = storeToRefs(proofreadingStore)

const onPageChange = (page: number) => {
  updatePage(page)
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
