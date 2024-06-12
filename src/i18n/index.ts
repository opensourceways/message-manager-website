import { createI18n, type I18nOptions } from 'vue-i18n';

// 操作&反馈提示
import response from './response';

const datetimeFormats: I18nOptions['datetimeFormats'] = {
  zh: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
  },
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    },
  },
};

const messages = {
  zh: {
    // 操作&反馈提示
    response: response.zh,
  },
  en: {
    // 操作&反馈提示
    response: response.en,
  },
};

const locale = 'zh';

const i18n = createI18n({
  globalInjection: true,
  locale,
  legacy: false,
  fallbackLocale: 'zh',
  messages,
  datetimeFormats,
});

export default i18n;
