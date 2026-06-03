'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Download, BookOpen } from 'lucide-react'
import { exportToCSV, type ClassAttendanceSummary } from '@/lib/reports'

type Props = {
  data: ClassAttendanceSummary[]
}

export default function AttendanceReport({ data }: Props) {
  const [selectedClass, setSelectedClass] = useState('')

  const filtered = useMemo(
    () => selectedClass ? data.filter(d => d.classId === selectedClass) : data,
    [data, selectedClass],
  )

  const chartData = filtered.map(d => ({ name: d.className, '%': d.rate }))

  function handleExport() {
    exportToCSV(
      filtered.map(d => ({
        Turma: d.className,
        'Total Registros': d.total,
        Presenças: d.present,
        Faltas: d.total - d.present,
        '% Frequência': d.rate,
      })),
      'frequencia-por-turma',
    )
  }

  const barColor = (rate: number) =>
    rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Frequência por Turma</h2>
          <p className="text-xs text-[#64748b] mt-0.5">Últimos 30 dias</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
          >
            <option value="">Todas as turmas</option>
            {data.map(d => (
              <option key={d.classId} value={d.classId}>{d.className}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhum dado de presença nos últimos 30 dias.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, 'Frequência']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="%" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry['%'])} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                    {['Turma', 'Presenças', 'Faltas', 'Total', '% Frequência'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.classId} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{d.className}</td>
                      <td className="px-4 py-3 text-emerald-700 font-medium">{d.present}</td>
                      <td className="px-4 py-3 text-red-600">{d.total - d.present}</td>
                      <td className="px-4 py-3 text-[#64748b]">{d.total}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                          d.rate >= 50 ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {d.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
