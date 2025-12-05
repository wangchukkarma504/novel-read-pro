import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely inject only the variable we need.
      // Overwriting the entire 'process.env' object breaks React/Firebase internal checks.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})