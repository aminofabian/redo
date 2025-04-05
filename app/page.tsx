import Hero from "@/components/ui/Hero";
import NursingResourcesSection from "@/components/ui/NursingResources";
import Features from "@/components/ui/Features";
import DiscoverNursing from "@/components/ui/DiscoverNursing";
import FindBestResources from "@/components/ui/FindBestResources";
import BlogSection from "@/components/ui/BlogSection";
import FAQ from "@/components/ui/FAQ";
import Footer from "@/components/ui/Footer";
import MainNav from "@/components/navigation/MainNav";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import FloatingButtons from "@/components/ui/FloatingButtons";

export default function Home() {
  return (
    <div>
      <MainNav />
      <main className="pt-[90px]">
        <Hero />
        <Features />
        <DiscoverNursing />
        <NursingResourcesSection />
        <BlogSection />
        <FAQ />
        <FindBestResources />
        <Footer />
      </main>
      <WhatsAppButton />
      <FloatingButtons />
    </div>
  );
}
