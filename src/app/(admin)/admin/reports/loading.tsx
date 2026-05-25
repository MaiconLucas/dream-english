export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-8 w-40 bg-[#e2e8f0] rounded-lg mb-2" />
        <div className="h-4 w-64 bg-[#e2e8f0] rounded" />
      </div>

      <div className="h-11 w-72 bg-[#e2e8f0] rounded-xl" />

      <div className="flex gap-3">
        <div className="h-9 w-40 bg-[#e2e8f0] rounded-lg" />
        <div className="h-9 w-80 bg-[#e2e8f0] rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#e2e8f0] rounded-xl" />
        ))}
      </div>

      <div className="h-9 w-72 bg-[#e2e8f0] rounded-lg" />

      <div className="bg-[#e2e8f0] rounded-xl h-64" />
    </div>
  )
}
