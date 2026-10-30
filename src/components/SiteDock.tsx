import { BookOpen, Compass, Cpu, House, Info, LayoutDashboard } from "lucide-react";
import { AnimatedDock } from "./ui/animated-dock";

const ICON = { size: 20, strokeWidth: 1.75 };

const ITEMS = [
  { link: "/home", label: "Home", Icon: <House {...ICON} /> },
  { link: "/explore", label: "Explore", Icon: <Compass {...ICON} /> },
  { link: "/explore#technology", label: "Technology", Icon: <Cpu {...ICON} /> },
  { link: "/explore#research", label: "Research", Icon: <BookOpen {...ICON} /> },
  { link: "/about", label: "About", Icon: <Info {...ICON} /> },
  { link: "/connect", label: "TERESA Connect", Icon: <LayoutDashboard {...ICON} /> },
];

export function SiteDock() {
  return (
    <div className="site-dock">
      <AnimatedDock items={ITEMS} />
    </div>
  );
}
