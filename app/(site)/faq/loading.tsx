export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navigation Skeleton */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-full border border-emerald-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-emerald-200 rounded animate-pulse"></div>
            <div className="flex space-x-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 w-16 bg-emerald-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-8 w-20 bg-emerald-200 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-16">
            <div className="h-12 w-96 bg-emerald-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 w-128 bg-emerald-200 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-12">
            <div className="h-12 w-full bg-white/80 rounded-lg border border-emerald-200 animate-pulse"></div>
          </div>

          {/* FAQ Items Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-200 p-6 animate-pulse">
                <div className="h-6 w-3/4 bg-emerald-200 rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-emerald-100 rounded"></div>
                  <div className="h-4 w-5/6 bg-emerald-100 rounded"></div>
                  <div className="h-4 w-4/6 bg-emerald-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
