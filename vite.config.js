import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE 'repo-name' WITH YOUR ACTUAL GITHUB REPOSITORY NAME
  // Example: if your repo is github.com/john/versed-up, this should be '/versed-up/'
  base: '/VersedUP/', 
})

