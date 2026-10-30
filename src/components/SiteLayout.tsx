import { Outlet } from "react-router-dom";
import { SiteDock } from "./SiteDock";
import { SiteFooter } from "./SiteFooter";

export function SiteLayout() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <main id="main" className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
      <SiteDock />
    </>
  );
}
