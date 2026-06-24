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
          50: '#f0faf5',
          100: '#d1f0e0',
          200: '#a3e0c1',
          300: '#6bc99e',
          400: '#34a876',
          500: '#098547',
          600: '#077340',
          700: '#065f35',
          800: '#054b2a',
          900: '#03371f',
        },
        secondary: {
          50: '#f4faf7',
          100: '#e0f2e9',
          200: '#b8dfc9',
          300: '#8fcaa8',
          400: '#5fb384',
          500: '#3d9a68',
          600: '#2f7d54',
          700: '#266645',
          800: '#1f5237',
          900: '#183f2b',
        },
        accent: {
          50: '#eef6f1',
          100: '#d5e8dc',
          200: '#a8cfb8',
          300: '#6fad87',
          400: '#3d8a5f',
          500: '#1f6b44',
          600: '#185638',
          700: '#13452d',
          800: '#0e3523',
          900: '#092619',
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
