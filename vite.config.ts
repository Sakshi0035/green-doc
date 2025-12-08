import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages Base URL for repo 'green-doc'
  base: '/green-doc/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});