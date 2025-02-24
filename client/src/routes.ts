import { createWebHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/Login.vue'),
  },
  {
    path: '/',
    name: 'list',
    component: () => import('./pages/List.vue'),
  },
  {
    path: '/proofreading/:book/:page',
    name: 'proofreading',
    component: () => import('./pages/Proofreading.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('./pages/Search.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
