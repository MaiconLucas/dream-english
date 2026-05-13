'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'OVERDUE', label: 'Vencido' },
]

export default function FinanceFilters({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('status', value)
    else params.delete('status')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            current === opt.value
              ? 'bg-[#1a56db] text-white'
              : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
