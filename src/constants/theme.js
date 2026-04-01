// Warm Orange & Brown Color Palette for Grahak Peth E-Commerce
// Tailwind-friendly theme constants

export const COLORS = {
  // Primary Palette (Warm Orange)
  primary: {
    50:  '#fff8f0',   // Lightest warm tint
    100: '#ffe8cc',
    200: '#ffd199',
    300: '#ffb566',
    400: '#f99b33',
    500: '#E57D02',   // Main Brand Orange
    600: '#cc6e02',
    700: '#b35f02',
    800: '#994f02',
    900: '#804001',   // Deep warm orange
  },

  // Secondary (Warm Tan range)
  secondary: {
    50:  '#fdf8f3',
    100: '#f8edd9',
    200: '#f0d9b5',
    300: '#D4A574',   // Light tan
    400: '#c49158',
    500: '#B87B38',   // Main tan
    600: '#a06a2e',
    700: '#885a26',
    800: '#6f4a1f',
    900: '#573a18',
  },

  // Accent (Saddle Brown range)
  accent: {
    50:  '#faf4ee',
    100: '#f0dfd0',
    200: '#dbb99a',
    300: '#A0603A',   // Light accent
    400: '#8B4513',   // Main saddle brown
    500: '#7a3c11',
    600: '#6B350F',   // Dark accent
    700: '#5a2d0d',
    800: '#49240a',
    900: '#381c08',
  },

  // Success (keep green for semantic meaning)
  success: {
    50:  '#f2fcf7',
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

  // Warning (amber - harmonizes with orange palette)
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

  // Error (modern red)
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
  },

  // Neutrals (clean UI)
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
  40: '160px',
  48: '192px',
  56: '224px',
  64: '256px',
};

export const BORDER_RADIUS = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
};

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.12)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(229, 125, 2, 0.5)', // orange glow
};

export const Z_INDEX = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
};

export const TRANSITIONS = {
  none: 'none',
  all: 'all 0.15s ease-out',
  colors: 'color 0.15s ease-out, background-color 0.15s ease-out, border-color 0.15s ease-out',
  opacity: 'opacity 0.15s ease-out',
  transform: 'transform 0.15s ease-out',
  shadow: 'box-shadow 0.15s ease-out',
  fast: 'all 0.1s ease-out',
  slow: 'all 0.3s ease-out',
  bounce: 'all 0.25s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Main Theme Object
export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  zIndex: Z_INDEX,
  transitions: TRANSITIONS,

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  components: {
    button: {
      primary: {
        backgroundColor: COLORS.primary[600],
        color: COLORS.white,
        hoverBackgroundColor: COLORS.primary[700],
      },
      secondary: {
        backgroundColor: COLORS.secondary[100],
        color: COLORS.secondary[800],
        hoverBackgroundColor: COLORS.secondary[200],
      },
      danger: {
        backgroundColor: COLORS.error[600],
        color: COLORS.white,
        hoverBackgroundColor: COLORS.error[700],
      },
    },

    input: {
      default: {
        borderColor: COLORS.gray[300],
        focusBorderColor: COLORS.primary[500],
        errorBorderColor: COLORS.error[500],
      },
    },

    card: {
      default: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.gray[200],
        shadow: SHADOWS.md,
      },
    },
  },
};

export default THEME;
