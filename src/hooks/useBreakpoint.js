/**
 * useBreakpoint.js
 * ─────────────────────────────────────────────────────────────────
 * Hook responsive universel — remplace useIsMobile dans tout le projet.
 *
 * Breakpoints :
 *   mobile  : < 768px    (smartphones)
 *   tablet  : 768–1023px (iPad, Android tablets)
 *   desktop : ≥ 1024px   (laptop, desktop)
 *
 * Usage :
 *   const { isMobile, isTablet, isDesktop, width } = useBreakpoint();
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  tablet:  768,
  desktop: 1024,
};

export function useBreakpoint() {
  const getBreakpoint = () => {
    const w = window.innerWidth;
    return {
      width:     w,
      isMobile:  w < BREAKPOINTS.tablet,
      isTablet:  w >= BREAKPOINTS.tablet && w < BREAKPOINTS.desktop,
      isDesktop: w >= BREAKPOINTS.desktop,
      isTouch:   w < BREAKPOINTS.desktop,
    };
  };

  const [bp, setBp] = useState(getBreakpoint);

  useEffect(() => {
    let raf;
    const handleResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setBp(getBreakpoint()));
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return bp;
}

/** Rétrocompatibilité */
export function useIsMobile() {
  return useBreakpoint().isMobile;
}

export default useBreakpoint;