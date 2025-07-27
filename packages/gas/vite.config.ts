import { defineConfig } from 'vite';
import gasPlugin from 'rollup-plugin-google-apps-script';

export default defineConfig({
    plugins: [
        gasPlugin(),
    ],
    build: {
        rollupOptions: {
            input: 'src/index.ts',
            output: {
                dir: 'dist',
                entryFileNames: '[name].js',
            },
        },
        minify: false,
    },
});
