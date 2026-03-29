import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900 p-4">
          <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-rose-500">Something went wrong</h2>
            <p className="text-zinc-500 mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the issue persists.
            </p>
            <div className="bg-zinc-50 p-4 rounded-lg overflow-auto max-h-40 mb-6 border border-zinc-200">
              <code className="text-xs text-zinc-400">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
