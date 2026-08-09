import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RouteThemeToggle from "@/components/RouteThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import ConfirmedEmailRoute from "@/components/ConfirmedEmailRoute";
import SecurityIncidentGate from "@/components/SecurityIncidentGate";

const Index = lazy(() => import("./pages/Index.tsx"));
const TalentAuth = lazy(() => import("./pages/TalentAuth.tsx"));
const EntrepriseAuth = lazy(() => import("./pages/EntrepriseAuth.tsx"));
const TalentDashboard = lazy(() => import("./pages/TalentDashboard.tsx"));
const EntrepriseDashboard = lazy(() => import("./pages/EntrepriseDashboard.tsx"));
const EntrepriseLanding = lazy(() => import("./pages/EntrepriseLanding.tsx"));
const TalentProfil = lazy(() => import("./pages/TalentProfil.tsx"));
const EntrepriseProfil = lazy(() => import("./pages/EntrepriseProfil.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CGU = lazy(() => import("./pages/CGU.tsx"));
const CGV = lazy(() => import("./pages/CGV.tsx"));
const Confidentialite = lazy(() => import("./pages/Confidentialite.tsx"));
const Aide = lazy(() => import("./pages/Aide.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const OAuthComplete = lazy(() => import("./pages/OAuthComplete.tsx"));
const AuthConfirmed = lazy(() => import("./pages/AuthConfirmed.tsx"));

const queryClient = new QueryClient();

const RouteLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
    <div className="w-full max-w-sm rounded-3xl border border-border/60 bg-card/85 p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-sm font-medium text-muted-foreground">Chargement de votre espace...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteThemeToggle />
        <AuthProvider>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/talent" element={<TalentAuth />} />
              <Route path="/entreprise" element={<EntrepriseLanding />} />
              <Route path="/entreprise/connexion" element={<EntrepriseAuth />} />
              <Route path="/entreprise-info" element={<EntrepriseLanding />} />
              <Route
                path="/talent/dashboard"
                element={
                  <ConfirmedEmailRoute role="talent">
                    <SecurityIncidentGate>
                      <TalentDashboard />
                    </SecurityIncidentGate>
                  </ConfirmedEmailRoute>
                }
              />
              <Route
                path="/entreprise/dashboard"
                element={
                  <ConfirmedEmailRoute role="entreprise">
                    <SecurityIncidentGate>
                      <EntrepriseDashboard />
                    </SecurityIncidentGate>
                  </ConfirmedEmailRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/oauth-complete" element={<OAuthComplete />} />
              <Route path="/auth-confirmed" element={<AuthConfirmed />} />
              <Route path="/auth-confirmed/:roleParam" element={<AuthConfirmed />} />
              <Route path="/talent/profil/:id" element={<TalentProfil />} />
              <Route
                path="/entreprise/profil/:id"
                element={
                  <ConfirmedEmailRoute role="talent">
                    <EntrepriseProfil />
                  </ConfirmedEmailRoute>
                }
              />
              <Route path="/admin" element={<Admin />} />
              <Route path="/cgu" element={<CGU />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/aide" element={<Aide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
