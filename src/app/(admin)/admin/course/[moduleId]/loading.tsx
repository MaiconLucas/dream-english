export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 bg-[#e2e8f0] rounded" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-48 bg-[#e2e8f0] rounded-lg" />
            <div className="h-5 w-10 bg-[#e2e8f0] rounded-full" />
            <div className="h-5 w-16 bg-[#e2e8f0] rounded-full" />
          </div>
          <div className="h-4 w-64 bg-[#e2e8f0] rounded" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-9 w-24 bg-[#e2e8f0] rounded-lg" />
          <div className="h-9 w-28 bg-[#e2e8f0] rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex justify-between items-center">
          <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
          <div className="h-9 w-28 bg-[#e2e8f0] rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-[#f1f5f9] last:border-0 flex items-center gap-4">
            <div className="h-4 w-6 bg-[#e2e8f0] rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 bg-[#e2e8f0] rounded" />
              <div className="h-3 w-32 bg-[#e2e8f0] rounded" />
            </div>
            <div className="h-4 w-16 bg-[#e2e8f0] rounded" />
            <div className="h-5 w-16 bg-[#e2e8f0] rounded-full" />
            <div className="h-4 w-14 bg-[#e2e8f0] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
