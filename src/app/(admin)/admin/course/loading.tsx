export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-[#e2e8f0] rounded-lg" />
          <div className="h-4 w-20 bg-[#e2e8f0] rounded" />
        </div>
        <div className="h-10 w-32 bg-[#e2e8f0] rounded-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-5 py-4"
          >
            <div className="w-10 h-10 bg-[#e2e8f0] rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-40 bg-[#e2e8f0] rounded" />
                <div className="h-4 w-10 bg-[#e2e8f0] rounded-full" />
                <div className="h-4 w-16 bg-[#e2e8f0] rounded-full" />
              </div>
              <div className="h-3 w-64 bg-[#e2e8f0] rounded" />
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="h-4 w-6 bg-[#e2e8f0] rounded ml-auto" />
              <div className="h-3 w-10 bg-[#e2e8f0] rounded" />
            </div>
            <div className="w-4 h-4 bg-[#e2e8f0] rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
