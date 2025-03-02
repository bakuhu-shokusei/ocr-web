<template>
  <div class="search">
    <div class="search-inner">
      <InputSearch v-model:value="keyword" enter-button @search="onSearch" />

      <div class="checkboxes">
        <div
          v-for="book in Object.keys(searchIn)"
          :key="book"
          class="check-book"
        >
          <Checkbox v-model:checked="searchIn[book]" />
          <div class="book-name">{{ book }}</div>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <Spin size="large" />
      </div>

      <div v-else class="results">
        <div
          v-for="book in Object.keys(searchResult)"
          :key="book"
          class="book-result"
        >
          <div class="book-name">{{ book }}</div>
          <div class="result-count">
            検索結果
            <b>{{ searchResult[book].length }}</b>
            件
          </div>

          <Card
            v-for="match in searchResult[book]"
            :key="match.index"
            :style="{ margin: '12px 0' }"
            size="small"
          >
            <template #title>
              <div class="card-title" @click="goToDetail(book, match.index)">
                {{ match.pageName }}
              </div>
            </template>
            <div class="text-content">{{ match.matchedText }}</div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Mark from 'mark.js'
import { InputSearch, Checkbox, Spin, Card } from 'ant-design-vue'
import { useSearchStore } from '../store/search'
import { storeToRefs } from 'pinia'
import { onUpdated } from 'vue'
import { useRouter } from 'vue-router'

const searchStore = useSearchStore()
const { searchIn, keyword, loading, searchResult } = storeToRefs(searchStore)

const onSearch = async () => {
  await searchStore.search()
}

const highlightKeywords = () => {
  const nodes = document.querySelectorAll<HTMLElement>(
    '.book-result .text-content',
  )
  const instance = new Mark(nodes)
  instance.mark(keyword.value)
}
onUpdated(highlightKeywords)

const router = useRouter()
const goToDetail = (book: string, index: number) => {
  router.push({ name: 'proofreading', params: { book, page: index + 1 } })
}
</script>

<style lang="scss" scoped>
.search {
  height: 100%;
  overflow: auto;
  .search-inner {
    height: 100%;
    padding: 16px 12px;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    box-sizing: border-box;
    .checkboxes {
      display: flex;
      align-items: center;
      margin: 8px 0;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 14px;
      .check-book {
        display: flex;
        align-items: center;
        .book-name {
          margin-left: 4px;
        }
      }
    }
    .loading {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .results {
      border-bottom: 1px solid transparent;
      .book-result {
        margin: 32px 0;
        .book-name {
          color: var(--text-main);
          font-size: 20px;
          font-weight: 600;
        }
        .result-count {
          font-size: 12px;
          margin: 12px 0;
        }
        .card-title {
          color: var(--primary-blue);
          cursor: pointer;
        }
        .text-content {
          white-space: pre-line;
          :deep(mark) {
            padding: 0;
            background-color: #ffd63f;
          }
        }
      }
    }
  }
}
</style>
