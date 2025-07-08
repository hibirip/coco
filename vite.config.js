import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Bitget API 프록시 (로컬 개발환경에서만 사용)
      '/api/bitget': {
        target: 'https://api.bitget.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bitget/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 Bitget Proxy Error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📡 Bitget API Request:', req.method, req.url)
            // HEAD 요청을 GET 요청으로 변환
            if (req.method === 'HEAD') {
              proxyReq.method = 'GET'
            }
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // OPTIONS 및 HEAD 요청에 대한 CORS 헤더 추가
            if (req.method === 'OPTIONS' || req.method === 'HEAD') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Pragma')
            }
          })
        }
      },
      // Upbit API 프록시 (로컬 개발환경에서만 사용)
      '/api/upbit': {
        target: 'https://api.upbit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upbit/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 Upbit Proxy Error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📡 Upbit API Request:', req.method, req.url)
            // HEAD 요청을 GET 요청으로 변환
            if (req.method === 'HEAD') {
              proxyReq.method = 'GET'
            }
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // OPTIONS 및 HEAD 요청에 대한 CORS 헤더 추가
            if (req.method === 'OPTIONS' || req.method === 'HEAD') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Cache-Control, X-Requested-With, Pragma')
            }
          })
        }
      },
      // 환율 API 프록시 (로컬 개발환경에서만 사용)
      '/api/exchange-rate': {
        target: 'https://api.exchangerate-api.com',
        changeOrigin: true,
        rewrite: (path) => '/v6/latest/USD',
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 Exchange Rate Proxy Error:', err.message)
          })
        }
      }
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['date-fns', 'axios']
        }
      }
    }
  }
})