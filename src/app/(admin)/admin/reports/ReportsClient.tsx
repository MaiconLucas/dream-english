'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign, Users, BookOpen, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle2, Clock, Search, Calendar, UserX, UserCheck,
} from 'lucide-react'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils'
import type { FinancialPayment, AttendanceRecord, StudentSummary, ClassOption } from './page'

type Tab = 'financial' | 'attendance' | 'students'

function getLast6Months() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d)
    months.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return months
}

const MONTHS = getLast6Months()

const FIN_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PAID', label: 'Pago' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'OVERDUE', label: 'Vencido' },
]

const STU_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Em dia', label: 'Em dia' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Inadimplente', label: 'Inadimplente' },
]

const payStatusStyle: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
}

const payStatusLabel: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
}

const finStatusStyle: Record<string, string> = {
  'Em dia': 'bg-emerald-50 text-emerald-700',
  'Pendente': 'bg-amber-50 text-amber-700',
  'Inadimplente': 'bg-red-50 text-red-700',
}

interface Props {
  financialPayments: FinancialPayment[]
  attendanceRecords: AttendanceRecord[]
  studentSummaries: StudentSummary[]
  classes: ClassOption[]
}

export default function ReportsClient({ financialPayments, attendanceRecords, studentSummaries, classes }: Props) {
  const [tab, setTab] = useState<Tab>('financial')

  // Financial filters
  const [finMonth, setFinMonth] = useState(MONTHS[0].value)
  const [finStatus, setFinStatus] = useState('')
  const [finSearch, setFinSearch] = useState('')

  // Attendance filters
  const [attMonth, setAttMonth] = useState(MONTHS[0].value)
  const [attClass, setAttClass] = useState('')
  const [attSearch, setAttSearch] = useState('')

  // Students filters
  const [stuFinStatus, setStuFinStatus] = useState('')
  const [stuClass, setStuClass] = useState('')
  const [stuSearch, setStuSearch] = useState('')

  // ── FINANCIAL ──────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    return financialPayments.filter(p => {
      const month = p.reference_month ?? p.due_date?.slice(0, 7)
      if (month !== finMonth) return false
      if (finStatus && p.status !== finStatus) return false
      if (finSearch.trim() && !p.student_name.toLowerCase().includes(finSearch.toLowerCase())) return false
      return true
    })
  }, [financialPayments, finMonth, finStatus, finSearch])

  const finKpis = useMemo(() => {
    const forMonth = financialPayments.filter(p => {
      const month = p.reference_month ?? p.due_date?.slice(0, 7)
      return month === finMonth
    })
    const paid = forMonth.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount_cents, 0)
    const pending = forMonth.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount_cents, 0)
    const overdue = forMonth.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + p.amount_cents, 0)
    const totalStudents = new Set(forMonth.map(p => p.student_id)).size
    const overdueStudents = new Set(forMonth.filter(p => p.status === 'OVERDUE').map(p => p.student_id)).size
    const delinquencyRate = totalStudents > 0 ? (overdueStudents / totalStudents) * 100 : 0
    return { paid, pending, overdue, delinquencyRate }
  }, [financialPayments, finMonth])

  // ── ATTENDANCE ─────────────────────────────────────────────
  const filteredAtt = useMemo(() => {
    return attendanceRecords.filter(a => {
      if (a.scheduled_at?.slice(0, 7) !== attMonth) return false
      if (attClass && a.class_id !== attClass) return false
      return true
    })
  }, [attendanceRecords, attMonth, attClass])

  const attData = useMemo(() => {
    const totalLessons = new Set(filteredAtt.map(a => a.lesson_id)).size

    const byStudent = new Map<string, { name: string; class_name: string; present: number; total: number }>()
    filteredAtt.forEach(a => {
      const cur = byStudent.get(a.student_id) ?? { name: a.student_name, class_name: a.class_name, present: 0, total: 0 }
      cur.total += 1
      if (a.attendance_status === 'PRESENT') cur.present += 1
      byStudent.set(a.student_id, cur)
    })

    const students = Array.from(byStudent.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      class_name: v.class_name,
      total: v.total,
      present: v.present,
      absences: v.total - v.present,
      rate: v.total > 0 ? (v.present / v.total) * 100 : 0,
    }))

    const avgRate = students.length > 0
      ? students.reduce((s, st) => s + st.rate, 0) / students.length
      : 0

    return { totalLessons, avgRate, students }
  }, [filteredAtt])

  const attStudents = useMemo(() => {
    if (!attSearch.trim()) return attData.students
    return attData.students.filter(s => s.name.toLowerCase().includes(attSearch.toLowerCase()))
  }, [attData.students, attSearch])

  // ── STUDENTS ───────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return studentSummaries.filter(s => {
      if (stuFinStatus && s.financial_status !== stuFinStatus) return false
      if (stuClass && !s.class_ids.includes(stuClass)) return false
      if (stuSearch.trim() && !s.name.toLowerCase().includes(stuSearch.toLowerCase())) return false
      return true
    })
  }, [studentSummaries, stuFinStatus, stuClass, stuSearch])

  const stuKpis = useMemo(() => {
    const total = studentSummaries.length
    const emDia = studentSummaries.filter(s => s.financial_status === 'Em dia').length
    const inadimplentes = studentSummaries.filter(s => s.financial_status === 'Inadimplente').length
    const ativos = total - inadimplentes
    return { total, ativos, emDia, inadimplentes }
  }, [studentSummaries])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'attendance', label: 'Presença', icon: BookOpen },
    { id: 'students', label: 'Alunos', icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === id ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── FINANCIAL TAB ─────────────────────────────────── */}
      {tab === 'financial' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={finMonth}
              onChange={e => setFinMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="flex items-center gap-1">
              {FIN_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFinStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    finStatus === opt.value ? 'bg-[#1a56db] text-white' : 'text-[#64748b] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Receita do mês" value={formatCurrency(finKpis.paid / 100)} icon={<TrendingUp size={20} className="text-emerald-600" />} bg="bg-emerald-50" />
            <KpiCard label="Total pendente" value={formatCurrency(finKpis.pending / 100)} icon={<Clock size={20} className="text-amber-600" />} bg="bg-amber-50" />
            <KpiCard label="Total vencido" value={formatCurrency(finKpis.overdue / 100)} icon={<AlertCircle size={20} className="text-red-600" />} bg="bg-red-50" />
            <KpiCard label="Taxa de inadimplência" value={formatPercent(finKpis.delinquencyRate)} icon={<TrendingDown size={20} className="text-[#64748b]" />} bg="bg-[#f1f5f9]" />
          </div>

          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              value={finSearch}
              onChange={e => setFinSearch(e.target.value)}
              placeholder="Buscar por aluno..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            />
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {filteredPayments.length === 0 ? (
              <EmptyState icon={<DollarSign size={40} className="text-[#e2e8f0] mb-3" />} message="Nenhum pagamento encontrado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Aluno', 'Valor', 'Vencimento', 'Mês referência', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{p.student_name}</td>
                        <td className="px-4 py-3 text-[#0f172a] whitespace-nowrap">{formatCurrency(p.amount_cents / 100)}</td>
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(p.due_date)}</td>
                        <td className="px-4 py-3 text-[#64748b]">{p.reference_month ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${payStatusStyle[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {payStatusLabel[p.status] ?? p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={attMonth}
              onChange={e => setAttMonth(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            >
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={attClass}
              onChange={e => setAttClass(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            >
              <option value="">Todas as turmas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Total de aulas no período" value={String(attData.totalLessons)} icon={<Calendar size={20} className="text-[#1a56db]" />} bg="bg-blue-50" />
            <KpiCard label="Média de frequência geral" value={formatPercent(attData.avgRate)} icon={<CheckCircle2 size={20} className="text-emerald-600" />} bg="bg-emerald-50" />
          </div>

          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              value={attSearch}
              onChange={e => setAttSearch(e.target.value)}
              placeholder="Buscar por aluno..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            />
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {attStudents.length === 0 ? (
              <EmptyState icon={<BookOpen size={40} className="text-[#e2e8f0] mb-3" />} message="Nenhum dado de presença encontrado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Nome', 'Turma', 'Total aulas', 'Presenças', 'Faltas', '% Frequência'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attStudents.map(s => (
                      <tr key={s.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{s.name}</td>
                        <td className="px-4 py-3 text-[#64748b]">{s.class_name}</td>
                        <td className="px-4 py-3 text-[#64748b]">{s.total}</td>
                        <td className="px-4 py-3 text-emerald-700 font-medium">{s.present}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{s.absences}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.rate >= 75 ? 'bg-emerald-50 text-emerald-700' :
                            s.rate >= 50 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {formatPercent(s.rate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ──────────────────────────────────── */}
      {tab === 'students' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={stuClass}
              onChange={e => setStuClass(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            >
              <option value="">Todas as turmas</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex items-center gap-1">
              {STU_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStuFinStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    stuFinStatus === opt.value ? 'bg-[#1a56db] text-white' : 'text-[#64748b] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total de alunos" value={String(stuKpis.total)} icon={<Users size={20} className="text-[#1a56db]" />} bg="bg-blue-50" />
            <KpiCard label="Ativos" value={String(stuKpis.ativos)} icon={<UserCheck size={20} className="text-[#64748b]" />} bg="bg-[#f1f5f9]" />
            <KpiCard label="Em dia" value={String(stuKpis.emDia)} icon={<CheckCircle2 size={20} className="text-emerald-600" />} bg="bg-emerald-50" />
            <KpiCard label="Inadimplentes" value={String(stuKpis.inadimplentes)} icon={<UserX size={20} className="text-red-600" />} bg="bg-red-50" />
          </div>

          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
            <input
              type="text"
              value={stuSearch}
              onChange={e => setStuSearch(e.target.value)}
              placeholder="Buscar por aluno..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition"
            />
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            {filteredStudents.length === 0 ? (
              <EmptyState icon={<Users size={40} className="text-[#e2e8f0] mb-3" />} message="Nenhum aluno encontrado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Nome', 'Turma', 'Plano', 'Status financeiro', 'Última presença'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{s.name}</td>
                        <td className="px-4 py-3 text-[#64748b]">{s.class_names.join(', ') || '—'}</td>
                        <td className="px-4 py-3 text-[#64748b]">{s.plan_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${finStatusStyle[s.financial_status]}`}>
                            {s.financial_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                          {s.last_presence ? formatDate(s.last_presence) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-[#0f172a] mt-1 truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg shrink-0 ml-3 ${bg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-sm text-[#64748b]">{message}</p>
    </div>
  )
}
