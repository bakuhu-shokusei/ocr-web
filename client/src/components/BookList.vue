<template>
  <div class="book-list">
    <div class="gallery">
      <BadgeRibbon
        v-for="book in list"
        :key="book.bookName"
        :text="book.badgeText"
        :color="book.badgeColor"
      >
        <div
          class="tile"
          :class="{ waiting: !book.ocrDone, done: book.ocrDone }"
        >
          <div class="title">{{ book.bookName }}</div>
          <img :src="book.firstImg" />
          <div v-show="book.ocrDone" class="icons">
            <EditOutlined />
          </div>
        </div>
      </BadgeRibbon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BadgeRibbon } from 'ant-design-vue'
import { EditOutlined } from '@ant-design/icons-vue'
import { useAssetsStore } from '../store/assets'
import { storeToRefs } from 'pinia'

const assetsStore = useAssetsStore()
const { books } = storeToRefs(assetsStore)

const list = computed(() => {
  const bookNames = Object.keys(books.value)
  return bookNames.map((i) => {
    const ocrDone = !!books.value[i][0].ocrPath
    return {
      bookName: i,
      firstImg: books.value[i][0].imgPath,
      ocrDone,
      badgeText: ocrDone ? 'OCR完了' : '準備中',
      badgeColor: ocrDone ? 'green' : 'magenta',
    }
  })
})

const goToDetail = (book: string, index: number) => {}
</script>

<style lang="scss" scoped>
.book-list {
  max-width: 800px;
  margin: 0 auto;
  margin-top: 32px;
  .gallery {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    .tile {
      background-color: #f8fafd;
      border-radius: 16px;
      padding: 12px;
      height: 100%;
      box-sizing: border-box;
      &.done:hover {
        background-color: #eceef1;
      }
      &.waiting {
        cursor: not-allowed;
        opacity: 0.5;
      }
      display: flex;
      flex-direction: column;
      .title {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        padding-bottom: 8px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      & > img {
        width: 100%;
      }
      .icons {
        margin-top: auto;
        padding-top: 12px;
        font-size: 20px;
        display: flex;
        justify-content: center;
        .anticon {
          cursor: pointer;
          padding: 8px;
          border-radius: 999px;
          background-color: #e1e3e1;
          &:hover {
            background-color: #c2e7ff;
          }
        }
      }
    }
  }
}
</style>
