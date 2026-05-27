/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        border: '#222222',
        accent: '#e85d04',
        success: '#059669',
        warning: '#f59e0b',
        danger: '#dc2626',
        push: '#e85d04',
        rest: '#4a5568',
        pull: '#6d28d9',
        legs: '#059669',
        fullbody: '#dc2626',
        athletic: '#0ea5e9',
        activerest: '#78716c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
