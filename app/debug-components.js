'use client';

// Add this to help locate the component causing issues
export function debugComponents() {
  if (typeof window !== 'undefined') {
    console.log('Checking for ye function:');
    console.log(typeof window.ye);
    console.log(window);
  }
}

export default function DebugComponent() {
  useEffect(() => {
    debugComponents();
  }, []);
  
  return null;
} 