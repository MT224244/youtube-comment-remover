import eslint from '@eslint/js';
import stylisticPlugin from '@stylistic/eslint-plugin';
import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import gitignorePlugin from 'eslint-config-flat-gitignore';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

type Config = FlatConfig.Config;
type ConfigArray = FlatConfig.ConfigArray;

const pluginConfig: {
    (name: string, config: Config): ConfigArray;
    (configs: Config | ConfigArray): ConfigArray;
} = (nameOrConfigs: string | Config | ConfigArray, config?: Config) => {
    if (typeof nameOrConfigs === 'string') {
        return [{
            name: nameOrConfigs,
            ...config,
        }];
    }
    else if (Array.isArray(nameOrConfigs)) {
        return nameOrConfigs;
    }
    else {
        return [nameOrConfigs];
    }
};

export default tseslint.config(
    {
        name: 'defaults/plugins',
        plugins: {
            'simple-import-sort': simpleImportSortPlugin,
        },
    },

    pluginConfig('eslint/recommended', eslint.configs.recommended),
    pluginConfig('@stylistic/recommended', stylisticPlugin.configs.recommended),
    pluginConfig(tseslint.configs.recommendedTypeChecked),
    pluginConfig(tseslint.configs.stylisticTypeChecked),
    pluginConfig(gitignorePlugin()),

    {
        name: 'defaults/languageOptions',
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        '*.ts',
                        'scripts/*.ts',
                    ],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    {
        name: 'defaults/rules',
        rules: {
            '@stylistic/indent': ['warn', 4],
            '@stylistic/indent-binary-ops': ['warn', 4],
            '@stylistic/member-delimiter-style': ['error', {
                singleline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
                multiline: {
                    delimiter: 'semi',
                    requireLast: true,
                },
            }],
            '@stylistic/eol-last': ['warn', 'always'],
            '@stylistic/operator-linebreak': ['off'],
            '@stylistic/quotes': ['warn', 'single'],
            '@stylistic/semi': ['error', 'always'],
            '@typescript-eslint/consistent-type-imports': ['warn'],
            '@typescript-eslint/no-misused-promises': ['off'],
            '@typescript-eslint/no-unused-vars': ['warn'],
            '@typescript-eslint/prefer-nullish-coalescing': ['off'],
            'simple-import-sort/imports': ['warn'],
            'simple-import-sort/exports': ['warn'],
        },
    },
);
