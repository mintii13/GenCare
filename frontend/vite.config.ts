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
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['antd', '@radix-ui/react-avatar', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'editor-vendor': ['quill', 'react-quill'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'class-variance-authority'],
          'icons-vendor': ['lucide-react', '@ant-design/icons', '@radix-ui/react-icons'],
          
          // Page chunks
          'dashboard-consultant': [
            './src/pages/dashboard/Consultant/index.tsx',
            './src/pages/dashboard/Consultant/AppointmentManagement.tsx',
            './src/pages/dashboard/Consultant/WeeklyScheduleManager.tsx',
            './src/pages/dashboard/Consultant/ConsultantSchedule.tsx'
          ],
          'dashboard-customer': [
            './src/pages/dashboard/Customer/index.tsx',
            './src/pages/dashboard/Customer/ConsultantList.tsx',
            './src/pages/dashboard/Customer/MyAppointments.tsx'
          ],
          'consultation': [
            './src/pages/consultation/BookAppointment.tsx',
            './src/pages/consultation/WeeklySlotPicker.tsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600,
    target: 'es2020',
    minify: 'esbuild'
  },
  server: {
    host: true,
    port: 5173
  }
}) 