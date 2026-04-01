// Typography Constants for E-Commerce Application
// Consistent text styling across the application

export const FONT_FAMILY = {
  primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  secondary: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
};

export const FONT_SIZE = {
  // Display sizes
  'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
  'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
  'display-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
  'display-md': ['2.25rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
  'display-sm': ['1.875rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],

  // Heading sizes
  'heading-xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
  'heading-lg': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
  'heading-md': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.025em', fontWeight: '600' }],
  'heading-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '600' }],
  'heading-xs': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.025em', fontWeight: '600' }],

  // Body sizes
  'body-xl': ['1.25rem', { lineHeight: '1.5', fontWeight: '400' }],
  'body-lg': ['1.125rem', { lineHeight: '1.55', fontWeight: '400' }],
  'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
  'body-xs': ['0.75rem', { lineHeight: '1.6', fontWeight: '400' }],

  // Label sizes
  'label-lg': ['0.875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.025em' }],
  'label-md': ['0.8125rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.025em' }],
  'label-sm': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.025em' }],
  'label-xs': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.025em' }],

  // Button sizes
  'button-lg': ['1rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.025em' }],
  'button-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.025em' }],
  'button-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.025em' }],
  'button-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.025em' }],
};

export const FONT_WEIGHT = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const LETTER_SPACING = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

export const LINE_HEIGHT = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
};

export const TEXT_DECORATION = {
  none: 'none',
  underline: 'underline',
  'line-through': 'line-through',
  'underline-line-through': 'underline line-through',
};

// Text style combinations for common use cases
export const TEXT_STYLES = {
  // Headings
  h1: {
    fontSize: FONT_SIZE['display-lg'][0],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: '1.1',
    letterSpacing: '-0.025em',
  },
  h2: {
    fontSize: FONT_SIZE['heading-xl'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.2',
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: FONT_SIZE['heading-lg'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.25',
    letterSpacing: '-0.025em',
  },
  h4: {
    fontSize: FONT_SIZE['heading-md'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.3',
    letterSpacing: '-0.025em',
  },
  h5: {
    fontSize: FONT_SIZE['heading-sm'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.35',
    letterSpacing: '-0.025em',
  },
  h6: {
    fontSize: FONT_SIZE['heading-xs'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.4',
    letterSpacing: '-0.025em',
  },

  // Body text
  body: {
    fontSize: FONT_SIZE['body-md'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.6',
  },
  bodyLarge: {
    fontSize: FONT_SIZE['body-lg'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.55',
  },
  bodySmall: {
    fontSize: FONT_SIZE['body-sm'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.6',
  },

  // Captions and labels
  caption: {
    fontSize: FONT_SIZE['body-xs'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.5',
    letterSpacing: '0.025em',
  },
  label: {
    fontSize: FONT_SIZE['label-md'][0],
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: '1.4',
    letterSpacing: '0.025em',
  },

  // Buttons
  buttonPrimary: {
    fontSize: FONT_SIZE['button-md'][0],
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: '1.5',
    letterSpacing: '0.025em',
  },
  buttonSecondary: {
    fontSize: FONT_SIZE['button-sm'][0],
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: '1.5',
    letterSpacing: '0.025em',
  },

  // Special text styles
  price: {
    fontSize: FONT_SIZE['heading-sm'][0],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: '1.2',
    letterSpacing: '-0.01em',
  },
  priceLarge: {
    fontSize: FONT_SIZE['heading-lg'][0],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  },
  priceSmall: {
    fontSize: FONT_SIZE['body-sm'][0],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: '1.4',
    letterSpacing: '-0.005em',
  },

  // Status and badges
  badge: {
    fontSize: FONT_SIZE['label-sm'][0],
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: '1.2',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  // Links
  link: {
    fontSize: FONT_SIZE['body-md'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.6',
    textDecoration: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '2px',
  },

  // Error and success messages
  error: {
    fontSize: FONT_SIZE['body-sm'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.5',
    color: '#dc2626', // Error color
  },
  success: {
    fontSize: FONT_SIZE['body-sm'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.5',
    color: '#0d9567', // Success color (success-600)
  },
  warning: {
    fontSize: FONT_SIZE['body-sm'][0],
    fontWeight: FONT_WEIGHT.normal,
    lineHeight: '1.5',
    color: '#d97706', // Warning color
  },
};

// Typography theme object
export const TYPOGRAPHY = {
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  letterSpacing: LETTER_SPACING,
  lineHeight: LINE_HEIGHT,
  textDecoration: TEXT_DECORATION,
  textStyles: TEXT_STYLES,
};

export default TYPOGRAPHY;
