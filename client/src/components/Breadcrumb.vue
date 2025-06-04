<template>
  <div class="breadcrumb">
    <Breadcrumb>
      <BreadcrumbItem>
        <span @click="assetsStore.updatePath('')" class="breadcrumb-item">
          <HomeOutlined />
        </span>
      </BreadcrumbItem>
      <BreadcrumbItem v-for="{ name, path } in breadcrumbs">
        <span @click="assetsStore.updatePath(path)" class="breadcrumb-item">
          {{ name }}
        </span>
      </BreadcrumbItem>
    </Breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Breadcrumb, BreadcrumbItem } from 'ant-design-vue'
import { HomeOutlined } from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { useAssetsStore } from '../store/assets'

const assetsStore = useAssetsStore()
const { currentPath } = storeToRefs(assetsStore)

interface Breadcrumb {
  name: string
  path: string
}

function pathToBreadcrumbs(path: string): Breadcrumb[] {
  const segments = path.split('/').filter((segment) => segment !== '')
  const breadcrumbs: Breadcrumb[] = []

  segments.forEach((segment, index) => {
    let fullPath = segments.slice(0, index + 1).join('/')
    if (!fullPath.endsWith('/')) fullPath = fullPath + '/'
    breadcrumbs.push({
      name: segment,
      path: fullPath,
    })
  })

  return breadcrumbs
}

const breadcrumbs = computed(() => {
  if (currentPath.value === null) return []
  return pathToBreadcrumbs(currentPath.value)
})
</script>

<style scoped>
.breadcrumb {
  margin-top: 16px;
  .breadcrumb-item {
    cursor: pointer;
  }
}
</style>
