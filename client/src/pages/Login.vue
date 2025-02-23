<template>
  <div>login</div>
</template>

<script setup lang="ts">
const url = `${import.meta.env.VITE_API}/login`
fetch(url)
</script>

<style scoped></style>
