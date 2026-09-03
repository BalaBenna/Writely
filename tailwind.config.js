/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        writely: {
          50: '#f4f6fb',
          100: '#e8edf7',
          200: '#cbd7ee',
          300: '#9eb8e1',
          400: '#6b93d1',
          500: '#4872bf',
          600: '#3457a3',
          700: '#2a4584',
          800: '#263b6d',
          900: '#23345b',
          950: '#17213b',
        },
        issue: {
          grammar: '#ef4444',
          spelling: '#f59e0b',
          clarity: '#8b5cf6',
          tone: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(99, 102, 241, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
