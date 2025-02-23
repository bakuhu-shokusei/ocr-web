import { createWebHistory, createRouter } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('./pages/Login.vue') },
  { path: '/', component: () => import('./pages/List.vue') },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
