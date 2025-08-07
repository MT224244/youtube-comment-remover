import gasPlugin from 'rollup-plugin-google-apps-script';
import { defineConfig } from 'vite';

import { version } from '../../package.json';

export default defineConfig({
    plugins: [
        gasPlugin(),
    ],
    define: {
        VERSION: JSON.stringify(version),
    },
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
