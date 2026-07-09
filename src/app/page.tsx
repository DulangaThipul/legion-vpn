import HeroSection from "@/components/HeroSection";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <Features />
      <Pricing />
      
      <footer style={{ padding: "2rem 0", borderTop: "1px solid var(--card-border)", textAlign: "center" }}>
        <p style={{ color: "var(--muted-text)" }}>&copy; 2026 LEGION VPN | Designed by Dulanga</p>
      </footer>
    </main>
  );
}
