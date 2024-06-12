import { createApp } from 'vue';
import { createPinia } from 'pinia';

import '@/assets/style/base.scss';
import '@opensig/opendesign/es/index.css';
import '@/assets/style/theme/default-light.token.css';
import '@/assets/style/theme/dark.token.css';
import '@/assets/style/theme/index.scss';
import '@/assets/style/element/index.scss';

import VueDOMPurifyHTML from 'vue-dompurify-html';

import App from './App.vue';
import router from './router';

import i18n from './i18n';

const app = createApp(App);

// 国际化
app.use(i18n);
// 状态存储
app.use(createPinia());
// 路由
app.use(router);
// 防xss攻击
app.use(VueDOMPurifyHTML, { ADD_ATTR: ['target'] });

app.mount('#app');
