import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:receipt-text',
      order: 40,
      title: '订单管理',
    },
    name: 'MerchantOrder',
    path: '/order',
    redirect: '/order/line',
    children: [
      {
        name: 'MerchantOrderLine',
        path: '/order/line',
        component: () => import('#/views/merchant/order/line.vue'),
        meta: {
          icon: 'lucide:route',
          title: '线路订单',
          description:
            '查看线路订单列表，支持关键词、状态、日期筛选，并可在弹窗中查看订单详情。',
        },
      },
      {
        name: 'MerchantOrderTicket',
        path: '/order/ticket',
        component: () => import('#/views/merchant/order/ticket.vue'),
        meta: {
          icon: 'lucide:ticket',
          title: '门票订单',
          description:
            '查看门票订单列表，支持筛选，并在详情中查看核销状态、游客和退款信息。',
        },
      },
      {
        name: 'MerchantOrderGoods',
        path: '/order/goods',
        component: () => import('#/views/merchant/order/goods.vue'),
        meta: {
          icon: 'lucide:shopping-bag',
          title: '商品订单',
          description:
            '查看商品订单列表，并在详情中查看收货信息、商品明细与发货记录。',
        },
      },
      {
        name: 'MerchantOrderRefund',
        path: '/order/refund',
        component: () => import('#/views/merchant/order/refund.vue'),
        meta: {
          icon: 'lucide:badge-dollar-sign',
          title: '退款订单',
          description: '查看退款订单，并处理待审核退款申请。',
        },
      },
    ],
  },
];

export default routes;
