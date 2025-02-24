<template>
  <Menu
    :selectedKeys="current"
    mode="horizontal"
    :items="items"
    @select="onSelect"
  />
</template>

<script lang="ts" setup>
import { h, computed } from 'vue'
import {
  SearchOutlined,
  FileImageOutlined,
  FolderOpenFilled,
} from '@ant-design/icons-vue'
import { Menu } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { useAssetsStore } from '../store/assets'
import { useRoute } from 'vue-router'

const route = useRoute()
const assetsStore = useAssetsStore()

const items = computed<MenuProps['items']>(() => {
  const books = assetsStore.books
  return [
    {
      key: 'list',
      icon: () => h(FolderOpenFilled),
      label: 'ファイル一覧',
    },
    {
      key: 'search',
      icon: () => h(SearchOutlined),
      label: '検索',
    },
    {
      key: 'proofreading',
      icon: () => h(FileImageOutlined),
      label: '校正',
      children: Object.keys(books || {}).map((i) => ({
        key: i,
        label: i,
      })),
    },
  ]
})

const onSelect: MenuProps['onSelect'] = ({ key }) => {}

const current = computed(() => {
  return [route.name as string]
})
</script>

<style lang="scss" scoped></style>
