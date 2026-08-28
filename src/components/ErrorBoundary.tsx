import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-wide crash guard.
 *
 * React unmounts the entire tree when a render throws, which is why a single
 * bad value — e.g. an undefined wallet balance reaching
 * `zetaPoints.toLocaleString()` in TopBar — turned the whole app into a blank
 * white screen with no clue as to the cause. This catches that, keeps the
 * error on screen instead of silently blanking, and offers a way back.
 *
 * This is a safety net, not a substitute for handling errors where they
 * happen — but it means the next unguarded property access degrades into a
 * readable message rather than a dead page.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught render error:", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-1">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <pre className="text-[11px] text-left text-muted-foreground bg-secondary rounded-lg p-3 mb-4 overflow-x-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <button
            onClick={this.handleReload}
            className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
