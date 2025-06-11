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
  FolderOpenFilled,
  FileImageOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'
import { Menu } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssetsStore } from '../store/assets'

const route = useRoute()
const router = useRouter()

const items = computed<MenuProps['items']>(() => {
  return [
    {
      key: 'browse',
      icon: () => h(FolderOpenFilled),
      label: 'ファイル一覧',
    },
    {
      key: 'proofreading',
      icon: () => h(FileImageOutlined),
      label: '校正',
    },
    {
      key: 'search',
      icon: () => h(SearchOutlined),
      label: '検索',
    },
  ]
})

const assetsStore = useAssetsStore()

const onSelect: MenuProps['onSelect'] = ({ key }) => {
  switch (key) {
    case 'browse':
      assetsStore.updatePath('')
      break
    case 'search':
      router.push({ name: 'search' })
      break
    default:
      break
  }
}

const current = computed<string[]>(() => {
  return [route.name as string]
})
</script>

<style lang="scss" scoped></style>
