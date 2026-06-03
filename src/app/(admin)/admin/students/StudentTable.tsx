'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Users, Search, Pencil } from 'lucide-react'
import type { StudentListItem } from './page'
import DeleteStudentButton from './DeleteStudentButton'

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

function getClassName(
  enrollments: StudentListItem['enrollments']
): string {
  if (!enrollments?.length) return '—'
  const active = enrollments.find((e) => e.status === 'ACTIVE') ?? enrollments[0]
  const cls = resolveOne(active.classes)
  return cls?.name ?? '—'
}

export default function StudentTable({ students }: { students: StudentListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = students.filter((s) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    const profile = resolveOne(s.profiles)
    return (
      profile?.full_name?.toLowerCase().includes(q) ||
      profile?.email?.toLowerCase().includes(q)
    )
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
          placeholder="Buscar por nome ou email..."
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
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Email</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Turma</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Mensalidade</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">Matrícula</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const profile    = resolveOne(s.profiles)
                  const className  = getClassName(s.enrollments)
                  const active     = profile?.active ?? false
                  const finalCents = Math.round(
                    (s.monthly_fee_cents ?? 0) * (1 - (s.discount_percent ?? 0) / 100)
                  )

                  return (
                    <tr
                      key={s.id}
                      className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition"
                    >
                      <td className="px-4 py-3 font-medium text-[#0f172a]">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="hover:text-[#1a56db] transition"
                        >
                          {profile?.full_name ?? '—'}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-[#64748b]">{profile?.email ?? '—'}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-[#64748b]">{className}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-[#64748b] whitespace-nowrap">
                        {finalCents > 0 ? formatCurrency(finalCents / 100) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            active
                              ? 'bg-[#ecfdf5] text-[#10b981]'
                              : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-[#64748b] whitespace-nowrap">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/students/${s.id}/edit`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] transition"
                          >
                            <Pencil size={13} />
                            Editar
                          </Link>
                          <DeleteStudentButton
                            studentId={s.id}
                            profileId={s.profile_id as string}
                            studentName={profile?.full_name ?? profile?.email ?? s.id}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">
              {query.trim()
                ? 'Nenhum aluno encontrado para esta busca.'
                : 'Nenhum aluno cadastrado ainda.'}
            </p>
            {!query.trim() && (
              <p className="text-xs text-[#94a3b8] mt-1">
                Clique em &quot;Novo Aluno&quot; para começar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
