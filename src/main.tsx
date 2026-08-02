import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import ThemeProvider from "./components/ThemeProvider.tsx";
import { installGlobalErrorMonitoring } from "./lib/errorMonitoring.ts";
import "./index.css";

installGlobalErrorMonitoring();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </ThemeProvider>,
);
