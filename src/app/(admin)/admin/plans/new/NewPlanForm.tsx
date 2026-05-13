'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlan } from '../actions'
import { Loader2 } from 'lucide-react'

export default function NewPlanForm({ schoolId }: { schoolId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const priceRaw = parseFloat((fd.get('price') as string).replace(',', '.'))
    const priceCents = Math.round(priceRaw * 100)
    const dueDay = parseInt(fd.get('dueDay') as string, 10)

    const result = await createPlan({
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      priceCents,
      dueDay,
      schoolId,
    })

    if (result.error) { setError(result.error); setLoading(false); return }
    router.push('/admin/plans')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <Field label="Nome do plano">
          <input
            name="name"
            required
            placeholder="Ex: Mensalidade"
            className={inputCls}
          />
        </Field>

        <Field label="Descrição" hint="opcional">
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição opcional"
            className={inputCls + ' resize-none'}
          />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Valor (R$)">
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="350,00"
              className={inputCls}
            />
          </Field>

          <Field label="Dia de vencimento" hint="1–28">
            <input
              name="dueDay"
              type="number"
              min="1"
              max="28"
              required
              placeholder="10"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Salvando...' : 'Criar Plano'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#374151]">
        {label}
        {hint && <span className="ml-1 text-[#94a3b8] font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
