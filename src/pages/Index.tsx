import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MobileAccessSection from "@/components/MobileAccessSection";
import HowItWorks from "@/components/HowItWorks";
import Benefits from "@/components/Benefits";
import SeoContentSection from "@/components/SeoContentSection";
import Audience from "@/components/Audience";
import SocialProof from "@/components/SocialProof";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <MobileAccessSection />
    <HowItWorks />
    <Benefits />
    <SeoContentSection />
    <Audience />
    <SocialProof />
    <FAQ />
    <Footer />
  </div>
);

export default Index;
