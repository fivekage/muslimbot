module.exports = {
   env: {
      node: true,
      commonjs: true,
      es2021: true,
      es6: true,
   },

   extends: ['eslint:recommended', 'google'],
   overrides: [
      {
         files: [
            '.eslintrc.{js,cjs}',
         ],
         parserOptions: {
            sourceType: 'script',
         },
      },
   ],
   parserOptions: {
      ecmaVersion: 'latest',
   },
   rules: {
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-multi-spaces': ['error'],
      'max-len': ['warn', { 'code': 100 }],
      'indent': ['error', 3],
      'object-curly-spacing': 'off',
   },
};
