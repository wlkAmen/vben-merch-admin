import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:route',
      order: 10,
      title: '线路管理',
    },
    name: 'MerchantLine',
    path: '/line',
    redirect: '/line/list',
    children: [
      {
        name: 'MerchantLineList',
        path: '/line/list',
        component: () => import('#/views/merchant/line/list.vue'),
        meta: {
          icon: 'lucide:list-tree',
          title: '线路列表',
          description: '线路列表对接商家自有线路数据，支持筛选和状态切换。',
        },
      },
      {
        name: 'MerchantLineCreate',
        path: '/line/create',
        component: () => import('#/views/merchant/line/form.vue'),
        meta: {
          activePath: '/line/list',
          hideInMenu: true,
          title: '新增线路',
          description: '这里用于创建线路基础信息，套餐和价格库存后续单独维护。',
        },
      },
      {
        name: 'MerchantLineEdit',
        path: '/line/edit/:id',
        component: () => import('#/views/merchant/line/form.vue'),
        meta: {
          activePath: '/line/list',
          hideInMenu: true,
          title: '编辑线路',
          description: '这里用于编辑当前线路的基础信息与媒体资源。',
        },
      },
      {
        name: 'MerchantLineDetail',
        path: '/line/detail/:id',
        component: () => import('#/views/merchant/line/detail.vue'),
        meta: {
          activePath: '/line/list',
          hideInMenu: true,
          title: '线路详情',
          description: '这里展示线路详情、套餐摘要与经营信息。',
        },
      },
      {
        name: 'MerchantLineSuit',
        path: '/line/suit/:id',
        component: () => import('#/views/merchant/line/suit.vue'),
        meta: {
          activePath: '/line/list',
          hideInMenu: true,
          title: '线路套餐管理',
          description: '这里用于维护线路套餐和价格日历。',
        },
      },
      {
        name: 'MerchantLinePrice',
        path: '/line/price/:id',
        component: () => import('#/views/merchant/line/price.vue'),
        meta: {
          activePath: '/line/list',
          hideInMenu: true,
          title: '线路价格库存',
          description: '按套餐维护线路的日期价格与库存，统一回写线路套餐价格日历。',
        },
      },
    ],
  },
];

export default routes;
