import Link from 'next/link'

export default function NotFound() {
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
        <h2 className="text-4xl font-bold text-gray-900 mb-4">404</h2>
        <h3 className="text-xl text-gray-600 mb-6">Page Not Found</h3>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-relish-purple text-white rounded-md hover:bg-purple-700 transition-colors">
          Return to Dashboard
        </Link>
        <p className="text-xs text-gray-500 mt-4">Powered by Relish</p>
      </div>
    </div>
  )
}