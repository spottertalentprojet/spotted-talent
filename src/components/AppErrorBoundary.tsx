import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/errorMonitoring";

type Props = { children: ReactNode };
type State = { hasError: boolean };

class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    void reportClientError("react_render", error, "fatal");
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5 text-foreground">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 text-center shadow-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Un problème temporaire est survenu</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Vos données ne sont pas perdues. Rechargez la page pour reprendre votre parcours.
          </p>
          <Button className="mt-6" variant="glow" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recharger la page
          </Button>
        </section>
      </main>
    );
  }
}

export default AppErrorBoundary;
