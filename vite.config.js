import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
