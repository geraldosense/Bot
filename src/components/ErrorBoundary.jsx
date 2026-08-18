import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-2xl p-6 text-center space-y-4">
            <p className="text-red-400 font-bold text-lg">Erro ao carregar a página</p>
            <p className="text-zinc-400 text-sm break-words">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-bold"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
