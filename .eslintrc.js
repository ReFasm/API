module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "ignorePatterns": ["dist/*.js"],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "no-prototype-builtins": "off",
        "no-var": "off"
    }
}
