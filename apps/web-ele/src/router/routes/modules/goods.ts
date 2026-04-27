import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shopping-bag',
      order: 30,
      title: '商品管理',
    },
    name: 'MerchantGoods',
    path: '/goods',
    redirect: '/goods/list',
    children: [
      {
        name: 'MerchantGoodsList',
        path: '/goods/list',
        component: () => import('#/views/merchant/goods/list.vue'),
        meta: {
          icon: 'lucide:list-tree',
          title: '商品列表',
          description: '商品列表支持按类型、审核状态和上下架状态筛选，并维护商品审核与上架流程。',
        },
      },
      {
        name: 'MerchantGoodsCreate',
        path: '/goods/create',
        component: () => import('#/views/merchant/goods/form.vue'),
        meta: {
          activePath: '/goods/list',
          hideInMenu: true,
          title: '新增商品',
          description: '这里用于创建商品主表信息；多规格商品创建后请继续到 SKU 页面维护规格组合。',
        },
      },
      {
        name: 'MerchantGoodsEdit',
        path: '/goods/edit/:id',
        component: () => import('#/views/merchant/goods/form.vue'),
        meta: {
          activePath: '/goods/list',
          hideInMenu: true,
          title: '编辑商品',
          description: '这里用于编辑商品主表内容，保存后会重新进入平台审核。',
        },
      },
      {
        name: 'MerchantGoodsDetail',
        path: '/goods/detail/:id',
        component: () => import('#/views/merchant/goods/detail.vue'),
        meta: {
          activePath: '/goods/list',
          hideInMenu: true,
          title: '商品详情',
          description: '这里展示商品基础信息、审核状态、参数详情、图文详情与 SKU 摘要。',
        },
      },
      {
        name: 'MerchantGoodsSku',
        path: '/goods/sku/:id',
        component: () => import('#/views/merchant/goods/sku.vue'),
        meta: {
          activePath: '/goods/list',
          hideInMenu: true,
          title: 'SKU 管理',
          description: '这里对接 goods/sku/detail 与 goods/sku/save，用于维护多规格商品的规格组合与库存价格。',
        },
      },
    ],
  },
];

export default routes;
