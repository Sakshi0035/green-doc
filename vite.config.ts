import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace <YOUR_REPOSITORY_NAME> with your actual GitHub repo name
  // Example: If your repo is 'greendoc', this should be '/greendoc/'
  base: '/<YOUR_REPOSITORY_NAME>/', 
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});