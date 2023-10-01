module.exports = {
    root: true,
    env: {
        es6: true,
        node: true
    },
    extends: [
        `eslint:recommended`,
        `plugin:import/typescript`,
        `plugin:@typescript-eslint/eslint-recommended`,
        `plugin:@typescript-eslint/recommended`,
        `plugin:import/errors`,
        `plugin:import/warnings`,
        `prettier`
    ],
    parser: `@typescript-eslint/parser`,
    ignorePatterns: [`/lib/**/*`],
    plugins: [
        `node`,
        `@typescript-eslint`,
        `import`
    ],
    rules: {
        quotes: [`error`, `backtick`],
        "array-element-newline": [`error`, {
            "ArrayExpression": `consistent`,
                "ArrayPattern": {
                    "multiline": true,
                    "minItems": 3
                }
        },],
        "import/order": [
            `warn`,
            {
                "groups": [
                    `builtin`,
                    `external`,
                    `internal`,
                    `parent`,
                    `sibling`,
                    `index`,
                    `object`,
                    `type`
                ],
                "newlines-between": `always`,
                "pathGroupsExcludedImportTypes": [`builtin`],
                "alphabetize": { "order": `asc`, "caseInsensitive": true },
                "pathGroups": [
                    { "pattern": `src/types/**`, "group": `internal`, "position": `before` }, { "pattern": `src/repositories/**`, "group": `internal`, "position": `before` },
                ]
            }
        ],
    },
    settings: {
        'import/resolver': {
            typescript: { project: `./` }
        }
    }
}
