export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-52 bg-[#e2e8f0] rounded-lg" />
        <div className="h-4 w-36 bg-[#e2e8f0] rounded" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-[#e2e8f0] rounded" />
              <div className="h-8 w-8 bg-[#e2e8f0] rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-[#e2e8f0] rounded" />
            <div className="h-3 w-16 bg-[#e2e8f0] rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
            <div className="h-5 w-36 bg-[#e2e8f0] rounded" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 pb-3 border-b border-[#f1f5f9]">
                <div className="h-9 w-9 bg-[#e2e8f0] rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-[#e2e8f0] rounded" />
                  <div className="h-3 w-24 bg-[#e2e8f0] rounded" />
                </div>
                <div className="h-3.5 w-14 bg-[#e2e8f0] rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
