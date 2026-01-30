import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4">Algo deu errado</h1>
            <p className="text-gray-400 mb-8">
              Desculpe, encontramos um erro inesperado.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition"
            >
              VOLTAR PRO INÍCIO
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}