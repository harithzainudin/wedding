import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/rsvp',
    name: 'rsvp',
    component: () => import('@/views/RsvpView.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // Always scroll to top for home page (wedding landing page)
    // This prevents the page from jumping to previous scroll position on refresh
    if (to.name === 'home') {
      if (to.hash) {
        return { el: to.hash, behavior: 'smooth' }
      }
      return { top: 0, behavior: 'smooth' }
    }

    if (savedPosition) {
      return savedPosition
    }
    // Skip scroll behavior for admin tab hashes
    if (to.name === 'admin' && to.hash) {
      return false
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

export default router
