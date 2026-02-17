import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { webcrypto } from "node:crypto";

/**
 * Vite expects Web Crypto (`globalThis.crypto.getRandomValues`) in Node.
 * Some environments (or older Node) don't provide it, causing:
 * "crypto.getRandomValues is not a function"
 */
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto = webcrypto;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE 'repo-name' WITH YOUR ACTUAL GITHUB REPOSITORY NAME
  // Example: if your repo is github.com/john/versed-up, this should be '/versed-up/'
  base: "/VersedUP/",
});