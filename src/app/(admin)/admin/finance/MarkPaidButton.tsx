'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsPaid } from './actions'
import { Loader2 } from 'lucide-react'

export default function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      await markAsPaid(paymentId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#ecfdf5] text-[#10b981] hover:bg-[#d1fae5] disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
      {isPending ? 'Salvando…' : 'Marcar como Pago'}
    </button>
  )
}
