import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor - Essential libraries
          'vendor-core': ['react', 'react-dom', 'react-router-dom', 'axios'],
          
          // UI Libraries - Split for better caching
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-radix': [
            '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu', 
            '@radix-ui/react-select', '@radix-ui/react-alert-dialog',
            '@radix-ui/react-label', '@radix-ui/react-slot', 
            '@radix-ui/react-switch', '@radix-ui/react-tabs'
          ],
          
          // Editor - Heavy components  
          'vendor-editor': ['quill', 'react-quill', 'lexical', '@lexical/react', '@lexical/rich-text'],
          
          // Calendar & Date utilities
          'vendor-calendar': ['react-calendar', 'react-day-picker', 'date-fns'],
          
          // Icons - Frequently used
          'vendor-icons': ['lucide-react', 'react-icons', '@radix-ui/react-icons'],
          
          // Form & Data utilities
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod', 'react-data-table-component'],
          
          // Animation & UI utilities
          'vendor-animation': ['framer-motion', 'clsx', 'class-variance-authority', 'tailwind-merge', 'tailwindcss-animate'],
          
          // Notifications & Utils
          'vendor-utils': ['react-hot-toast', 'react-toastify', 'react-markdown']
        }
      }
    },
    chunkSizeWarningLimit: 500, // Reduced from 800
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false // Disable in production
  },
  server: {
    host: true,
    port: 5173,
    // Proxy disabled - using VITE_API_URL environment variable instead
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  
        changeOrigin: true,
        secure: false
      }
    }
  }
})  