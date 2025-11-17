const defaultTheme = require('tailwindcss/defaultTheme')
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-text)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        army: {
          purple: '#7C3AED',
          'purple-light': '#A78BFA',
          'purple-dark': '#5B21B6',
          lavender: '#DDD6FE',
          pink: '#F0ABFC',
          gold: '#FCD34D',
        },
        bts: {
          purple: '#8B5CF6',
          deep: '#6D28D9',
          pink: '#EC4899',
        },
        surface: '#0B0B11',
        panel: '#11131A',
        border: '#23262F',
        muted: '#9CA3AF',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.5)',
        'glow-purple-lg': '0 0 30px rgba(124, 58, 237, 0.6)',
        'card': '0 1px 0 0 rgba(255,255,255,0.04), 0 2px 10px -2px rgba(0,0,0,0.3)',
        'card-hover': '0 2px 0 0 rgba(255,255,255,0.06), 0 8px 24px -6px rgba(0,0,0,0.45)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
