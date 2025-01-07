import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'js/content.js'),
        background: resolve(__dirname, 'js/background.js'),
        popup: resolve(__dirname, 'js/popup.js'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist', // Output directory
    sourcemap: true, // Enable sourcemaps
    minify: 'esbuild', // Minify in production
  },
  define: {
    'process.env.DEBUG_MODE': JSON.stringify(process.env.NODE_ENV !== 'production'),
    'process.env.VERSION': JSON.stringify(require('./manifest.json').version),
  },
  plugins: [
    {
      name: 'copy-config-json',
      // This hook runs after all files are written to disk
      writeBundle() {
        copyFileSync(
          resolve(__dirname, 'config.json'),
          resolve(__dirname, 'dist/config.json')
        );
      },
    },
  ],
});
