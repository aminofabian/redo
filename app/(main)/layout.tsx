import MainNav from "@/components/navigation/MainNav";
import Footer from "@/components/ui/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainNav />
      <main className="pt-[9.5rem] pb-20 sm:pb-0">
        {children}
      </main>
      <Footer />
    </>
  );
} 