module.exports = {
    env: {
        node: true,
        mocha: true,
        es6: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
    },
    plugins: ['mocha'],
    rules: {
        indent: ['error', 4],
        'linebreak-style': ['error', 'windows'],
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'mocha/no-exclusive-tests': 'error'
    }
};
