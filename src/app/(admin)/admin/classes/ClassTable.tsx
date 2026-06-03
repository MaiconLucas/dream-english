'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Search, Pencil } from 'lucide-react'
import type { ClassListItem } from './page'
import type { Schedule } from './actions'

const DAY_SHORT: Record<string, string> = {
  Monday: 'Seg',
  Tuesday: 'Ter',
  Wednesday: 'Qua',
  Thursday: 'Qui',
  Friday: 'Sex',
  Saturday: 'Sáb',
  Sunday: 'Dom',
}

function scheduleLabel(schedule: Schedule | null): string {
  if (!schedule || (!schedule.days?.length && !schedule.time)) return '—'
  const days = (schedule.days ?? []).map((d) => DAY_SHORT[d] ?? d).join(', ')
  const time = schedule.time ? ` · ${schedule.time}` : ''
  const dur = schedule.duration ? ` (${schedule.duration}min)` : ''
  return `${days}${time}${dur}`
}

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default function ClassTable({ classes }: { classes: ClassListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = classes.filter((c) => {
    if (!query.trim()) return true
    return c.name.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome da turma..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Nome</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Professor</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Nível</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Alunos</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Horário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const teacher = resolveOne(c.teachers)
                  const profile = resolveOne(teacher?.profiles)

                  return (
                    <tr
                      key={c.id}
                      className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition"
                    >
                      <td className="px-4 py-3 font-medium text-[#0f172a]">
                        <Link
                          href={`/admin/classes/${c.id}`}
                          className="hover:text-[#1a56db] transition"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-[#64748b]">{profile?.full_name ?? '—'}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-[#64748b]">{c.level ?? '—'}</td>
                      <td className="px-4 py-3 text-[#64748b]">
                        <span className="tabular-nums">
                          {c._enrollCount}/{c.max_students}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
                        {scheduleLabel(c.schedule)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            c.active
                              ? 'bg-[#ecfdf5] text-[#10b981]'
                              : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {c.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/classes/${c.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] transition"
                        >
                          <Pencil size={13} />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">
              {query.trim()
                ? 'Nenhuma turma encontrada para esta busca.'
                : 'Nenhuma turma cadastrada ainda.'}
            </p>
            {!query.trim() && (
              <p className="text-xs text-[#94a3b8] mt-1">
                Clique em &quot;Nova Turma&quot; para começar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
