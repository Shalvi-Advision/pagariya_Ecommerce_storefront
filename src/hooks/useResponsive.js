import { useState, useEffect } from 'react';
import { BREAKPOINTS, DEVICES, SCREEN_SIZES } from '../constants/responsive';

/**
 * Custom hook for responsive design utilities
 * Provides current breakpoint, screen size detection, and responsive values
 */
export const useResponsive = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState('mobile');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });

      // Determine current breakpoint
      let breakpoint = 'mobile';
      if (width >= parseInt(BREAKPOINTS['2xl'])) breakpoint = '2xl';
      else if (width >= parseInt(BREAKPOINTS.xl)) breakpoint = 'xl';
      else if (width >= parseInt(BREAKPOINTS.lg)) breakpoint = 'lg';
      else if (width >= parseInt(BREAKPOINTS.md)) breakpoint = 'md';
      else if (width >= parseInt(BREAKPOINTS.sm)) breakpoint = 'sm';
      else breakpoint = 'xs';

      setCurrentBreakpoint(breakpoint);
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Device detection
  const isMobile = windowSize.width < parseInt(BREAKPOINTS.sm);
  const isTablet = windowSize.width >= parseInt(BREAKPOINTS.sm) && windowSize.width < parseInt(BREAKPOINTS.lg);
  const isDesktop = windowSize.width >= parseInt(BREAKPOINTS.lg);
  const isLargeDesktop = windowSize.width >= parseInt(BREAKPOINTS.xl);

  // Orientation detection
  const isPortrait = windowSize.height > windowSize.width;
  const isLandscape = windowSize.width > windowSize.height;

  // Touch device detection
  const isTouchDevice = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Get responsive value from configuration object
  const getResponsiveValue = (config) => {
    if (typeof config !== 'object') return config;

    // Priority: current breakpoint -> default
    return config[currentBreakpoint] || config.default || config;
  };

  // Get current device configuration
  const getCurrentDevice = () => {
    if (isMobile) return DEVICES.mobile;
    if (isTablet) return DEVICES.tablet;
    return DEVICES.desktop;
  };

  // Check if current screen is above certain breakpoint
  const isAbove = (breakpoint) => {
    const breakpointWidth = parseInt(BREAKPOINTS[breakpoint]);
    return windowSize.width >= breakpointWidth;
  };

  // Check if current screen is below certain breakpoint
  const isBelow = (breakpoint) => {
    const breakpointWidth = parseInt(BREAKPOINTS[breakpoint]);
    return windowSize.width < breakpointWidth;
  };

  return {
    // Current state
    currentBreakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isPortrait,
    isLandscape,
    isTouchDevice,

    // Utilities
    getResponsiveValue,
    getCurrentDevice,
    isAbove,
    isBelow,

    // Constants for reference
    breakpoints: BREAKPOINTS,
    devices: DEVICES,
  };
};

/**
 * Hook for conditional rendering based on screen size
 */
export const useBreakpoint = (breakpoint) => {
  const { isAbove, isBelow } = useResponsive();

  return {
    above: isAbove(breakpoint),
    below: isBelow(breakpoint),
    at: currentBreakpoint === breakpoint,
  };
};

/**
 * Hook for getting responsive classes
 */
export const useResponsiveClass = (baseClass, responsiveConfig) => {
  const { currentBreakpoint } = useResponsive();

  let classes = baseClass;

  if (responsiveConfig[currentBreakpoint]) {
    classes += ` ${responsiveConfig[currentBreakpoint]}`;
  }

  if (responsiveConfig.default && currentBreakpoint !== 'default') {
    classes += ` ${responsiveConfig.default}`;
  }

  return classes.trim();
};

export default useResponsive;
