import fs from 'node:fs/promises';

await fs.rm('dist', { recursive: true, force: true });

const [gasJs, tmJs, appsscriptJson] = await Promise.all([
    Bun.file('packages/gas/dist/index.js').text(),
    Bun.file('packages/tm/dist/index.js').text(),
    Bun.file('appsscript.json').text(),
]);

await Promise.all([
    Bun.write('dist/main.gs', gasJs),
    Bun.write('dist/tampermonkey.html', tmJs),
    Bun.write('dist/appsscript.json', appsscriptJson),
]);

export {};
