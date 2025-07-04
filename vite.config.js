import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/bitget': {
        target: 'https://api.bitget.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bitget/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Bitget proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Bitget proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Bitget proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/upbit': {
        target: 'https://api.upbit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upbit/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Upbit proxy error', err);
          });
        }
      },
      '/api/exchange': {
        target: 'https://api.exchangerate-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/exchange/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Exchange proxy error', err);
          });
        }
      }
    }
  }
})