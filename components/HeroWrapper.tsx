import Hero from "@/components/ui/Hero";
import { getCategories } from "@/app/actions/getCategories";

export default async function HeroWrapper() {
  const categories = await getCategories();
  return <Hero categories={categories} />;
} 