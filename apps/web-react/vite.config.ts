import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
	alias: {
	  '@': path.resolve(__dirname, './src'),  // @ = apps/web/src
	  '@features': '/src/features',
      '@components': '/src/components',
	  '@my-page': '/src/features/my-page/components',
	  '@assets': '/src/assets',
	}
  }
})