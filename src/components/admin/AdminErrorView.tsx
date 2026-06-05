'use client'

import { AlertTriangle } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminErrorView({ error, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={22} className="text-[#ef4444]" />
      </div>
      <p className="text-base font-semibold text-[#0f172a] mb-1">Algo deu errado</p>
      <p className="text-sm text-[#64748b] mb-6 max-w-sm">
        {error.message || 'Ocorreu um erro inesperado.'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-[#1a56db] text-white text-sm font-medium hover:bg-[#1648c0] transition"
      >
        Tentar novamente
      </button>
    </div>
  )
}
