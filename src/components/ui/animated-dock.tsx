import { useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";

export interface DockItemData {
  link: string;
  label: string;
  Icon: ReactNode;
  target?: string;
}

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

/**
 * macOS-style dock: icons magnify as the cursor approaches, and the hovered item's
 * name floats next to the cursor. Adapted from hextaui's AnimatedDock for plain CSS
 * and react-router.
 */
export function AnimatedDock({ className, items }: AnimatedDockProps) {
  const mouseX = useMotionValue(Infinity);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();

  const isActive = (link: string) => {
    const [path, hash = ""] = link.split("#");
    return location.pathname === path && location.hash === (hash ? `#${hash}` : "");
  };

  return (
    <>
      <motion.nav
        aria-label="Main"
        onMouseMove={(e) => {
          mouseX.set(e.clientX);
          tipX.set(e.clientX);
          tipY.set(e.clientY);
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
          setHovered(null);
        }}
        className={`dock${className ? ` ${className}` : ""}`}
      >
        {items.map((item) => (
          <DockItem key={item.link} mouseX={mouseX} active={isActive(item.link)}>
            <Link
              to={item.link}
              target={item.target}
              aria-label={item.label}
              aria-current={isActive(item.link) ? "page" : undefined}
              className="dock__link"
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(null)}
            >
              {item.Icon}
            </Link>
          </DockItem>
        ))}
      </motion.nav>
      <AnimatePresence>
        {hovered && (
          <motion.span
            key="dock-tip"
            className="dock__tip"
            aria-hidden="true"
            style={{ left: tipX, top: tipY }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
          >
            {hovered}
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
}

interface DockItemProps {
  mouseX: MotionValue<number>;
  active: boolean;
  children: ReactNode;
}

export function DockItem({ mouseX, active, children }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 72, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const iconScale = useTransform(width, [40, 72], [1, 1.45]);
  const iconSpring = useSpring(iconScale, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div ref={ref} style={{ width }} className={`dock__item${active ? " is-active" : ""}`}>
      {active && <motion.span layoutId="dock-active" className="dock__active" transition={{ type: "spring", stiffness: 380, damping: 32 }} aria-hidden="true" />}
      <motion.div style={{ scale: iconSpring }} className="dock__icon">
        {children}
      </motion.div>
    </motion.div>
  );
}
