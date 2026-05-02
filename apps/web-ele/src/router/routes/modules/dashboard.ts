import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: '概览',
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
          icon: 'lucide:chart-column-big',
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
