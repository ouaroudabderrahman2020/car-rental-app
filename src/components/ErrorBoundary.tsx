import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-margin">
          <div className="max-w-xl w-full bg-slate-800 border-l-8 border-red-600 industrial-shadow p-10 space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-red-600/10 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">System Malfunction</h1>
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2 italic">Error Code: {this.state.error?.name || 'CRITICAL_FAILURE'}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 border border-slate-700/50">
              <p className="text-slate-300 font-mono text-sm leading-relaxed">
                {this.state.error?.message || 'An unexpected error occurred within the application core. Process halted.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-8 py-4 bg-primary text-white font-black uppercase tracking-[0.2em] industrial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" />
                Reboot System
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 px-8 py-4 bg-slate-700 text-white font-black uppercase tracking-[0.2em] hover:bg-slate-600 transition-all flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5" />
                Return to Bridge
              </button>
            </div>

            <div className="pt-6 border-t border-slate-700/50">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] text-center">
                Contact Fleet Operations if this persists.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
