import Hero from "@/components/ui/Hero";
import { getCategoryTree } from "@/app/actions/getCategories";

export default async function HeroWrapper() {
  const categoryTree = await getCategoryTree();
  return <Hero categoryTree={categoryTree} />;
} 