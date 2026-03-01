import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-datashow', 
      order: 12,  // 菜单顺序
      title: $t('page.datashow.title'),  
    },
    name: 'Datashow',
    path: '/datashow',
    children: [
      {
        name: 'Show',
        path: 'show',
        component: () => import('#/views/datashow/show/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.datashow.show'),
          keepAlive: true,
        },
      },
      {
        name: 'Sort',
        path: 'sort',
        component: () => import('#/views/datashow/sort/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.datashow.sort'),
        },
      },
    ],
  },
];

export default routes;