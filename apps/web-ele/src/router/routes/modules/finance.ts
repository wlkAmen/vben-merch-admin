import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wallet-cards',
      order: 55,
      title: '财务中心',
    },
    name: 'MerchantFinance',
    path: '/finance',
    redirect: '/finance/bill',
    children: [
      {
        name: 'MerchantFinanceBill',
        path: '/finance/bill',
        component: () => import('#/views/merchant/finance/bill.vue'),
        meta: {
          icon: 'lucide:receipt',
          title: '账单查询',
          description: '查看账单汇总、账单流水和周期对账，支持导出对账数据。',
        },
      },
    ],
  },
];

export default routes;
