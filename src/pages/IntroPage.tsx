import { useNavigate } from "react-router-dom";
import { TeresaWordmark } from "../components/TeresaWordmark";
import GhostFibers from "../components/ui/GhostFibers";
import { TactileButton } from "../components/ui/tactile-button";

/** Splash page shown before the main site: blue fibre ribbons drifting on white. */
export default function IntroPage() {
  const navigate = useNavigate();
  // Let the liquid drain for a moment before leaving the page.
  const start = () => window.setTimeout(() => navigate("/home"), 450);

  return (
    <div className="intro">
      <GhostFibers
        className="intro__fibers"
        glowColor="#0a84ff"
        secondaryColor="#1e3a8a"
        lightMode
        layers={3}
        twist={1.2}
        threads={72}
        fiberStyle="dots"
        depthOfField={0.85}
        hoverEffect="focus"
        vignette={0.2}
        intro
        mouseInteraction
      />
      <main className="intro__content">
        <h1 className="sr-only">TERESA</h1>
        <TeresaWordmark className="intro__wordmark" height={96} />
        <p className="intro__line">AI-integrated Smart Urine Disposer.</p>
        <TactileButton className="intro__start" onClick={start}>
          START
        </TactileButton>
      </main>
    </div>
  );
}
