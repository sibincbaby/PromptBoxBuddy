import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '@/store/modules/authStore';

// Implement lazy loading for components
const HomePage = () => import('../components/HomePage.vue');
const HistoryPage = () => import('../views/HistoryPage.vue');
const SettingsPage = () => import('../views/SettingsPage.vue');
const TemplatesPage = () => import('../views/TemplatesPage.vue');
const TemplateConfigPage = () => import('../views/TemplateConfigPage.vue'); // Template config for edit/create
const TemplateViewPage = () => import('../views/TemplateViewPage.vue'); // New import for template viewing
const LoginPage = () => import('../views/LoginPage.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/templates',
    name: 'Templates',
    component: TemplatesPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/template/new',
    name: 'NewTemplate',
    component: TemplateConfigPage,
    meta: { requiresAuth: true },
    // Add a unique key to force component re-creation each time
    props: route => ({ 
      mode: 'create',
      key: Date.now() // Force component recreation with a unique key
    })
  },
  {
    path: '/template/edit/:id',
    name: 'EditTemplate',
    component: TemplateConfigPage,
    meta: { requiresAuth: true },
    props: route => ({ 
      mode: 'edit', 
      templateId: parseInt(route.params.id) 
    })
  },
  {
    path: '/template/view/:id',
    name: 'ViewTemplate',
    component: TemplateViewPage,
    meta: { requiresAuth: true },
    props: route => ({
      templateId: parseInt(route.params.id)
    })
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHashHistory(), // Using hash history for simplicity, avoids server config
  routes,
});

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);
  
  // Initialize auth state if needed
  if (authStore.loading) {
    authStore.init();
  }
  
  // Check if the route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login page if not authenticated
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect to home if already authenticated and trying to access login page
    next('/');
  } else {
    // Continue navigation
    next();
  }
});

export default router;

