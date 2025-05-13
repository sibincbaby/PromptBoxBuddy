import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'

// Read package.json to get version
const packageJson = JSON.parse(
  readFileSync('./package.json', 'utf-8')
)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Define version as a global variable
    '__APP_VERSION__': JSON.stringify(packageJson.version)
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Prompt Box',
        short_name: 'Prompt Box',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Ensure server listens on all interfaces
    hmr: {
      // Use wss for secure connections if needed, but proxy handles this
    },
    // Allow access from the proxy domain
    allowedHosts: [
      '5173-ibkl8kc67y5h9x3r0i7es-a5c7a72e.manus.computer'
    ]
  }
})

