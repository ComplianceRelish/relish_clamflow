'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-6">
          <img 
            src="/logo-relish.png" 
            alt="Relish Logo" 
            className="w-16 h-16 mx-auto object-contain opacity-80"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          We apologize for the inconvenience. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-relish-purple text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Try again
        </button>
        <p className="text-xs text-gray-500 mt-4">Powered by Relish</p>
      </div>
    </div>
  )
}