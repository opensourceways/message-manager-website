import { watch, computed, onMounted } from 'vue';
import { useAppearance } from '@/stores/common';
import { getCustomCookie, setCustomCookie } from '@/utils/cookie';
import { isClient } from '@opensig/opendesign';

const APPEARANCE_KEY = 'openEuler-theme-appearance';

export const useTheme = () => {
  const appearanceStore = useAppearance();

  const isLight = computed(() => appearanceStore.theme === 'light');
  const isDark = computed(() => appearanceStore.theme === 'dark');

  const changeTheme = () => {
    if (isClient) {
      const theme = appearanceStore.theme === 'dark' ? 'light' : 'dark';
      appearanceStore.theme = theme;

      setCustomCookie(APPEARANCE_KEY, theme, 180, import.meta.env.VITE_COOKIE_DOMAIN);
    }
  };

  watch(
    () => {
      return appearanceStore.theme;
    },
    (val) => {
      const documentElement = document.documentElement;
      val === 'light' && documentElement.removeAttribute('data-o-theme');
      val === 'dark' && documentElement.setAttribute('data-o-theme', 'dark');
    },
    {
      immediate: true,
    }
  );

  onMounted(() => {
    let theme;
    if (!getCustomCookie(APPEARANCE_KEY)) {
      const prefereDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefereDark ? 'dark' : 'light';
    } else {
      theme = getCustomCookie(APPEARANCE_KEY);
    }

    appearanceStore.theme = theme === 'dark' ? 'dark' : 'light';
  });

  return {
    isLight,
    isDark,
    theme: appearanceStore,
    changeTheme,
  };
};
