import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="bg-card p-6 rounded-xl border border-border max-w-lg w-full shadow-xl">
            <h2 className="text-xl font-bold text-red-500 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-text-secondary mb-4">
              A aplicação encontrou um erro inesperado. Tente recarregar a página.
            </p>
            <div className="bg-background/50 p-4 rounded-lg overflow-auto max-h-48 text-sm font-mono text-text-secondary border border-border/50">
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
