export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="bg-gray-200 rounded aspect-video mb-6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
            </div>
          </div>
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 h-64"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 