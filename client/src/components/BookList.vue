<template>
  <div class="book-list">
    <!-- 1. folders -->
    <div class="gallery">
      <div
        v-for="folder in subDirs"
        :key="folder.path"
        class="tile is-directory"
        @click="assetsStore.updatePath(folder.path)"
      >
        <div class="title">{{ folder.info.name }}</div>
      </div>
    </div>

    <!-- 2. books -->
    <div class="gallery">
      <div v-for="folder in subBookDirs" :key="folder.path" class="tile">
        <div class="title">{{ folder.info.name }}</div>
        <img :src="folder.info.imagePath" />
        <div class="icons">
          <Tooltip>
            <template #title>校正</template>
            <EditOutlined @click="goToFirstPageOfBook(folder.info.id)" />
          </Tooltip>
          <Tooltip>
            <template #title>ダウンロード</template>
            <a
              :href="`/api/download-book?bookId=${folder.info.id}`"
              :download="`${folder.info.name}.txt`"
            >
              <DownloadOutlined />
            </a>
          </Tooltip>
          <Tooltip>
            <template #title>削除</template>
            <Popconfirm
              title="Are you sure delete this book?"
              ok-text="Yes"
              cancel-text="No"
              @confirm="assetsStore.deleteBook(folder.info.id)"
            >
              <DeleteOutlined />
            </Popconfirm>
          </Tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tooltip, Popconfirm } from 'ant-design-vue'
import {
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()
const { subDirs, subBookDirs } = storeToRefs(assetsStore)

const router = useRouter()

const goToFirstPageOfBook = (id: number) => {
  router.push({
    name: 'proofreading',
    params: { bookId: id, page: 1 },
  })
}
</script>

<style lang="scss" scoped>
.book-list {
  margin: 24px auto;
  .gallery {
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    .tile {
      background-color: #f8fafd;
      &:hover {
        background-color: #eceef1;
      }
      border-radius: 16px;
      padding: 12px;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      .title {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        padding-bottom: 8px;
      }
      & > img {
        width: 100%;
      }
      .icons {
        margin-top: auto;
        padding-top: 12px;
        font-size: 20px;
        display: flex;
        justify-content: space-evenly;
        .anticon {
          cursor: pointer;
          padding: 8px;
          border-radius: 999px;
          background-color: #e1e3e1;
          &:hover {
            background-color: #c2e7ff;
          }
        }
        a {
          color: inherit;
        }
      }

      &.is-directory {
        cursor: pointer;
        .title {
          padding: 0;
        }
      }
    }
  }
}
</style>
