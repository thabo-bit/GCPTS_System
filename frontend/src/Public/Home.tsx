// src/Public/Home.tsx
import HeroSection from "../Components/heroSection";
import Bottom from "../Components/bottom";
import ProvinceExplorer from "../Components/ProvinceExplorer";
import Projects from '../Components/ProjectGrid';
import Footer from "../Components/Footer";

function Home() {
  return (
    <>
      <HeroSection />
      <Bottom />
      <ProvinceExplorer />
      <Projects />
      <Footer />
    </>
  );
}

export default Home;