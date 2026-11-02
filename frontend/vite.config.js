import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true } },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 ainda usa @import e funções globais do Sass. Esses avisos vêm da
        // biblioteca, não do nosso código, e somem quando o Bootstrap migrar para @use.
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
});
