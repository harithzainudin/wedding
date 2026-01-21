import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {
  hasValidTokens,
  getStoredIsMaster,
  getStoredUserType,
  getStoredAdminUserType,
  getStoredPrimaryWeddingSlug,
} from '@/services/tokenManager'

const routes: RouteRecordRaw[] = [
  // ============================================
  // Authentication routes
  // ============================================
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },

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
    path: '/gifts',
    name: 'gifts',
    component: () => import('@/views/GiftsView.vue'),
    meta: { isLegacy: true },
  },

  // ============================================
  // Super Admin routes
  // ============================================
  {
    path: '/superadmin/:tab?',
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
    path: '/:weddingSlug/gifts',
    name: 'wedding-gifts',
    component: () => import('@/views/GiftsView.vue'),
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
    if (to.name === 'wedding-admin' || to.name === 'superadmin') {
      return { top: 0 }
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// ============================================
// Navigation Guards
// ============================================
router.beforeEach((to, _from, next) => {
  const isAuthenticated = hasValidTokens()
  const requiresAuth = to.meta.requiresAuth === true
  const requiresSuperAdmin = to.meta.requiresSuperAdmin === true

  // If route requires auth and user is not authenticated, redirect to login
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'login' })
  }

  // If user is already authenticated and tries to access login page, redirect to appropriate dashboard
  if (to.name === 'login' && isAuthenticated) {
    const isMaster = getStoredIsMaster()
    const userType = getStoredUserType()
    const adminUserType = getStoredAdminUserType()
    const primaryWeddingSlug = getStoredPrimaryWeddingSlug()

    // Super admin or staff goes to superadmin dashboard
    if (isMaster || userType === 'super' || adminUserType === 'staff') {
      return next({ name: 'superadmin' })
    }

    // Client goes to their wedding admin
    if (adminUserType === 'client' && primaryWeddingSlug) {
      return next({ name: 'wedding-admin', params: { weddingSlug: primaryWeddingSlug } })
    }

    // Fallback to superadmin
    return next({ name: 'superadmin' })
  }

  // If route requires super admin access, verify user type
  if (requiresSuperAdmin && isAuthenticated) {
    const isMaster = getStoredIsMaster()
    const userType = getStoredUserType()
    const adminUserType = getStoredAdminUserType()

    // Allow super admins and staff
    if (isMaster || userType === 'super' || adminUserType === 'staff') {
      return next()
    }

    // Redirect clients to their wedding admin
    const primaryWeddingSlug = getStoredPrimaryWeddingSlug()
    if (primaryWeddingSlug) {
      return next({ name: 'wedding-admin', params: { weddingSlug: primaryWeddingSlug } })
    }

    // If no wedding slug, redirect to login
    return next({ name: 'login' })
  }

  next()
})

export default router
