import { useLocation } from "react-router-dom";

import ThemeToggle from "@/components/ThemeToggle";

const routesWithInlineToggle = new Set(["/", "/entreprise-info"]);
const routesWithCustomHeader = ["/talent/profil/"];

const RouteThemeToggle = () => {
  const location = useLocation();

  if (
    routesWithInlineToggle.has(location.pathname)
    || routesWithCustomHeader.some((route) => location.pathname.startsWith(route))
  ) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-[70] sm:right-6 sm:top-6">
      <ThemeToggle />
    </div>
  );
};

export default RouteThemeToggle;
