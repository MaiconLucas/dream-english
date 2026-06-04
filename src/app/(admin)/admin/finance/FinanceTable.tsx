'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Search, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import MarkPaidButton from './MarkPaidButton'
import type { StudentGroup, PaymentRow } from './page'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'PAID', label: 'Pago' },
]

const statusStyles: Record<string, string> = {
  PAID:      'bg-emerald-50 text-emerald-700',
  PENDING:   'bg-amber-50 text-amber-700',
  OVERDUE:   'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  PAID:      'Pago',
  PENDING:   'Pendente',
  OVERDUE:   'Em atraso',
  CANCELLED: 'Cancelado',
}

function PaymentCells({ p }: { p: PaymentRow }) {
  return (
    <>
      <td className="max-md:hidden px-4 py-3 text-[#64748b]">{p.notes ?? '—'}</td>
      <td className="max-sm:hidden px-4 py-3 text-[#64748b]">{p.reference_month ?? '—'}</td>
      <td className="max-sm:hidden px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(p.due_date)}</td>
      <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">
        {formatCurrency(p.amount_cents / 100)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {statusLabels[p.status] ?? p.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
          <MarkPaidButton paymentId={p.id} />
        )}
      </td>
    </>
  )
}

export default function FinanceTable({ groups }: { groups: StudentGroup[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtered: StudentGroup[] = []
  groups.forEach(g => {
    if (search.trim() && !g.studentName.toLowerCase().includes(search.toLowerCase())) return
    const payments = statusFilter ? g.payments.filter(p => p.status === statusFilter) : g.payments
    if (payments.length === 0) return
    const oldestOpen = payments.find(p => p.status === 'PENDING' || p.status === 'OVERDUE') ?? null
    filtered.push({ studentId: g.studentId, studentName: g.studentName, payments, oldestOpen })
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por aluno..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === opt.value
                  ? 'bg-[#1a56db] text-white'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum pagamento encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Aluno</th>
                  <th className="max-md:hidden text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Descrição</th>
                  <th className="max-sm:hidden text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Referência</th>
                  <th className="max-sm:hidden text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Vencimento</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const isExpanded = !!expanded[g.studentId]
                  const displayPayment = g.oldestOpen ?? g.payments[0]
                  const restPayments = g.payments.filter(p => p.id !== displayPayment.id)
                  const hasMore = restPayments.length > 0

                  const result = [
                    <tr
                      key={`s-${g.studentId}`}
                      className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition ${hasMore ? 'cursor-pointer' : ''}`}
                      onClick={() => { if (hasMore) toggle(g.studentId) }}
                    >
                      <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {hasMore ? (
                            isExpanded
                              ? <ChevronDown size={14} className="text-[#94a3b8] shrink-0" />
                              : <ChevronRight size={14} className="text-[#94a3b8] shrink-0" />
                          ) : (
                            <span className="inline-block w-3.5 shrink-0" />
                          )}
                          <span>{g.studentName}</span>
                          {hasMore && !isExpanded && (
                            <span className="text-[10px] text-[#94a3b8] font-normal">+{restPayments.length}</span>
                          )}
                        </div>
                      </td>
                      <PaymentCells p={displayPayment} />
                    </tr>,
                  ]

                  if (isExpanded) {
                    restPayments.forEach(p => {
                      result.push(
                        <tr
                          key={`sub-${p.id}`}
                          className="border-b border-[#f1f5f9] bg-[#fafbff] hover:bg-[#f1f5f9] transition"
                        >
                          <td className="px-4 py-3 pl-9 text-[#64748b]" />
                          <PaymentCells p={p} />
                        </tr>
                      )
                    })
                  }

                  return result
                })}
              </tbody>
            </table>
        )}
      </div>
    </div>
  )
}
