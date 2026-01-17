import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // ============================================
  // Legacy routes (backward compatibility)
  // These will continue to work for existing single-wedding setup
  // ============================================
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { isLegacy: true },
  },
  {
    path: '/rsvp',
    name: 'rsvp',
    component: () => import('@/views/RsvpView.vue'),
    meta: { isLegacy: true },
  },
  {
    path: '/admin/:tab?',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { isLegacy: true, requiresAuth: true },
  },

  // ============================================
  // Super Admin routes
  // ============================================
  {
    path: '/superadmin',
    name: 'superadmin',
    component: () => import('@/views/SuperAdminView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },

  // ============================================
  // Multi-tenant routes (new structure)
  // /{weddingSlug} - public wedding pages
  // /{weddingSlug}/admin - wedding admin
  // ============================================
  {
    path: '/:weddingSlug',
    name: 'wedding-home',
    component: () => import('@/views/HomeView.vue'),
    meta: { isMultiTenant: true },
  },
  {
    path: '/:weddingSlug/rsvp',
    name: 'wedding-rsvp',
    component: () => import('@/views/RsvpView.vue'),
    meta: { isMultiTenant: true },
  },
  {
    path: '/:weddingSlug/admin/:tab?',
    name: 'wedding-admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { isMultiTenant: true, requiresAuth: true },
  },

  // ============================================
  // Catch-all 404
  // ============================================
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
    // Admin routes use path-based tabs, always scroll to top
    if (to.name === 'admin' || to.name === 'wedding-admin') {
      return { top: 0 }
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

export default router
