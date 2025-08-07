import { defineConfig } from 'vite';

import { version } from '../../package.json';
import packageJson from './package.json';

export default defineConfig({
    plugins: [{
        name: 'banner',
        generateBundle: (_, bundle) => {
            const { name, namespace, ...tampermonkey } = packageJson.tampermonkey;
            const arr: string[][] = [
                ['name', name],
                ['namespace', namespace],
                ['version', version],
                ['description', packageJson.description],
                ['author', packageJson.author],
                ...Object.entries(tampermonkey).flatMap(([key, value]) => {
                    if (typeof value === 'string') {
                        return [[key, value]];
                    }
                    else {
                        return value.map(v => [key, v]);
                    }
                }),
            ];
            const len = Math.max(...arr.map(x => x[0].length));

            let banner = '// ==UserScript==\n';
            for (const [key, value] of arr) {
                banner += `// @${key.padEnd(len, ' ')} ${value}\n`;
            }
            banner += '// ==/UserScript==\n\n';

            banner += `const SCRIPT_NAME = '${name}';\n`;
            banner += 'const BACKEND_URL = \'{{BACKEND_URL}}\';\n\n';

            for (const fname of Object.keys(bundle)) {
                const chunk = bundle[fname];
                if (chunk.type === 'chunk' && fname.endsWith('.js')) {
                    chunk.code = banner + chunk.code;
                }
            }
        },
    }],
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
