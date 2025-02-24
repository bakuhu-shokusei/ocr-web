<template>
  <div class="file-list">
    <div v-if="list.length === 0">No records</div>
    <div v-for="item in list" :key="item.book" class="book">
      <div class="book-name">{{ item.book }}</div>
      <Table :columns="item.columns" :data-source="item.data" size="small">
        <template #headerCell="{ column }">
          <span class="table-header-cell"> {{ column.title }} </span>
        </template>
        <template #bodyCell="{ column, record }">
          <span class="table-body-cell" @click="record.onClick">
            {{ record[column.key!] }}
          </span>
        </template>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Table } from 'ant-design-vue'
import type { TableProps } from 'ant-design-vue'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()

const list = computed(() => {
  const books = assetsStore.books
  const bookNames = Object.keys(books)
  return bookNames.map((book) => {
    const columns: TableProps['columns'] = [
      {
        title: '画像ファイル',
        dataIndex: 'image',
        key: 'image',
      },
      {
        title: 'OCR結果',
        dataIndex: 'ocr',
        key: 'tocrext',
      },
    ]
    const data: TableProps['dataSource'] = books[book].map(
      ({ pageName }, idx) => {
        return {
          image: pageName,
          ocr: '',
          onClick: () => {
            goToDetail(book, idx)
          },
        }
      },
    )
    return {
      book,
      columns,
      data,
    }
  })
})

const goToDetail = (book: string, index: number) => {}
</script>

<style lang="scss" scoped>
.file-list {
  max-width: 800px;
  margin: 0 auto;
  .book {
    margin-top: 16px;
    margin-bottom: 48px;
    &:last-of-type {
      padding-bottom: 16px;
    }
    .book-name {
      font-size: 24px;
      font-weight: 600;
      margin: 12px 0;
    }
    .table-header-cell {
      font-family: var(--font-japanese);
    }
    .table-body-cell {
      cursor: pointer;
    }
  }
}
</style>
