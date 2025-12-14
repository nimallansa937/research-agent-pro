import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3005,
      host: '0.0.0.0',
      proxy: {
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, ''),
        },
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        },
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        },
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        },
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Firebase SDK
              if (id.includes('firebase') || id.includes('@firebase')) {
                return 'vendor-firebase';
              }
              // React core
              if (id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              // PDF processing
              if (id.includes('pdfjs') || id.includes('react-pdf')) {
                return 'vendor-pdf';
              }
              // Markdown
              if (id.includes('react-markdown') || id.includes('remark') || id.includes('syntax-highlighter') || id.includes('refractor') || id.includes('prism')) {
                return 'vendor-markdown';
              }
              // Charts
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              // Canvas and image processing
              if (id.includes('html2canvas') || id.includes('canvas')) {
                return 'vendor-canvas';
              }
              // UI utilities
              if (id.includes('lucide') || id.includes('framer-motion')) {
                return 'vendor-ui';
              }
            }
          }
        }
      },
      chunkSizeWarningLimit: 600
    }
  };
});
