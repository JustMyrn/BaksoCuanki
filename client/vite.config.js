import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // <-- 1. Tambahkan baris ini untuk mengatur jalur file
import fs from 'fs'

// 2. Memastikan plugin membaca file babel dari folder utama (root) secara akurat
const babelPluginPath = path.resolve(__dirname, '../live-ui-editor.babel-plugin.js');
const liveUiEditorBabelPlugin = fs.existsSync(babelPluginPath) ? await import(babelPluginPath).then(m => m.default) : null;

export default defineConfig({
  plugins: [
    react({ 
      babel: { 
        // Hanya pasang plugin jika filenya berhasil ditemukan
        plugins: liveUiEditorBabelPlugin ? [liveUiEditorBabelPlugin] : [] 
      } 
    }),
    tailwindcss(),
  ],
  server: {
    fs: {
      strict: false // Membuka gerbang akses folder agar plugin di luar folder client bisa dibaca
    }
  }
})
