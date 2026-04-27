import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: '概述',
    },
    name: 'MerchantDashboard',
    path: '/dashboard',
    redirect: '/analytics',
    children: [
      {
        name: 'MerchantAnalytics',
        path: '/analytics',
        component: () => import('#/views/merchant/dashboard/analytics.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: '分析页',
        },
      },
      {
        name: 'MerchantWorkspace',
        path: '/workspace',
        component: () => import('#/views/merchant/dashboard/index.vue'),
        meta: {
          icon: 'carbon:workspace',
          title: '工作台',
        },
      },
    ],
  },
];

export default routes;
