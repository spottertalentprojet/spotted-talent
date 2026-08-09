import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPlatformSecurityStatus,
  type PlatformSecurityStatus,
} from "@/lib/platformSecurity";

const POLL_INTERVAL_MS = 30_000;

const SecurityIncidentGate = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<PlatformSecurityStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const nextStatus = await getPlatformSecurityStatus();
        if (!cancelled) setStatus(nextStatus);
      } catch {
        // The database protections remain authoritative if the status request fails.
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (status?.sensitive_writes_locked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <section className="w-full max-w-xl rounded-3xl border border-amber-500/30 bg-card p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
            Mode sécurité actif
          </p>
          <h1 className="text-2xl font-bold">Votre espace est temporairement protégé</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {status.public_message ||
              "Les espaces privés sont suspendus pendant nos vérifications de sécurité."}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Vos données ne sont pas supprimées. L’accès sera rétabli après contrôle par l’administrateur.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => window.location.assign("/") }>
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l’accueil
          </Button>
        </section>
      </main>
    );
  }

  return (
    <>
      {status?.documents_locked && (
        <div className="sticky top-0 z-[100] flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950 shadow-sm dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {status.public_message ||
              "L’accès aux documents est temporairement suspendu pour vérification de sécurité."}
          </span>
        </div>
      )}
      {children}
    </>
  );
};

export default SecurityIncidentGate;
