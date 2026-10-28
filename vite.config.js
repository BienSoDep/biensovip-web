import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// UC-OPT03 — Code-Splitting nâng cao tối ưu Core Web Vitals 95+ điểm
// Tách nhỏ các vendor chunk riêng biệt:
// - Khách public không tải bộ thư viện soạn thảo (Tiptap/Mammoth) hoặc biểu đồ Recharts của Admin.
// - Tận dụng tối đa bộ nhớ đệm trình duyệt (HTTP Long-term Caching) khi cập nhật code logic.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@tiptap') || id.includes('mammoth') || id.includes('marked') || id.includes('dompurify')) {
              return 'vendor-editor';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            if (id.includes('framer-motion') || id.includes('@base-ui') || id.includes('gsap')) {
              return 'vendor-ui-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('@microsoft/signalr')) {
              return 'vendor-signalr';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-canvas';
            }
            return 'vendor-other';
          }
        }
      }
    }
  }
})
