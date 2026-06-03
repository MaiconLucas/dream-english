'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { exportToCSV, type RevenueMonth } from '@/lib/reports'

const PERIODS = [
  { value: 'month', label: 'Mês atual' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'all', label: 'Últimos 6 meses' },
]

export default function RevenueReport({ data }: { data: RevenueMonth[] }) {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'all'>('all')

  const filtered = useMemo(() => {
    if (period === 'month') return data.slice(-1)
    if (period === 'quarter') return data.slice(-3)
    return data
  }, [data, period])

  const chartData = filtered.map(d => ({
    name: d.label,
    Esperado: +(d.expected / 100).toFixed(2),
    Recebido: +(d.received / 100).toFixed(2),
  }))

  const totals = useMemo(() => ({
    received: filtered.reduce((s, d) => s + d.received, 0),
    expected: filtered.reduce((s, d) => s + d.expected, 0),
  }), [filtered])

  function handleExport() {
    exportToCSV(
      filtered.map(d => {
        const rate = d.expected > 0 ? Math.round((d.received / d.expected) * 100) : 0
        return {
          Mês: d.label,
          'Receita Recebida (R$)': (d.received / 100).toFixed(2),
          'Receita Esperada (R$)': (d.expected / 100).toFixed(2),
          'Taxa de Cobrança (%)': rate,
        }
      }),
      'receita-mensal',
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Receita Mensal</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Recebido: <span className="text-emerald-700 font-medium">{formatCurrency(totals.received / 100)}</span>
            {' '}/ Esperado: <span className="font-medium">{formatCurrency(totals.expected / 100)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as typeof period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  period === p.value ? 'bg-[#1a56db] text-white' : 'text-[#64748b] hover:bg-[#f1f5f9]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Esperado" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Recebido" fill="#1a56db" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                {['Mês', 'Receita Recebida', 'Receita Esperada', 'Taxa de Cobrança'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const rate = d.expected > 0 ? Math.round((d.received / d.expected) * 100) : 0
                return (
                  <tr key={d.month} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{d.label}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{formatCurrency(d.received / 100)}</td>
                    <td className="px-4 py-3 text-[#64748b]">{formatCurrency(d.expected / 100)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        rate >= 90 ? 'bg-emerald-50 text-emerald-700' :
                        rate >= 70 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
