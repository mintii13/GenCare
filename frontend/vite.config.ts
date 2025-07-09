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
          // Core vendor - các thư viện cơ bản, luôn cần thiết
          'vendor-core': ['react', 'react-dom', 'react-router-dom', 'axios'],
          
          // UI vendor - các thư viện UI lớn
          'vendor-ui': ['antd', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', 'lucide-react', '@ant-design/icons'],
          
          // Utilities - các thư viện utility (gộp lại thay vì tách nhỏ)
          'vendor-utils': ['date-fns', 'clsx', 'class-variance-authority', 'react-hot-toast', 'quill', 'react-quill']
        }
      }
    },
    chunkSizeWarningLimit: 800, // Tăng limit để cho phép chunks lớn hơn
    target: 'es2020',
    minify: 'esbuild'
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