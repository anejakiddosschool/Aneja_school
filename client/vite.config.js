import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into separate cached chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-quill': ['react-quill-new'],
          'vendor-capture': ['dom-to-image', 'html2canvas', 'jspdf'],
          'vendor-socket': ['socket.io-client'],
          'vendor-misc': ['axios', 'date-fns', 'lucide-react', 'react-hook-form'],
          'vendor-ui': ['@radix-ui/react-dialog', '@hello-pangea/dnd', 'qrcode.react'],
        },
      },
    },
  },
})
