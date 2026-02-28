import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // const env = loadEnv(mode, process.cwd(), '')
  // const haUrl = env.VITE_HA_URL || 'http://192.168.3.12:8123'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Слушаем на всех интерфейсах для доступа по IP
      port: 3000,
      proxy: {
        // Proxy для Home Assistant API - должен быть первым!
        '/api/homeassistant': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/api/config': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        '/api/auth': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        },
        // Общий proxy для /api
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    // Настройка для оптимизации сборки и code splitting
    build: {
      rollupOptions: {
        output: {
          // Code splitting для больших компонентов
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['react-grid-layout', 'lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 500
    }
  }
})


