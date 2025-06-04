<template>
  <RouterView />
  <Transition>
    <div v-show="loading" class="loading">
      <Spin size="large" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Spin } from 'ant-design-vue'
import { useLoadingStore } from './store/loading'

const loadingStore = useLoadingStore()
const { loading } = storeToRefs(loadingStore)
</script>

<style scoped>
.loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);

  &.v-enter-active,
  &.v-leave-active {
    transition: background 0.3s ease;
  }
  &.v-enter-from,
  &.v-leave-to {
    background: rgba(0, 0, 0, 0);
  }
}
</style>
