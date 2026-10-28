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
        primary: '#0f172a',      // Slate 900
        secondary: '#4f46e5',    // Indigo 600
        accent: '#10b981',       // Emerald 500
        danger: '#ef4444',       // Red 500
        warning: '#f59e0b',      // Amber 500
        'slate-dark': '#1e293b', // Slate 800
        'slate-light': '#f8fafc', // Slate 50
        'dark-bg': '#090a0f',
        'dark-card': '#13141f',
        'dark-border': '#222533',
        'dark-text-muted': '#94a3b8'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.05)'
      },
      borderRadius: {
        'xl font': '1rem',
        '2xl': '1.5rem'
      }
    },
  },
  plugins: [],
}
