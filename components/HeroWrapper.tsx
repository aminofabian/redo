import Hero from "@/components/ui/Hero";
import { getCategoryPaths } from "@/app/actions/getCategoryPaths";
import { Suspense } from "react";

// Loading fallback component
const HeroSkeleton = () => (
  <div className="animate-pulse">
    {/* Add skeleton UI here */}
  </div>
);

export default async function HeroWrapper() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <HeroContent />
    </Suspense>
  );
}

async function HeroContent() {
  const categoryPaths = await getCategoryPaths();
  return <Hero categoryPaths={categoryPaths} />;
} 