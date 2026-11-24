import betterTailwind from "eslint-plugin-better-tailwindcss";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,

    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "dist/**",
        "coverage/**",
        ".turbo/**",
        ".vercel/**",
        ".pnpm-store/**",
        "node_modules/**",
        ".husky/_/**",
        ".eslintcache",
        "**/*.tsbuildinfo",
        "next-env.d.ts",
        "**/*.log",
        "detect-band-*.json",
        "**/*.err",
        "**/*.tmp",
        "**/*.temp",
        "**/*.bak",
        "tmp/**",
        ".tmp/**",
        ".agents/skills/**",
        ".claude/skills/**",
        ".cursor/skills/**",
        ".env*",
        ".claude/settings.local.json",
        ".impeccable/config.local.json",
        ".impeccable/hook.cache.json",
        ".impeccable/hook.pending.json",
        ".impeccable/live/**",
    ]),

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
        name: "yesbroker/shared-modals",
        files: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "components/shared/**/*.{ts,tsx}"],
        ignores: [
            "components/shared/app-modal.tsx",
            "components/shared/app-modal-header.tsx",
            "components/shared/app-modal-footer.tsx",
            "features/chat/chat-lightbox.tsx",
            "features/properties/property-detail/property-lightbox.tsx",
        ],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector:
                        "CallExpression[callee.object.name='window'][callee.property.name=/^(alert|confirm|prompt)$/]",
                    message: "Use AppModal or ConfirmDialog instead of browser-native dialogs.",
                },
                {
                    selector:
                        "JSXOpeningElement[name.name=/^(AppModal|TaskPanel|VisitOverlay)$/] > JSXAttribute[name.name='footer'] > JSXExpressionContainer > JSXElement > JSXOpeningElement[name.name=/^(div|footer)$/]",
                    message:
                        "Use AppModalFooter for dialog footer content instead of an ad hoc container.",
                },
            ],
            "no-restricted-imports": [
                "error",
                {
                    paths: [
                        "@/components/ui/dialog",
                        "@base-ui/react/dialog",
                        "@base-ui/react/alert-dialog",
                        "@base-ui/react/drawer",
                    ].map((name) => ({
                        name,
                        message:
                            "Use the shared AppModal (or ConfirmDialog) for product modals. Photo lightboxes are exempt.",
                    })),
                },
            ],
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
            // Prettier owns wrapping; both formatters otherwise undo each other's JSX layout.
            "better-tailwindcss/enforce-consistent-line-wrapping": "off",
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
