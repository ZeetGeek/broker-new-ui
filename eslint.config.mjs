import betterTailwind from "eslint-plugin-better-tailwindcss";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,

    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

    {
        name: "yesbroker/imports",
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "simple-import-sort": simpleImportSort,
            "unused-imports": unusedImports,
        },
        rules: {
            "simple-import-sort/imports": [
                "warn",
                {
                    groups: [
                        ["^\\u0000"],
                        ["^react", "^next"],
                        ["^@?\\w"],
                        ["^@/types", "^@/lib", "^@/hooks"],
                        ["^@/components"],
                        ["^@/"],
                        ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
                        ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
                        ["^.+\\.s?css$"],
                    ],
                },
            ],
            "simple-import-sort/exports": "warn",
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
    {
        name: "yesbroker/tailwind",
        files: ["**/*.{js,jsx,ts,tsx}"],
        plugins: {
            "better-tailwindcss": betterTailwind,
        },
        settings: {
            "better-tailwindcss": {
                entryPoint: "app/globals.css",
                detectComponentClasses: true,
            },
        },
        rules: {
            "better-tailwindcss/enforce-consistent-line-wrapping": [
                "warn",
                {
                    printWidth: 100,
                    group: "newLine",
                    preferSingleLine: true,
                },
            ],
            "better-tailwindcss/enforce-consistent-class-order": "warn",
            "better-tailwindcss/enforce-consistent-variant-order": "warn",
            "better-tailwindcss/enforce-consistent-variable-syntax": [
                "warn",
                { syntax: "shorthand" },
            ],
            "better-tailwindcss/enforce-consistent-important-position": [
                "warn",
                { position: "recommended" },
            ],
            "better-tailwindcss/enforce-shorthand-classes": "warn",
            "better-tailwindcss/enforce-canonical-classes": "warn",
            "better-tailwindcss/enforce-logical-properties": "warn",
            "better-tailwindcss/no-duplicate-classes": "warn",
            "better-tailwindcss/no-deprecated-classes": "warn",
            "better-tailwindcss/no-unnecessary-whitespace": "warn",
            "better-tailwindcss/no-concatenated-classes": "warn",
            "better-tailwindcss/no-conflicting-classes": "error",
        },
    },
]);

export default eslintConfig;
