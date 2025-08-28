import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-6">
          <img 
            src="/logo-relish.png" 
            alt="Relish Logo" 
            className="w-16 h-16 mx-auto object-contain opacity-80"
          />
        </div>
        <LoadingSpinner className="mx-auto mb-4" />
        <p className="text-gray-600">Loading ClamFlow...</p>
        <p className="text-xs text-gray-500 mt-2">Powered by Relish</p>
      </div>
    </div>
  )
}