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
          'purple-glow': '#8B5CF6',
          lavender: '#DDD6FE',
          pink: '#F0ABFC',
          gold: '#FCD34D',
          'gold-bright': '#FBBF24',
          silver: '#E5E7EB',
          bronze: '#D97706',
          tactical: '#1F2937',
          'tactical-light': '#374151',
          'tactical-border': '#4B5563',
        },
        bts: {
          purple: '#8B5CF6',
          deep: '#6D28D9',
          'deep-dark': '#5B21B6',
          pink: '#EC4899',
          'pink-light': '#F472B6',
          'pink-bright': '#FF6EC7',
          'pink-glow': '#F9A8D4',
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
        },
        surface: {
          DEFAULT: '#0A0A0F',
          dark: '#050507',
          elevated: '#0F0F14',
          light: '#1E1F2E',
        },
        panel: {
          DEFAULT: '#13141D',
          hover: '#1A1B26',
          elevated: '#1F202A',
          glass: 'rgba(19, 20, 29, 0.6)',
        },
        border: {
          DEFAULT: '#282A36',
          light: '#3D3F50',
          bright: '#4F5260',
          glow: '#8B5CF6',
        },
        muted: '#8B92A8',
        accent: {
          DEFAULT: '#A78BFA',
          bright: '#C4B5FD',
          dark: '#7C3AED',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          glow: '#6EE7B7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.05)',
        'card-hover': '0 8px 24px 0 rgba(139, 92, 246, 0.15), 0 4px 12px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.2)',
        'card-premium': '0 12px 40px 0 rgba(139, 92, 246, 0.2), 0 6px 16px 0 rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)',
        'glow-gold': '0 0 20px rgba(252, 211, 77, 0.4), 0 0 40px rgba(252, 211, 77, 0.2)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.1)',
        'tactical': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delay': 'float 3s ease-in-out 1s infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'slide-left': 'slide-left 0.4s ease-out',
        'slide-right': 'slide-right 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-slow': 'fade-in 0.6s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-up': 'scale-up 0.2s ease-out',
        'bounce-subtle': 'bounce-subtle 0.6s ease-out',
        'rotate-slow': 'rotate-slow 20s linear infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
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
        'slide-left': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.3)' },
        },
        'rotate-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
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
