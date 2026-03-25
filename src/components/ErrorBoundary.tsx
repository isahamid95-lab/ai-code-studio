import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React render errors and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="glass-panel rounded-2xl p-8 max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-xl font-semibold text-text mb-2">
              Something went wrong
            </h2>
            <p className="text-text/50 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {this.state.error?.stack && (
              <details className="text-left mb-6">
                <summary className="cursor-pointer text-sm text-text/70 hover:text-text">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-black/20 rounded-lg text-xs overflow-auto max-h-48 text-red-300">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
