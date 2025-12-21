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
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        // Прокси для сервера настроек - перенаправляем запросы на сервер настроек
        '/api/config': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/config/, '/api/config')
        },
        '/api/auth': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/auth/, '/api/auth')
        }
      }
    },
    // Настройка для правильной работы роутинга
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    }
  }
})


