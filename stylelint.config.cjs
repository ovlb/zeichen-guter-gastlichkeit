module.exports = {
  extends: ['stylelint-prettier/recommended', 'stylelint-config-prettier'],
  plugins: ['stylelint-order'],
  rules: {
    'order/order': ['custom-properties', 'declarations'],
    'order/properties-alphabetical-order': true,
  },
}
