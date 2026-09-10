import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` é obrigatório para o Electron carregar o build via file://
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
