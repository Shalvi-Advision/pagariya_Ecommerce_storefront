# 📋 Constants Documentation

This directory contains all the application constants organized for consistent usage across the React e-commerce application.

## 📁 File Structure

```
constants/
├── index.js              # Main export file
├── theme.js             # Colors, spacing, shadows, etc.
├── typography.js        # Text styles, fonts, sizes
├── responsive.js        # Breakpoints, responsive utilities
├── usage-examples.js    # Implementation examples
└── README.md           # This documentation
```

## 🚀 Quick Start

### Import Constants
```javascript
// Import all constants
import { COLORS, SPACING, TEXT_STYLES, BREAKPOINTS } from '../constants';

// Or import specific modules
import { THEME } from '../constants/theme';
import { TYPOGRAPHY } from '../constants/typography';
import { RESPONSIVE } from '../constants/responsive';
```

## 🎨 Theme Constants

### Colors
```javascript
import { COLORS } from '../constants';

// Primary colors
backgroundColor: COLORS.primary[600],
color: COLORS.white,

// Status colors
successColor: COLORS.success[500],
errorColor: COLORS.error[500],
warningColor: COLORS.warning[500],

// Neutral colors
textColor: COLORS.gray[700],
borderColor: COLORS.gray[300],
```

### Spacing
```javascript
import { SPACING } from '../constants';

const styles = {
  padding: SPACING[4],      // 16px
  margin: SPACING[6],       // 24px
  gap: SPACING[8],          // 32px
};
```

### Shadows & Borders
```javascript
import { SHADOWS, BORDER_RADIUS } from '../constants';

const cardStyle = {
  boxShadow: SHADOWS.md,
  borderRadius: BORDER_RADIUS.lg,
};
```

## 📝 Typography Constants

### Text Styles
```javascript
import { TEXT_STYLES } from '../constants';

const headingStyle = {
  ...TEXT_STYLES.h1,        // Main page heading
  color: COLORS.gray[900],
};

const bodyStyle = {
  ...TEXT_STYLES.body,      // Regular body text
  color: COLORS.gray[700],
};

const priceStyle = {
  ...TEXT_STYLES.price,     // Product pricing
  color: COLORS.primary[600],
};
```

### Font Properties
```javascript
import { FONT_SIZE, FONT_WEIGHT } from '../constants';

const customStyle = {
  fontSize: FONT_SIZE['heading-md'][0],
  fontWeight: FONT_WEIGHT.semibold,
  lineHeight: '1.4',
};
```

## 📱 Responsive Constants

### Breakpoints
```javascript
import { BREAKPOINTS } from '../constants';

const mediaQuery = `
  @media (min-width: ${BREAKPOINTS.md}) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
`;
```

### Responsive Patterns
```javascript
import { RESPONSIVE_PATTERNS } from '../constants';

const gridStyle = {
  ...RESPONSIVE_PATTERNS.grid,
  // Automatically applies responsive grid columns
};
```

## ⚙️ Application Constants

### Status & Messages
```javascript
import { STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

// Order status
const orderStatus = STATUS.ORDER_STATUS.SHIPPED;

// Error messages
const errorMessage = ERROR_MESSAGES.INVALID_EMAIL;

// Success messages
const successMessage = SUCCESS_MESSAGES.ORDER_PLACED;
```

### API Configuration
```javascript
import { APP_CONSTANTS, API_ENDPOINTS } from '../constants';

// API base URL
const baseURL = APP_CONSTANTS.API_BASE_URL;

// Specific endpoints
const loginEndpoint = API_ENDPOINTS.AUTH.LOGIN;
const productsEndpoint = API_ENDPOINTS.PRODUCTS.LIST;
```

## 🧩 Usage Patterns

### 1. Component Styling
```javascript
import { COLORS, SPACING, TEXT_STYLES, BORDER_RADIUS } from '../constants';

const Button = ({ variant = 'primary', children }) => {
  const baseStyles = {
    padding: `${SPACING[3]} ${SPACING[6]}`,
    borderRadius: BORDER_RADIUS.md,
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
  };

  const variants = {
    primary: {
      backgroundColor: COLORS.primary[600],
      color: COLORS.white,
      '&:hover': {
        backgroundColor: COLORS.primary[700],
      },
    },
    secondary: {
      backgroundColor: COLORS.white,
      color: COLORS.gray[800],
      border: `1px solid ${COLORS.gray[300]}`,
      '&:hover': {
        backgroundColor: COLORS.gray[50],
      },
    },
  };

  return (
    <button style={{ ...baseStyles, ...variants[variant] }}>
      {children}
    </button>
  );
};
```

### 2. Responsive Components
```javascript
import { BREAKPOINTS, RESPONSIVE_PATTERNS } from '../constants';

const ProductGrid = ({ children }) => {
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',

    [`@media (min-width: ${BREAKPOINTS.sm})`]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    },

    [`@media (min-width: ${BREAKPOINTS.md})`]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
    },

    [`@media (min-width: ${BREAKPOINTS.lg})`]: {
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '32px',
    },
  };

  return <div style={gridStyles}>{children}</div>;
};
```

### 3. Form Validation
```javascript
import { ERROR_MESSAGES, APP_CONSTANTS } from '../constants';

const validateEmail = (email) => {
  if (!email) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }

  if (!APP_CONSTANTS.EMAIL_REGEX.test(email)) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }

  return null;
};

const validatePassword = (password) => {
  if (!password) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }

  if (password.length < APP_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
  }

  return null;
};
```

### 4. API Integration
```javascript
import { API_ENDPOINTS, APP_CONSTANTS } from '../constants';

const apiClient = {
  baseURL: APP_CONSTANTS.API_BASE_URL,

  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString
      ? `${this.baseURL}${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}`
      : `${this.baseURL}${API_ENDPOINTS.PRODUCTS.LIST}`;

    const response = await fetch(url);
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    return response.json();
  },
};
```

## 🎨 Integration with Tailwind CSS

### Custom Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... other shades from COLORS.primary
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        // ... other values from SPACING
      },
      fontSize: {
        'heading-xl': ['2.25rem', { lineHeight: '1.2' }],
        // ... other sizes from FONT_SIZE
      },
    },
  },
};
```

### CSS Custom Properties
```css
/* styles/globals.css */
:root {
  --color-primary-600: 37, 99, 235;    /* COLORS.primary[600] */
  --color-gray-900: 17, 24, 39;        /* COLORS.gray[900] */
  --spacing-4: 1rem;                    /* SPACING[4] */
}

@media (min-width: 768px) {
  :root {
    --container-max-width: 768px;       /* CONTAINER_SIZES.md */
  }
}
```

## 🔧 Best Practices

### 1. Consistent Import Structure
```javascript
// ✅ Good: Import only what you need
import { COLORS, SPACING, TEXT_STYLES } from '../constants';

// ❌ Avoid: Import everything
import * as CONSTANTS from '../constants';
```

### 2. Use Constants in Styles
```javascript
// ✅ Good: Use constants for styling
const buttonStyle = {
  backgroundColor: COLORS.primary[600],
  padding: `${SPACING[3]} ${SPACING[6]}`,
};

// ❌ Avoid: Hard-coded values
const buttonStyle = {
  backgroundColor: '#2563eb',
  padding: '12px 24px',
};
```

### 3. Responsive Design
```javascript
// ✅ Good: Use responsive constants
const responsiveGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  [`@media (min-width: ${BREAKPOINTS.md})`]: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
};

// ❌ Avoid: Hard-coded breakpoints
const responsiveGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  '@media (min-width: 768px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
};
```

### 4. Type Safety
```javascript
// ✅ Good: Use status constants
const orderStatus = STATUS.ORDER_STATUS.SHIPPED;

// ❌ Avoid: Magic strings
const orderStatus = 'shipped';
```

## 📊 Maintenance Guidelines

### Adding New Constants
1. **Colors**: Add to `COLORS` object in `theme.js`
2. **Spacing**: Add to `SPACING` object in `theme.js`
3. **Typography**: Add to `FONT_SIZE` or `TEXT_STYLES` in `typography.js`
4. **Breakpoints**: Add to `BREAKPOINTS` in `responsive.js`
5. **API**: Add to `API_ENDPOINTS` in `index.js`

### Updating Constants
1. **Check Usage**: Search for usage across the codebase
2. **Update Tailwind**: Update `tailwind.config.js` if needed
3. **Test Components**: Test affected components
4. **Document Changes**: Update this README if needed

### Constants Organization
- **Theme**: Visual design tokens (colors, spacing, shadows)
- **Typography**: Text-related constants (fonts, sizes, styles)
- **Responsive**: Layout and breakpoint constants
- **App**: Business logic and configuration constants

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [React Styling Patterns](https://reactjs.org/docs/faq-styling.html)
- [Design Systems](https://www.designsystems.com/)

---

**These constants ensure consistency, maintainability, and scalability across your React e-commerce application.**


$ lsof -ti:3000
$ kill -9 40798 43549
$ lsof -ti:3000