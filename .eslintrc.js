const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:vue/vue3-recommended'],
  rules: {
    'no-alert': 'off',
    'import/namespace': 'off',
    'import/default': 'off',
  },
})
