import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    Icons({
      compiler: 'vue3',
      customCollections: {
        app: FileSystemIconLoader('./src/assets/svg-icons'),
      },
    }),
    basicSsl(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
        @use "@/assets/style/mixin/screen.scss" as *;
        @use "@/assets/style/mixin/font.scss" as *;
        @use "@/assets/style/mixin/common.scss" as *;
        `,
      },
    },
  },
  server: {
    https: true,
    port: 8888,
    proxy: {
      '/message_center': 'https://9df2-119-8-52-77.ngrok-free.app'
    }
  },
});
