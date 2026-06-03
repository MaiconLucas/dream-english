'use client'

import { useState } from 'react'
import { Download, Search, AlertTriangle } from 'lucide-react'
import { exportToCSV, type AtRiskStudent } from '@/lib/reports'

export default function AtRiskReport({ data }: { data: AtRiskStudent[] }) {
  const [search, setSearch] = useState('')

  const filtered = data.filter(d =>
    !search.trim() || d.studentName.toLowerCase().includes(search.toLowerCase())
  )

  function handleExport() {
    exportToCSV(
      filtered.map(d => ({
        Nome: d.studentName,
        Turma: d.className ?? '—',
        'Aulas Assistidas': d.attended,
        'Total de Aulas': d.total,
        '% Presença': d.rate,
      })),
      'alunos-em-risco',
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Alunos em Risco</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Presença abaixo de 75% nos últimos 30 dias · {data.length} aluno{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <Download size={14} />
          CSV
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por aluno..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">
              {search ? 'Nenhum resultado encontrado.' : 'Nenhum aluno em risco identificado nos últimos 30 dias.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Nome', 'Turma', '% Presença', 'Aulas Assistidas / Total'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.studentId} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{d.studentName}</td>
                    <td className="px-4 py-3 text-[#64748b]">{d.className ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                        d.rate >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {d.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{d.attended} / {d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
