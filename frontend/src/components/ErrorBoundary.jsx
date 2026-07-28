import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-wa-bg-dark text-slate-200 p-6 text-center select-none">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-4 shadow-xl">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Something went wrong</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm">
            An unexpected UI rendering error occurred. Please refresh the page to restore your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <RefreshCw className="w-4 h-4" /> Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
