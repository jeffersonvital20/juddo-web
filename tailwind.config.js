/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        judoo: {
          blue: '#0052cc',
          blueDark: '#0747a6',
          white: '#ffffff',
          red: '#de350b',
          gold: '#ffab00',
          dark: '#0f172a',
          tatameGreen: '#1b4332',
          tatameRed: '#9e2a2b'
        }
      }
    },
  },
  plugins: [],
}
