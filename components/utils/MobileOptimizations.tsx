"use client";
import { useEffect } from 'react';

const MobileOptimizations = () => {
  useEffect(() => {
    // Fix for iOS 100vh issue
    const setDocumentHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    
    // Enhance tap targets for mobile
    const enhanceTapTargets = () => {
      const smallButtons = document.querySelectorAll('button, a');
      smallButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.width < 48 || rect.height < 48) {
          // Log small touch targets for debugging
          console.debug('Small touch target:', button);
        }
      });
    };
    
    // Fix for input zoom on iOS
    const fixIOSInputZoom = () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5');
      }
    };
    
    setDocumentHeight();
    fixIOSInputZoom();
    
    // Run on initial load and resize
    window.addEventListener('resize', setDocumentHeight);
    window.addEventListener('orientationchange', setDocumentHeight);
    
    return () => {
      window.removeEventListener('resize', setDocumentHeight);
      window.removeEventListener('orientationchange', setDocumentHeight);
    };
  }, []);
  
  return null;
};

export default MobileOptimizations; 