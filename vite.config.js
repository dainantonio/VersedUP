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

  // ⚠️  IMPORTANT: This MUST match your GitHub repository name exactly (case-sensitive).
  // Example: if your repo URL is https://github.com/youruser/VersedUP  → use "/VersedUP/"
  // Example: if your repo URL is https://github.com/youruser/versed-up → use "/versed-up/"
  base: "/VersedUP/",

  optimizeDeps: {
    // @google-cloud/vision is a server-side Node.js library used only in api/ocr.js.
    // Excluding it prevents Vite from trying to bundle native/gRPC modules for the browser.
    exclude: ["@google-cloud/vision"],
  },
});
