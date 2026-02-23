export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    // PostCSS strips // comments during build
    'no-invalid-double-slash-comments': null,
    // BEM naming: .block__element--modifier
    'selector-class-pattern': null,
    // Custom properties use project conventions (e.g. --u-font-size--1)
    'custom-property-pattern': null,
    // Allow empty source files (PostCSS placeholders)
    'no-empty-source': null,
    // Preserve casing for font family names (proper nouns)
    'value-keyword-case': ['lower', { camelCaseSvgKeywords: true, ignoreProperties: [/^--font/] }],
    'order/order': ['custom-properties', 'declarations'],
    'order/properties-alphabetical-order': true,
  },
}
