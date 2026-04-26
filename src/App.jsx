import { Hero } from './components/Hero';
import { WaveDivider } from './components/WaveDivider';
import { AboutUs } from './components/AboutUs';
import { Attractions } from './components/Attractions';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { CursorGlow } from './components/CursorGlow';
import { useParallax } from './hooks/useParallax';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';

export default function App() {
  useParallax();
  const revealRef = useRevealOnScroll();

  return (
    <div ref={revealRef}>
      <Hero />
      <WaveDivider />
      <AboutUs />
      <Attractions />
      <Contact />
      <Footer />
      <CursorGlow />
    </div>
  );
}
