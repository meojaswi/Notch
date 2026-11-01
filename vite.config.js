import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const ignoredDirs = ["**/.electron-data/**", "**/dist/**", "**/release/**"];

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ignoredDirs,
    },
  },
  test: {
    include: ["electron/**/*.test.js", "src/**/*.test.{js,jsx}"],
    exclude: ignoredDirs,
  },
});
