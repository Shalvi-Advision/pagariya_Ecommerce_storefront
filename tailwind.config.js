const { BREAKPOINTS, SPACING, BORDER_RADIUS, SHADOWS } = require('./src/constants');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': BREAKPOINTS.xs,
      'sm': BREAKPOINTS.sm,
      'md': BREAKPOINTS.md,
      'lg': BREAKPOINTS.lg,
      'xl': BREAKPOINTS.xl,
      '2xl': BREAKPOINTS['2xl'],

      // Named breakpoints for better readability
      'mobile': BREAKPOINTS.mobile,
      'tablet': BREAKPOINTS.tablet,
      'laptop': BREAKPOINTS.laptop,
      'desktop': BREAKPOINTS.desktop,
      'desktop-lg': BREAKPOINTS['desktop-lg'],
    },
    extend: {
      colors: {
        primary: {
          50: '#fff8f0',
          100: '#ffe8cc',
          200: '#ffd199',
          300: '#ffb566',
          400: '#f99b33',
          500: '#E57D02',
          600: '#cc6e02',
          700: '#b35f02',
          800: '#994f02',
          900: '#804001',
        },
        secondary: {
          50: '#fdf8f3',
          100: '#f8edd9',
          200: '#f0d9b5',
          300: '#D4A574',
          400: '#c49158',
          500: '#B87B38',
          600: '#a06a2e',
          700: '#885a26',
          800: '#6f4a1f',
          900: '#573a18',
        },
        accent: {
          50: '#faf4ee',
          100: '#f0dfd0',
          200: '#dbb99a',
          300: '#A0603A',
          400: '#8B4513',
          500: '#7a3c11',
          600: '#6B350F',
          700: '#5a2d0d',
          800: '#49240a',
          900: '#381c08',
        },
        success: {
          50: '#f2fcf7',
          100: '#d0f7e3',
          200: '#a4eecb',
          300: '#6edeb0',
          400: '#3ccb96',
          500: '#14b67f',
          600: '#0d9567',
          700: '#0c7754',
          800: '#0a5940',
          900: '#083f2e',
        },
        warning: {
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fddc8a',
          300: '#fac23d',
          400: '#f59f0c',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78320e',
          900: '#5c260b',
        },
        error: {
          50: '#fef2f2',
          100: '#fde0e0',
          200: '#fbb7b7',
          300: '#f28c8c',
          400: '#e05757',
          500: '#cf3434',
          600: '#b02121',
          700: '#8f1b1b',
          800: '#6e1616',
          900: '#510f0f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: SPACING,
      borderRadius: BORDER_RADIUS,
      boxShadow: SHADOWS,
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'shrink-linear': 'shrinkLinear 3s linear forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shrinkLinear: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
    },
  },
  plugins: [],
}
