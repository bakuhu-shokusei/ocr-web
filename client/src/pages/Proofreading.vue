<template>
  <Proofreading />
</template>

<script lang="ts" setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import Proofreading from '../components/proof-reading/Proofreading.vue'
import { useProofreadingStore } from '../store/proofreading'

const prrofreadingStore = useProofreadingStore()

const route = useRoute()

watch(
  () => [route.params.bookId, route.params.page],
  ([_bookId, _page]) => {
    const bookId = parseInt(_bookId as string)
    const page = parseInt(_page as string)
    prrofreadingStore.initialize(bookId, page)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped></style>
