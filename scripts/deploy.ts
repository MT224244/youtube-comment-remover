import { $ as shell } from 'bun';
import { version } from '../package.json';

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

const deployments = await $`clasp list-deployments`;
let deploymentId: string | undefined;
for (const line of deployments.split('\n')) {
    const match = /- ([^ ]+) @\d+/.exec(line);
    if (match) {
        deploymentId = match[1];
        break;
    }
}

if (deploymentId) {
    await $`clasp update-deployment ${deploymentId} -d "v${version}"`;
}
else {
    const deployed = await $`clasp create-deployment -d "v${version}"`;
    const match = /Deployed ([^ ]+) @\d+/.exec(deployed);
    if (match) {
        deploymentId = match[1];
    }
}

const url = `https://script.google.com/macros/s/${deploymentId}/exec?q=tampermonkey`;
console.log('Tampermonkey script URL:', url);
