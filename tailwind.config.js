/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: {
          50: '#f4f6f8',
          100: '#e8ecf1',
          800: '#1c2330',
          900: '#12171f',
          950: '#0c1016'
        },
        accent: {
          DEFAULT: '#3d9a8f',
          dim: '#2e7a72'
        }
      }
    }
  }
}
