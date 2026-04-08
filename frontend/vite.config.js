import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: ['all', 'nonmelodic-supergene-jaida.ngrok-free.dev']
  },
  plugins: [react()],
})
