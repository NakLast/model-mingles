import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from "vite-plugin-dts";
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.tsx'),
            name: 'modelMingles',
            fileName: function (format) { return "index.".concat(format, ".js"); }
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM'
                }
            }
        },
        sourcemap: true,
        emptyOutDir: true,
    },
    plugins: [react(), dts()],
});
