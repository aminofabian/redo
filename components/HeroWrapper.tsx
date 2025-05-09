import Hero from "@/components/ui/Hero";
import { getCategoryPaths } from "@/app/actions/getCategoryPaths";
import { Suspense } from "react";

// Loading fallback component
const HeroSkeleton = () => (
  <div className="animate-pulse">
    {/* Add skeleton UI here */}
  </div>
);

export default function HeroWrapper() {
  return (
    <div className="hero-container">
      {/* Static content that loads immediately */}
      <div className="hero-static">
        {/* Your static hero content (images, titles, etc.) */}
      </div>
      
      {/* Dynamic content that loads after data fetching */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroContent />
      </Suspense>
    </div>
  );
}

async function HeroContent() {
  // We no longer need to fetch or pass category paths
  // as the Hero component now uses hardcoded data
  return <Hero />;
} 