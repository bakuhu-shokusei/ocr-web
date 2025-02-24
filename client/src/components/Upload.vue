<template>
  <div class="upload">
    <div class="title">Upload</div>
    <div class="book-name">
      <Input v-model:value="bookName" placeholder="book name" />
    </div>
    <div>
      <Button
        class="upload-button"
        :disabled="!bookName || loading"
        @click="buttonClick"
      >
        <UploadOutlined />
        Click to Upload
      </Button>
      <input
        id="upload-images"
        type="file"
        @change="handleChange"
        accept="image/*"
        multiple
      />
      <Spin v-if="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message, Button, Input, Spin } from 'ant-design-vue'
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

const buttonClick = () => {
  if (loading.value) return
  const inputElm = document.querySelector<HTMLInputElement>('#upload-images')
  inputElm?.click()
}

const uploadImages = async (files: File[]) => {
  loading.value = true
  const success = await uploadFiles(bookName.value, files)
  loading.value = false
  if (success) {
    message.success('uploaded successfully')
  } else {
    message.error('upload failed')
  }
  bookName.value = ''
  assetsStore.getAssets()
}
</script>

<style scoped>
.title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  margin: 8px 0;
}
.book-name {
  margin: 8px 0;
  input {
    width: auto;
  }
}
#upload-images {
  display: none;
}
</style>
