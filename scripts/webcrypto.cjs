const { webcrypto } = require("node:crypto");

/**
 * Vite expects `globalThis.crypto.getRandomValues` early during startup.
 * Some Node environments don't expose it -> build fails.
 */
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto = webcrypto;
}

module.exports = {};
