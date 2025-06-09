import { createWebHashHistory, createRouter } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./pages/Login.vue'),
  },
  {
    path: '',
    component: () => import('./pages/BasicLayout.vue'),
    children: [
      {
        path: '',
        redirect: { name: 'browse' },
      },
      {
        path: 'browse/:path?',
        name: 'browse',
        component: () => import('./pages/List.vue'),
      },
      {
        path: 'proofreading/book/:bookId/page/:page',
        name: 'proofreading',
        component: () => import('./pages/Proofreading.vue'),
      },
      {
        path: 'search',
        name: 'search',
        component: () => import('./pages/Search.vue'),
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
