export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-36 bg-[#e2e8f0] rounded" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-[#e2e8f0] rounded-lg" />
          <div className="h-4 w-28 bg-[#e2e8f0] rounded" />
        </div>
        <div className="h-9 w-20 bg-[#e2e8f0] rounded-lg" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-5 flex items-center gap-3">
            <div className="h-9 w-9 bg-[#e2e8f0] rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3 w-14 bg-[#e2e8f0] rounded" />
              <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
          <div className="h-4 w-24 bg-[#e2e8f0] rounded" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-[#f1f5f9] last:border-0 flex items-center gap-4">
            <div className="h-4 w-36 bg-[#e2e8f0] rounded" />
            <div className="h-4 w-44 bg-[#e2e8f0] rounded" />
            <div className="h-5 w-12 bg-[#e2e8f0] rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
