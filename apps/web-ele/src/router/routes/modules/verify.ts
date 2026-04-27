import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:scan-line',
      order: 50,
      title: '核销中心',
    },
    name: 'MerchantVerify',
    path: '/verify',
    redirect: '/verify/query',
    children: [
      {
        name: 'MerchantVerifyQuery',
        path: '/verify/query',
        component: () => import('#/views/merchant/verify/query.vue'),
        meta: {
          icon: 'lucide:scan-search',
          title: '核销查询',
          description: '支持输入或扫描核销码，查询门票核销详情并执行核销。',
        },
      },
      {
        name: 'MerchantVerifyRecords',
        path: '/verify/records',
        component: () => import('#/views/merchant/verify/records.vue'),
        meta: {
          icon: 'lucide:history',
          title: '核销记录',
          description: '查看当前商家的门票核销记录，并支持从待核销记录直接完成核销。',
        },
      },
    ],
  },
];

export default routes;
