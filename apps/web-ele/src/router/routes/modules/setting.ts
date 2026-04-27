import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 60,
      title: '设置',
    },
    name: 'MerchantSetting',
    path: '/setting',
    redirect: '/setting/merchant',
    children: [
      {
        name: 'MerchantSettingMerchant',
        path: '/setting/merchant',
        component: () => import('#/views/merchant/setting/merchant.vue'),
        meta: {
          icon: 'lucide:store',
          title: '商家资料',
        },
      },
      {
        name: 'MerchantSettingAccount',
        path: '/setting/account',
        component: () => import('#/views/merchant/setting/account.vue'),
        meta: {
          icon: 'lucide:user-cog',
          title: '账号设置',
        },
      },
    ],
  },
];

export default routes;
