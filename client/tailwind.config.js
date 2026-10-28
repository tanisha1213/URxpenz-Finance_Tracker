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
        secondary: '#7A55E0',    // Soft Dark Brand Primary
        accent: '#D77BE8',       // Soft Dark Brand Accent
        danger: '#ef4444',       // Red 500
        warning: '#f59e0b',      // Amber 500
        'slate-dark': '#181226', // Surface
        'slate-light': '#f8fafc', // Slate 50
        'dark-bg': '#0F0B1A',
        'dark-card': '#181226',
        'dark-raised': '#211A33',
        'dark-border': '#3A2F57',
        'dark-text': '#ECE7F7',
        'dark-text-muted': '#9D93B5'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'premium': '0 10px 30px -10px rgba(0, 0, 0, 0.05)'
      },
      borderRadius: {
        'xl font': '1rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem'
      }
    },
  },
  plugins: [],
}
