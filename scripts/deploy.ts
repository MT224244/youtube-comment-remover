import { $ as shell } from 'bun';
import { version } from '@ycr/gas/package.json';

const $ = async (strings: TemplateStringsArray, ...expressions: Bun.ShellExpression[]) => {
    const command = strings.raw
        .map(x => x.replace(/\s?\\\r?\n[\s\t]*/g, ' '))
        .reduce((a, b, index) => a + `${expressions[index - 1] ?? ''}` + b, '')
        .trim();
    console.log('$', command);

    const result = await shell(strings, ...expressions).text();
    console.log(result);

    return result;
};

const deployes = await $`clasp list-deployments`;
let deplymentId: string | undefined;
for (const line of deployes.split('\n')) {
    const match = /- ([^ ]+) @\d+/.exec(line);
    if (match) {
        deplymentId = match[1];
        break;
    }
}

if (deplymentId) {
    await $`clasp update-deployment ${deplymentId} -d "v${version}"`;
}
else {
    const deployed = await $`clasp create-deployment -d "v${version}"`;
    const match = /Deployed ([^ ]+) @\d+/.exec(deployed);
    if (match) {
        deplymentId = match[1];
    }
}

const url = `https://script.google.com/macros/s/${deplymentId}/exec?q=tampermonkey`;
console.log('Tampermonkey script URL:', url);
