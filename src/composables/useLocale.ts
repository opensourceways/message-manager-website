import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isClient, isUndefined } from '@opensig/opendesign';

import type { LocaleT } from '@/@types/type-locale';

export const useLocale = () => {
  const { t, locale } = useI18n();

  const isZh = computed(() => locale.value === 'zh');
  const isEn = computed(() => locale.value === 'en');

  watch(
    () => isZh.value,
    () => {
      if (isZh.value) {
        document.documentElement.lang = 'zh';
      } else {
        document.documentElement.lang = 'en';
      }
    },
    {
      immediate: true,
    }
  );

  // 语言切换
  const changeLocale = (lang?: LocaleT) => {
    if (locale.value === lang) {
      return;
    }

    const language = isUndefined(lang) ? (isZh.value ? 'en' : 'zh') : lang;

    if (isClient) {
      localStorage.setItem('locale', language);
      location.reload();
    }
  };

  return {
    t,
    locale,
    isZh,
    isEn,
    changeLocale,
  };
};
