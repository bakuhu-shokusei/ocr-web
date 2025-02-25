<template>
  <div class="upload" @click="startUpload">
    <UploadOutlined class="icon" />
    <div class="text">Click to Upload</div>
  </div>
  <Progress
    v-show="loading"
    :percent="uploadPercent"
    size="small"
    class="progress"
  />
  <input
    id="upload-images"
    type="file"
    @change="handleChange"
    accept="image/*"
    multiple
  />
  <Modal
    v-model:open="showModal"
    title="Please input book name"
    @ok="onBookNameEntered"
  >
    <div class="book-name">
      <Input v-model:value="bookName" placeholder="book name" />
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message, Input, Modal, Progress } from 'ant-design-vue'
import { UploadOutlined } from '@ant-design/icons-vue'
import { uploadFiles } from '../api'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()

const handleChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target && target.files) {
    uploadImages([...target.files])
  }
}

const loading = ref(false)
const bookName = ref('')
const showModal = ref(false)
const uploadPercent = ref(0)

const startUpload = () => {
  if (loading.value) return
  showModal.value = true
}

const onBookNameEntered = () => {
  if (!bookName.value) {
    message.error('need book name')
    return
  }
  showModal.value = false
  const inputElm = document.querySelector<HTMLInputElement>('#upload-images')
  inputElm?.click()
}

const uploadImages = async (files: File[]) => {
  loading.value = true
  const success = await uploadFiles(bookName.value, files, (p) => {
    uploadPercent.value = p
  })
  loading.value = false
  if (success) {
    message.success('uploaded successfully')
  } else {
    message.error('upload failed')
  }
  bookName.value = ''
  uploadPercent.value = 0
  assetsStore.getAssets()
}
</script>

<style scoped>
.upload {
  padding: 16px;
  border: 2px dashed rgba(5, 5, 5, 0.06);
  border-radius: 12px;
  margin-top: 16px;
  text-align: center;
  color: var(--text-secondary);
  cursor: pointer;
  .icon {
    font-size: 32px;
    display: block;
  }
  .text {
    margin-top: 12px;
  }
}
.progress {
  margin: 8px 0;
}
.book-name {
  margin-top: 8px;
  margin-bottom: 32px;
}
#upload-images {
  display: none;
}
</style>
