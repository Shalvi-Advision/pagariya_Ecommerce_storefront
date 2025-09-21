/**
 * Responsive Design Guide for E-Commerce Application
 *
 * This file provides comprehensive guidance for implementing responsive design
 * across all components and pages in the application.
 */

import { BREAKPOINTS, DEVICES, RESPONSIVE_PATTERNS, COMPONENT_RESPONSIVE } from './responsive';

/**
 * BREAKPOINT SYSTEM
 * ================
 *
 * Mobile First Approach:
 * - xs: 475px+ (extra small)
 * - sm: 640px+ (small phones)
 * - md: 768px+ (tablets)
 * - lg: 1024px+ (small laptops)
 * - xl: 1280px+ (desktops)
 * - 2xl: 1536px+ (large desktops)
 *
 * Named breakpoints for better readability:
 * - mobile: < 640px
 * - tablet: 640px - 1024px
 * - desktop: 1024px+
 */

/**
 * RESPONSIVE UTILITIES
 * ===================
 */

// Responsive container classes
export const CONTAINER_CLASSES = {
  // Basic responsive containers
  responsive: 'container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12',

  // Card containers with responsive padding
  card: 'bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8',

  // Grid containers
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8',
};

/**
 * COMPONENT RESPONSIVE PATTERNS
 * =============================
 */

export const RESPONSIVE_COMPONENT_PATTERNS = {
  // Header responsive classes
  header: {
    container: 'bg-white border-b border-gray-200 sticky top-0 z-50',
    nav: 'flex items-center justify-between py-3 gap-4 px-4 sm:px-6 lg:px-8',
    logo: 'text-xl sm:text-2xl font-extrabold text-primary-600',
    search: 'flex-1 max-w-xs sm:max-w-md lg:max-w-xl xl:max-w-2xl',
    actions: 'flex items-center gap-2 sm:gap-4',
  },

  // Product card responsive classes
  productCard: {
    container: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 w-full max-w-xs sm:max-w-sm mx-auto',
    image: 'relative bg-gradient-to-br from-orange-50 to-orange-100 h-32 sm:h-40 flex items-center justify-center p-4 sm:p-6',
    content: 'p-3 sm:p-4 lg:p-6',
    title: 'text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2',
    price: 'text-lg sm:text-xl lg:text-2xl font-bold text-primary-600',
    button: 'w-full text-sm sm:text-base',
  },

  // Form responsive classes
  form: {
    container: 'w-full max-w-xs sm:max-w-sm lg:max-w-md mx-auto',
    input: 'w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base',
    button: 'w-full py-2 sm:py-3 text-sm sm:text-base',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  },

  // Modal responsive classes
  modal: {
    overlay: 'fixed inset-0 z-50 overflow-y-auto',
    container: 'flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0',
    panel: 'inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full mx-4',
    sizes: {
      small: 'max-w-sm sm:max-w-md',
      medium: 'max-w-sm sm:max-w-lg',
      large: 'max-w-sm sm:max-w-2xl lg:max-w-4xl',
      full: 'max-w-full sm:max-w-4xl',
    },
  },

  // Navigation responsive classes
  navigation: {
    mobile: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 sm:hidden',
    desktop: 'hidden sm:flex items-center gap-6',
    drawer: 'fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50',
  },
};

/**
 * RESPONSIVE HOOKS USAGE
 * =====================
 *
 * Use the useResponsive hook in components for dynamic responsive behavior:
 *
 * ```jsx
 * import { useResponsive } from '../hooks/useResponsive';
 *
 * const MyComponent = () => {
 *   const { isMobile, isTablet, isDesktop, currentBreakpoint } = useResponsive();
 *
 *   return (
 *     <div className={isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'}>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </div>
 *   );
 * };
 * ```
 */

/**
 * RESPONSIVE DESIGN PRINCIPLES
 * ===========================
 *
 * 1. Mobile First: Design for mobile, then enhance for larger screens
 * 2. Touch Friendly: Ensure interactive elements are at least 44px
 * 3. Readable Text: Minimum 14px font size on mobile, 16px on desktop
 * 4. Appropriate Spacing: More padding/margins on larger screens
 * 5. Performance: Use responsive images and lazy loading
 * 6. Accessibility: Ensure focus states and keyboard navigation work
 */

/**
 * COMMON RESPONSIVE PATTERNS
 * =========================
 */

export const COMMON_RESPONSIVE_PATTERNS = {
  // Text sizing
  text: {
    heading: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
    subheading: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm',
  },

  // Spacing
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16 xl:py-20',
    element: 'p-4 sm:p-6 lg:p-8',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },

  // Layout patterns
  layout: {
    container: 'container mx-auto px-4 sm:px-6 lg:px-8',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    flex: 'flex flex-col sm:flex-row',
  },
};

/**
 * RESPONSIVE TESTING CHECKLIST
 * ===========================
 *
 * Device Testing:
 * - iPhone SE (375px)
 * - iPhone 12/13 (390px)
 * - iPhone 12/13 Pro Max (428px)
 * - iPad (768px)
 * - iPad Pro (1024px)
 * - Desktop (1280px+)
 *
 * Browser Testing:
 * - Chrome, Firefox, Safari, Edge
 * - Mobile browsers
 *
 * Orientation Testing:
 * - Portrait and landscape modes
 */

/**
 * PERFORMANCE CONSIDERATIONS
 * =========================
 *
 * 1. Image Optimization: Use responsive images with srcset
 * 2. Code Splitting: Load components only when needed
 * 3. CSS Optimization: Use Tailwind's purging
 * 4. Font Loading: Optimize web font loading
 * 5. Bundle Size: Monitor and optimize bundle size
 */

export default {
  breakpoints: BREAKPOINTS,
  devices: DEVICES,
  patterns: RESPONSIVE_PATTERNS,
  components: RESPONSIVE_COMPONENT_PATTERNS,
  common: COMMON_RESPONSIVE_PATTERNS,
  componentResponsive: COMPONENT_RESPONSIVE,
};
