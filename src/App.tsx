import { Suspense, lazy } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/SiteLayout";
import { ScrollManager } from "./components/ScrollManager";
import { PageLoading } from "./components/PageLoading";
import LandingPage from "./pages/LandingPage";

const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ConnectLayout = lazy(() => import("./connect/ConnectLayout"));
const OverviewPage = lazy(() => import("./connect/pages/OverviewPage"));
const FleetPage = lazy(() => import("./connect/pages/FleetPage"));
const SimulationPage = lazy(() => import("./connect/pages/SimulationPage"));
const ActivityPage = lazy(() => import("./connect/pages/ActivityPage"));
const AlertsPage = lazy(() => import("./connect/pages/AlertsPage"));
const SystemPage = lazy(() => import("./connect/pages/SystemPage"));
const SettingsPage = lazy(() => import("./connect/pages/SettingsPage"));

/** Hash routing is only for static previews without SPA rewrites (VITE_ROUTER=hash). */
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <ScrollManager />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="connect" element={<ConnectLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="overview" element={<Navigate to="/connect" replace />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="system" element={<SystemPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
