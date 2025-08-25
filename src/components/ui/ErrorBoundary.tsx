'use client'

// Global Error Boundary Component
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Alert } from './Alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, this would send to an error tracking service
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Report')
      console.error('Error ID:', errorReport.errorId)
      console.error('Message:', errorReport.message)
      console.error('Stack:', errorReport.stack)
      console.error('Component Stack:', errorReport.componentStack)
      console.groupEnd()
    }

    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(error, { extra: errorReport })
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <div className="text-center p-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Oops! Something went wrong
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
              </p>

              <Alert variant="destructive" className="mb-6 text-left">
                <div>
                  <p className="font-semibold">Error ID: {this.state.errorId}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Technical Details (Development)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">
                        {this.state.error?.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </Alert>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.history.back()}
                >
                  ← Go Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components to handle errors
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Higher-order component for class components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Context for managing global error state
interface ErrorContextType {
  errors: Array<{ id: string; message: string; timestamp: Date }>
  addError: (message: string) => void
  removeError: (id: string) => void
  clearErrors: () => void
}

const ErrorContext = React.createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = React.useState<ErrorContextType['errors']>([])

  const addError = React.useCallback((message: string) => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setErrors(prev => [...prev, { id, message, timestamp: new Date() }])
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(error => error.id !== id))
    }, 10000)
  }, [])

  const removeError = React.useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id))
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useErrors() {
  const context = React.useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrors must be used within an ErrorProvider')
  }
  return context
}

// Toast notification component for errors
export function ErrorToast() {
  const { errors, removeError } = useErrors()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.map((error) => (
        <Alert
          key={error.id}
          variant="destructive"
          className="max-w-md animate-in slide-in-from-top-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Error</p>
              <p className="text-sm mt-1">{error.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {error.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeError(error.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
