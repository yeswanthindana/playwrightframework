// OBJECTIVE: This file configures ESLint, a tool that automatically inspects our TypeScript and JavaScript code
// to enforce a consistent coding style, check for bugs/issues, and catch common programming mistakes.

// 1. Imports the default ESLint recommended rules package for standard JavaScript.
import eslint from '@eslint/js';

// 2. Imports the Prettier configuration for ESLint, which turns off all rules that might conflict with Prettier formatter.
import eslintConfigPrettier from 'eslint-config-prettier';

// 3. Imports the TypeScript ESLint tool, which provides rule configurations tailored for TypeScript files.
import tseslint from 'typescript-eslint';

// 4. Exports our customized configuration using the TypeScript ESLint helper function.
export default tseslint.config(
    {
        // 5. Defines folders and files that ESLint should completely skip (ignore) during code analysis.
        ignores: [
            'allure-report/**', // Ignored: Compiled Allure HTML reports.
            'allure-results/**', // Ignored: Raw Allure test result data.
            'node_modules/**', // Ignored: Downloaded npm dependencies.
            'playwright-report/**', // Ignored: Default Playwright HTML reports.
            'test-results/**', // Ignored: Failures screenshots/videos/traces.
            'trash/**', // Ignored: Trash and temporary copies of files.
        ],
    },
    // 6. Applies the standard list of recommended rules from ESLint for general JavaScript safety.
    eslint.configs.recommended,

    // 7. Applies the recommended list of rules specifically designed for TypeScript type safety.
    ...tseslint.configs.recommended,

    {
        // 8. Specifies that the following custom rules inside this object only apply to files ending with '.ts' (TypeScript).
        files: ['**/*.ts'],
        rules: {
            // 9. Disables standard 'no-undef' check because TypeScript automatically catches undefined variables.
            'no-undef': 'off',

            // 10. Disables standard 'no-unused-vars' check in favor of the more advanced TypeScript-specific check below.
            'no-unused-vars': 'off',

            // 11. Customizes warning/error for variables that are declared but never used in the code.
            '@typescript-eslint/no-unused-vars': [
                'error', // Triggers an error if a variable is unused.
                {
                    // Exceptions: Ignore parameters/variables that start with an underscore (e.g., '_temp').
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // 12. Configures variable/type/property naming standards (casing rules) to ensure consistent code styling.
            '@typescript-eslint/naming-convention': [
                'error', // Triggers an error if variables are not named correctly.
                {
                    // Default fallback rule: All general code variables/methods should be written in camelCase (e.g. 'myVariable').
                    selector: 'default',
                    format: ['camelCase'],
                    leadingUnderscore: 'allow', // Allows an underscore at the start (e.g., '_myVar').
                    trailingUnderscore: 'allow', // Allows an underscore at the end (e.g., 'myVar_').
                },
                {
                    // Variables: Variables can be camelCase, PascalCase (for classes/constants), or UPPER_CASE (for global constants).
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    // Types (like interfaces, classes, enums): Must be PascalCase (e.g., 'MyClassName').
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    // Property/Parameter exception: Allows specific database table column name patterns that use snake_case.
                    selector: ['property', 'parameterProperty'],
                    filter: {
                        regex: '^(active_streams_count|address_line_1|address_line_2|is_active|regions_count|gpu_nodeName|gpu_maxStreams)$',
                        match: true,
                    },
                    format: null,
                },
                {
                    // Imports: Can be camelCase, PascalCase, or UPPER_CASE.
                    selector: 'import',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                },
                {
                    // Object literal properties & methods: Allow any standard casing to match backend/API conventions.
                    selector: ['objectLiteralProperty', 'objectLiteralMethod'],
                    format: null,
                },
                {
                    // Methods: Allow any method name formatting to support mixed/legacy casings.
                    selector: 'method',
                    format: null,
                },
                {
                    // Parameters: Allow camelCase or PascalCase.
                    selector: 'parameter',
                    format: ['camelCase', 'PascalCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    // General properties: By default, class/object properties must be written in camelCase, UPPER_CASE, snake_case, or PascalCase.
                    selector: ['property', 'parameterProperty'],
                    format: ['camelCase', 'UPPER_CASE', 'snake_case', 'PascalCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
            ],
        },
    },
    // 13. Integrates Prettier rules at the very end to disable any code-style checks that Prettier already formats.
    eslintConfigPrettier,
);
