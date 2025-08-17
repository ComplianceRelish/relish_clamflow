export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ClamFlow
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Comprehensive Clam Processing & Quality Control System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Weight Notes</h3>
            <p className="text-gray-600 mb-4">
              Record and track clam weights throughout the processing pipeline.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Create Weight Note
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">PPC Forms</h3>
            <p className="text-gray-600 mb-4">
              Manage Primary Processing Center documentation and compliance.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Create PPC Form
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Final Processing</h3>
            <p className="text-gray-600 mb-4">
              Oversee final processing stages and quality approvals.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Create FP Form
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">QC Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Monitor quality control metrics and approval workflows.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              View Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">RFID Tracking</h3>
            <p className="text-gray-600 mb-4">
              Track inventory and batches using RFID technology.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              RFID Scanner
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">QR Labels</h3>
            <p className="text-gray-600 mb-4">
              Generate QR code labels for traceability and compliance.
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Generate Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}