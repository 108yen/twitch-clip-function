import cspellPlugin from "@cspell/eslint-plugin"
import { fixupPluginRules } from "@eslint/compat"
import eslint from "@eslint/js"
import pluginImport from "eslint-plugin-import"
import perfectionist from "eslint-plugin-perfectionist"
import pluginUnusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import {
  config as tseslintConfig,
  configs as tseslintConfigs,
  parser as tseslintParser,
  plugin as tseslintPlugin,
} from "typescript-eslint"

/** @typedef {import("typescript-eslint").ConfigWithExtends} TSESLintConfig */

/** @type {{js: string[], ts: string[], all: string[]}} */
const sourceFilePaths = {
  all: [
    "**/*.js",
    "**/*.cjs",
    "**/*.mjs",
    "**/*.jsx",
    "**/*.ts",
    "**/*.cts",
    "**/*.mts",
    "**/*.tsx",
    "**/*.d.ts",
  ],
  js: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.jsx"],
  ts: ["**/*.ts", "**/*.cts", "**/*.mts", "**/*.tsx", "**/*.d.ts"],
}

/** @type {Pick<TSESLintConfig, "name" | "ignores">} */
const ignoreTSESConfig = {
  ignores: [".next/**", "node_modules/**", "**/pnpm-lock.yaml", ".eslintcache"],
  name: "@twitch-clip-function/ignores/base",
}

/** @type {Pick<TSESLintConfig, "name" | "languageOptions">} */
const languageOptionTSESConfig = {
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.es2025,
    },
    parser: tseslintParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 2025,
      sourceType: "module",
    },
  },
  name: "@twitch-clip-function/language-options/base",
}

const allSourceFileExtensions = [
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".cts",
  ".mts",
  ".tsx",
  ".d.ts",
]

/** @type {Pick<TSESLintConfig, "name" | "files" | "plugins" | "rules" | "settings">} */
const importTSESConfig = {
  files: sourceFilePaths.all,
  name: "@twitch-clip-function/import/base",
  plugins: {
    import: fixupPluginRules(pluginImport),
    "unused-imports": pluginUnusedImports,
  },
  rules: {
    ...pluginImport.configs.recommended.rules,
    ...pluginImport.configs.typescript.rules,
    // Set of `import` rules that existed in `eslint-config-next`.
    "import/no-anonymous-default-export": "error",

    // These rules existed in the `.eslintrc`.
    "unused-imports/no-unused-imports": "error",
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": allSourceFileExtensions,
    },
    "import/resolver": {
      node: {
        extensions: allSourceFileExtensions,
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
}

/** @type {Pick<TSESLintConfig, "name" | "files" | "rules">} */
const eslintTSESConfig = {
  files: sourceFilePaths.all,
  name: "@twitch-clip-function/eslint/base",
  rules: {
    ...eslint.configs.recommended.rules,
    quotes: ["error", "double"],
  },
}

/** @type {Pick<TSESLintConfig, "name" | "files" | "plugins" | "rules">[]} */
const typescriptTSESConfigArray = [
  {
    files: sourceFilePaths.all,
    name: "@twitch-clip-function/typescript/base",
    plugins: {
      "@typescript-eslint": tseslintPlugin,
    },
    rules: {
      ...tseslintConfigs.recommended
        .filter((config) => config.rules !== undefined)
        .reduce((acc, config) => ({ ...acc, ...config.rules }), {}),

      ...tseslintConfigs.stylistic
        .filter((config) => config.rules !== undefined)
        .reduce((acc, config) => ({ ...acc, ...config.rules }), {}),

      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/ban-types": "off",
      // If you want to unify the type definition method to either `type` or `interface`, you can enable this rule.
      // https://typescript-eslint.io/rules/consistent-type-definitions
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",

      "@typescript-eslint/no-unnecessary-type-constraint": "off",
    },
  },

  // These rules existed in the `.eslintrc`.
  {
    files: sourceFilePaths.js,
    name: "@twitch-clip-function/typescript/disabled-in-js",
    plugins: {
      "@typescript-eslint": tseslintPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
]

/**
 * @type {Pick<TSESLintConfig, "name" | "files" | "plugins" | "rules">}
 */
const prettierTSESConfig = {
  files: sourceFilePaths.all,
  name: "@twitch-clip-function/prettier/base",
  rules: {
    curly: "off",
    "no-unexpected-multiline": "off",
  },
}

/** @type {Pick<TSESLintConfig, "name" | "files" | "plugins" | "rules" | "settings">} */
const sortTSESConfig = {
  files: sourceFilePaths.all,
  name: "@twitch-clip-function/sort/base",
  plugins: {
    perfectionist,
  },
  rules: {
    ...perfectionist.configs["recommended-natural"].rules,
    "perfectionist/sort-classes": "off",
    "perfectionist/sort-modules": [
      "error",
      {
        groups: [
          "declare-enum",
          "export-enum",
          "enum",
          ["declare-interface", "declare-type"],
          ["export-interface", "export-type"],
          "declare-class",
          "class",
          "export-class",
          "declare-function",
        ],
      },
    ],
  },
}

/** @type {Pick<TSESLintConfig, "name" | "files" | "plugins" | "rules" | "settings">} */
const cspellConfig = {
  files: sourceFilePaths.all,
  name: "@twitch-clip-function/cspell/base",
  plugins: {
    "@cspell": cspellPlugin,
  },
  rules: {
    "@cspell/spellchecker": [
      "warn",
      {
        configFile: new URL("./cspell.json", import.meta.url).toString(),
        cspell: {},
      },
    ],
  },
}

export default tseslintConfig(
  ignoreTSESConfig,
  languageOptionTSESConfig,
  eslintTSESConfig,
  ...typescriptTSESConfigArray,
  importTSESConfig,
  prettierTSESConfig,
  sortTSESConfig,
  cspellConfig,
)
