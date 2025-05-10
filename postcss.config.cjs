const tailwindcss = require('tailwindcss')
const postcssNesting = require('postcss-nesting')
const autoprefixer = require('autoprefixer')

/** @type {import('postcss').Config} */
module.exports = {
  plugins: [
    tailwindcss,
    postcssNesting(),
    autoprefixer
  ]
}
