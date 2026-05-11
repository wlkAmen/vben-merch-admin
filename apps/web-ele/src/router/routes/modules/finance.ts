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
      {
        name: 'MerchantFinanceSettlement',
        path: '/finance/settlement',
        component: () => import('#/views/merchant/finance/settlement.vue'),
        meta: {
          icon: 'lucide:hand-coins',
          title: '结算中心',
          description: '查看结算明细、提交结算申请，并跟踪结算单状态。',
        },
      },
    ],
  },
];

export default routes;
