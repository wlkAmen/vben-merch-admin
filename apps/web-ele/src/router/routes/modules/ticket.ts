import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:ticket',
      order: 20,
      title: '门票管理',
    },
    name: 'MerchantTicket',
    path: '/ticket',
    redirect: '/ticket/list',
    children: [
      {
        name: 'MerchantTicketList',
        path: '/ticket/list',
        component: () => import('#/views/merchant/ticket/list.vue'),
        meta: {
          icon: 'lucide:list-tree',
          title: '门票列表',
          description:
            '景点基础资料由平台统一维护，商家端在这里查看可经营景点并进入套餐与价格库存维护。',
        },
      },
      {
        name: 'MerchantTicketCreate',
        path: '/ticket/create',
        component: () => import('#/views/merchant/common/placeholder.vue'),
        meta: {
          activePath: '/ticket/list',
          hideInMenu: true,
          title: '新增门票',
          description: '景点基础资料由平台维护，当前商家端不提供门票主表新增能力。',
        },
      },
      {
        name: 'MerchantTicketEdit',
        path: '/ticket/edit/:id',
        component: () => import('#/views/merchant/common/placeholder.vue'),
        meta: {
          activePath: '/ticket/list',
          hideInMenu: true,
          title: '编辑门票',
          description: '景点基础资料由平台维护，当前商家端不提供门票主表编辑能力。',
        },
      },
      {
        name: 'MerchantTicketDetail',
        path: '/ticket/detail/:id',
        component: () => import('#/views/merchant/ticket/detail.vue'),
        meta: {
          activePath: '/ticket/list',
          hideInMenu: true,
          title: '门票详情',
          description: '这里展示景点详情以及当前商家可经营套餐摘要。',
        },
      },
      {
        name: 'MerchantTicketSuit',
        path: '/ticket/suit/:id',
        component: () => import('#/views/merchant/ticket/suit.vue'),
        meta: {
          activePath: '/ticket/list',
          hideInMenu: true,
          title: '门票套餐管理',
          description: '这里对接 ticket/suit 系列接口，维护当前商家自己的门票套餐。',
        },
      },
      {
        name: 'MerchantTicketPrice',
        path: '/ticket/price/:id',
        component: () => import('#/views/merchant/ticket/price.vue'),
        meta: {
          activePath: '/ticket/list',
          hideInMenu: true,
          title: '门票价格库存',
          description: '按套餐维护门票日期价格与库存，并同步受套餐审核流约束。',
        },
      },
    ],
  },
];

export default routes;
