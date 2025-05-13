import { createRouter, createWebHashHistory } from 'vue-router';

// Implement lazy loading for components
const HomePage = () => import('../components/HomePage.vue');
const HistoryPage = () => import('../views/HistoryPage.vue');
const SettingsPage = () => import('../views/SettingsPage.vue');
const TemplatesPage = () => import('../views/TemplatesPage.vue');
const TemplateConfigPage = () => import('../views/TemplateConfigPage.vue'); // Template config for edit/create
const TemplateViewPage = () => import('../views/TemplateViewPage.vue'); // New import for template viewing

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryPage,
  },
  {
    path: '/templates',
    name: 'Templates',
    component: TemplatesPage,
  },
  {
    path: '/template/new',
    name: 'NewTemplate',
    component: TemplateConfigPage,
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
    props: route => ({ 
      mode: 'edit', 
      templateId: parseInt(route.params.id) 
    })
  },
  {
    path: '/template/view/:id',
    name: 'ViewTemplate',
    component: TemplateViewPage,
    props: route => ({
      templateId: parseInt(route.params.id)
    })
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
  },
];

const router = createRouter({
  history: createWebHashHistory(), // Using hash history for simplicity, avoids server config
  routes,
});

export default router;

