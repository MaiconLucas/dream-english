export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-[#e2e8f0] rounded-lg" />
          <div className="h-4 w-28 bg-[#e2e8f0] rounded" />
        </div>
        <div className="h-10 w-36 bg-[#e2e8f0] rounded-lg" />
      </div>

      <div className="h-10 bg-[#e2e8f0] rounded-lg" />

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex gap-6">
          <div className="h-3 w-20 bg-[#e2e8f0] rounded" />
          <div className="h-3 w-28 bg-[#e2e8f0] rounded" />
          <div className="h-3 w-24 bg-[#e2e8f0] rounded" />
          <div className="h-3 w-20 bg-[#e2e8f0] rounded" />
          <div className="h-3 w-14 bg-[#e2e8f0] rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 border-b border-[#f1f5f9] last:border-0 flex items-center gap-6">
            <div className="h-4 w-32 bg-[#e2e8f0] rounded" />
            <div className="h-4 w-44 bg-[#e2e8f0] rounded" />
            <div className="flex gap-1">
              <div className="h-5 w-16 bg-[#e2e8f0] rounded-full" />
              <div className="h-5 w-14 bg-[#e2e8f0] rounded-full" />
            </div>
            <div className="h-4 w-6 bg-[#e2e8f0] rounded" />
            <div className="h-5 w-12 bg-[#e2e8f0] rounded-full ml-auto" />
            <div className="h-4 w-16 bg-[#e2e8f0] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
