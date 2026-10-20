import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// `--mode artifact` gera um HTML único (JS/CSS embutidos) para publicar como página do Claude.
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    plugins: [react(), ...(artifact ? [viteSingleFile()] : [])],
    // base relativa permite publicar em GitHub Pages ou qualquer subpasta
    base: './',
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    // `npm run dev:api`: o Vite repassa /api para o servidor local (npm run server)
    server: { proxy: { '/api': `http://localhost:${process.env.PORT ?? 8787}` } },
    define: artifact ? { 'import.meta.env.VITE_TARGET': JSON.stringify('artifact') } : {},
    build: artifact ? { outDir: 'dist-artifact', emptyOutDir: false } : {},
  };
});
