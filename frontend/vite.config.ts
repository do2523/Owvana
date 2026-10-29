import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { ProxyOptions } from 'vite'

// page loads (like refreshing on /login) should get the react app, only fetch calls go to the backend
const backend: ProxyOptions = {
  target: 'http://localhost:5000',
  bypass: (req) => (req.headers.accept?.includes('text/html') ? '/index.html' : undefined),
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/register': backend,
      '/login': backend,
      '/verifyEmail': backend,
      '/resetPassword': backend,
      '/resendVerification': backend,
      '/setNewPassword': backend,
    },
  },
})
