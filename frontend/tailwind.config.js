/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        sylva: {
          950: '#1b1d19',
          900: '#262922',
          850: '#2d3029',
          800: '#383b34',
          700: '#4a4d44',
          600: '#5c6055',
          500: '#72776a',
          400: '#8c9283',
          300: '#b4baa9',
          200: '#d5dbc9',
          100: '#e8eed6',
          50: '#eef3e7',
        },
        flora: {
          card: '#f2f3ef',
          ink: '#23261f',
          label: '#7c8177',
          pale: '#eef3e7',
          bloom: '#86efac',
          leaf: '#4ade80',
          moss: '#22c55e',
        },
      },
    },
  },
  plugins: [],
}
