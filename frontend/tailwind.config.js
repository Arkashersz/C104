/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0f132e',
        'primary-medium': '#19274e',
        'primary-light': '#536d88',
        'accent-dark': '#b49b85',
        'accent-light': '#eac195',
        'background': '#fafafa',
        'surface': '#ffffff',
        'text-primary': '#0f132e',
        'text-secondary': '#536d88',
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(15, 19, 46, 0.1), 0 2px 4px -1px rgba(15, 19, 46, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(15, 19, 46, 0.1), 0 4px 6px -2px rgba(15, 19, 46, 0.05)',
      }
    },
  },
  plugins: [],
}
