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
          'pink-light': '#F472B6',
        },
        surface: '#0A0A0F',
        panel: '#13141D',
        'panel-hover': '#1A1B26',
        border: '#282A36',
        'border-light': '#3D3F50',
        muted: '#8B92A8',
        accent: '#A78BFA',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'gradient-purple-pink-gold': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #FCD34D 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-radial-purple': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        'mesh-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4)',
        'glow-purple-lg': '0 0 40px rgba(124, 58, 237, 0.5)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'glow-pink-lg': '0 0 40px rgba(236, 72, 153, 0.5)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 12px 0 rgba(139, 92, 246, 0.15), 0 2px 8px 0 rgba(0, 0, 0, 0.4)',
        'card-glow': '0 0 0 1px rgba(139, 92, 246, 0.1), 0 8px 24px -4px rgba(139, 92, 246, 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delay': 'float 3s ease-in-out 1s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': {
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(236, 72, 153, 0.2)',
          },
          '100%': {
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(236, 72, 153, 0.3)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '400': '400ms',
      },
      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
