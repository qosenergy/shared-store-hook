module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:jest/recommended",
    "prettier",
  ],
  plugins: [
    "@typescript-eslint",
    "deprecation",
    "escape",
    "import",
    "jest",
    "no-null",
    "node",
    "prefer-arrow",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
  },
  rules: {
    "accessor-pairs": "error",
    "array-callback-return": "error",
    "arrow-body-style": "error",
    "class-methods-use-this": "error",
    complexity: "error",
    "consistent-return": "error",
    "constructor-super": "error",
    curly: ["error", "all"],
    "default-case": "error",
    "default-case-last": "error",
    eqeqeq: "error",
    "escape/escape": ["error", "non-ascii"],
    "grouped-accessor-pairs": ["error", "getBeforeSet"],
    "guard-for-in": "error",
    "import/first": "error",
    "import/named": "error",
    "import/newline-after-import": "error",
    "import/no-default-export": "error",
    "import/no-named-as-default-member": "error",
    "import/no-named-default": "error",
    "import/no-unassigned-import": "error",
    "import/no-unused-modules": "error",
    "import/order": [
      "error",
      {
        alphabetize: { caseInsensitive: true, order: "asc" },
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "type",
        ],
        warnOnUnassignedImports: true,
      },
    ],
    "jest/expect-expect": "error",
    "jest/unbound-method": "error",
    "max-classes-per-file": ["error", 1],
    "max-lines": ["error", 300],
    "no-alert": "error",
    "no-await-in-loop": "error",
    "no-bitwise": "error",
    "no-caller": "error",
    "no-cond-assign": ["error", "always"],
    "no-console": "error",
    "no-constructor-return": "error",
    "no-continue": "error",
    "no-div-regex": "error",
    "no-else-return": "error",
    "no-eval": "error",
    "no-extend-native": "error",
    "no-extra-bind": "error",
    "no-extra-label": "error",
    "no-implicit-coercion": ["error", { boolean: false }],
    "no-invalid-this": "error",
    "no-irregular-whitespace": ["error", { skipStrings: false }],
    "no-iterator": "error",
    "no-labels": "error",
    "no-lone-blocks": "error",
    "no-lonely-if": "error",
    "no-multi-assign": "error",
    "no-multi-str": "error",
    "no-negated-condition": "error",
    "no-new-func": "error",
    "no-new-object": "error",
    "no-new-wrappers": "error",
    "no-new": "error",
    "no-null/no-null": "error",
    "no-octal-escape": "error",
    "no-param-reassign": "error",
    "no-plusplus": "error",
    "no-promise-executor-return": "error",
    "no-proto": "error",
    "no-restricted-globals": [
      "error",
      "_",
      "$",
      "escape",
      "event",
      "unescape",
      "uneval",
    ],
    "no-restricted-syntax": [
      "error",
      "FunctionExpression",
      "WithStatement",
      {
        message: "setTimeout must always be invoked with two arguments.",
        selector:
          "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
      },
    ],
    "no-return-assign": ["error", "always"],
    "no-script-url": "error",
    "no-self-compare": "error",
    "no-sequences": ["error", { allowInParentheses: false }],
    "no-tabs": "error",
    "no-template-curly-in-string": "error",
    "no-undef-init": "error",
    "no-unmodified-loop-condition": "error",
    "no-unneeded-ternary": "error",
    "no-unreachable-loop": "error",
    "no-unsafe-optional-chaining": "error",
    "no-useless-backreference": "error",
    "no-useless-call": "error",
    "no-useless-computed-key": "error",
    "no-useless-concat": "error",
    "no-useless-rename": "error",
    "no-useless-return": "error",
    "no-void": "error",
    "no-warning-comments": ["error", { location: "anywhere" }],
    "object-shorthand": "error",
    "one-var": ["error", "never"],
    "operator-assignment": "error",
    "padding-line-between-statements": [
      "error",
      { blankLine: "always", next: "return", prev: "*" },
    ],
    "prefer-arrow/prefer-arrow-functions": "error",
    "prefer-destructuring": "error",
    "prefer-exponentiation-operator": "error",
    "prefer-numeric-literals": "error",
    "prefer-object-spread": "error",
    "prefer-promise-reject-errors": "error",
    "prefer-regex-literals": "error",
    "prefer-template": "error",
    "quote-props": ["error", "as-needed"],
    quotes: ["error", "double", { avoidEscape: true }],
    radix: "error",
    "require-atomic-updates": "error",
    "require-unicode-regexp": "error",
    "sort-keys": ["error", "asc", { caseSensitive: false, natural: true }],
    "spaced-comment": [
      "error",
      "always",
      { block: { balanced: true }, markers: ["!", "/"] },
    ],
    "symbol-description": "error",
    "unicode-bom": "error",
    yoda: ["error", "never"],
  },
  settings: {
    "import/resolver": {
      node: {
        extensions: [".ts", ".tsx"],
      },
    },
  },
};
