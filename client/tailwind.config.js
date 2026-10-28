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
        // Semantic Token Mapping
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        accent: 'var(--accent)',

        // Brand scale (sampled directly from the URxpenz logo)
        violet: {
          50: '#F6EEFF',
          100: '#EBD9FF',
          200: '#D9B8FF',
          300: '#C48BFF',
          400: '#AD5CFF',
          500: '#8F2BFF',   // primary brand
          600: '#7A00FF',   // pure logo violet, primary buttons
          700: '#5A00D6',
          800: '#3A0A9A',
          900: '#1F0752',
          950: '#0E0420',   // dark background base
        },
        magenta: {
          400: '#F25CFF',   // accent, mirrors the bars
          500: '#D93CF5',
        },

        // Legacy compatibility mappings
        secondary: 'var(--primary)',
        'secondary-hover': 'var(--primary-hover)',
        'slate-dark': 'var(--surface-raised)',
        'slate-light': 'var(--surface-raised)',
        'dark-bg': 'var(--bg)',
        'dark-card': 'var(--surface)',
        'dark-border': 'var(--border)',
        'dark-text-muted': 'var(--text-muted)'
      },
      fontFamily: {
        sans: ['Inter', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Sora', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'container': '20px',
        'btn': '10px',
        'input': '10px',
      },
      boxShadow: {
        'floating': '0 8px 24px -4px rgba(14, 4, 32, 0.15)',
        'modal': '0 20px 40px -8px rgba(14, 4, 32, 0.25)',
      }
    },
  },
  plugins: [],
}
