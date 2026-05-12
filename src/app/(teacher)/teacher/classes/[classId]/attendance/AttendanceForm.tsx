'use client'

import { useState, useTransition } from 'react'
import { saveAttendance } from './actions'
import type { AttendanceStatus } from '@/types/database'
import { CheckCircle2, XCircle, Clock, FileCheck, Loader2, CalendarDays } from 'lucide-react'

type Student = { student_id: string; full_name: string }

const STATUSES: {
  value: AttendanceStatus
  label: string
  icon: React.ElementType
  base: string
  active: string
}[] = [
  {
    value: 'PRESENT',
    label: 'Presente',
    icon: CheckCircle2,
    base: 'text-[#64748b] hover:bg-[#ecfdf5] hover:text-[#10b981]',
    active: 'bg-[#ecfdf5] text-[#10b981]',
  },
  {
    value: 'ABSENT',
    label: 'Ausente',
    icon: XCircle,
    base: 'text-[#64748b] hover:bg-red-50 hover:text-red-600',
    active: 'bg-red-50 text-red-600',
  },
  {
    value: 'LATE',
    label: 'Atrasado',
    icon: Clock,
    base: 'text-[#64748b] hover:bg-amber-50 hover:text-amber-600',
    active: 'bg-amber-50 text-amber-600',
  },
  {
    value: 'JUSTIFIED',
    label: 'Justificado',
    icon: FileCheck,
    base: 'text-[#64748b] hover:bg-[#ebf3ff] hover:text-[#1a56db]',
    active: 'bg-[#ebf3ff] text-[#1a56db]',
  },
]

function defaultDatetime() {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString().slice(0, 16)
}

function formatDatetime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AttendanceForm({
  classId,
  students,
}: {
  classId: string
  students: Student[]
}) {
  const [date, setDate] = useState(defaultDatetime)
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(students.map(s => [s.student_id, 'PRESENT' as AttendanceStatus]))
  )
  const [savedDate, setSavedDate] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function toggle(studentId: string, status: AttendanceStatus) {
    setStatuses(prev => ({ ...prev, [studentId]: status }))
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      const records = students.map(s => ({ studentId: s.student_id, status: statuses[s.student_id] }))
      const result = await saveAttendance(classId, new Date(date).toISOString(), records)
      if (result.error) { setError(result.error); return }
      setSavedDate(formatDatetime(date))
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="bg-[#ecfdf5] rounded-xl border border-[#bbf7d0] p-6 flex items-center gap-3">
        <CheckCircle2 size={20} className="text-[#10b981] flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#065f46]">Chamada salva com sucesso!</p>
          <p className="text-xs text-[#047857] mt-0.5">
            {students.length} aluno{students.length !== 1 ? 's' : ''} registrado{students.length !== 1 ? 's' : ''} — {savedDate}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Data e hora da aula */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
        <label className="flex items-center gap-2 text-sm font-medium text-[#0f172a] mb-2">
          <CalendarDays size={15} className="text-[#64748b]" />
          Data e hora da aula
        </label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
        />
      </div>

      {/* Lista de alunos */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {students.map((s, i) => (
          <div
            key={s.student_id}
            className={`flex items-center justify-between px-5 py-3.5 ${i < students.length - 1 ? 'border-b border-[#f1f5f9]' : ''}`}
          >
            <p className="text-sm font-medium text-[#0f172a] min-w-0 mr-4 truncate">{s.full_name}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {STATUSES.map(({ value, label, icon: Icon, base, active }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggle(s.student_id, value)}
                  title={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    statuses[s.student_id] === value ? active : base
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !date}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isPending && <Loader2 size={15} className="animate-spin" />}
        {isPending ? 'Salvando...' : 'Salvar Chamada'}
      </button>
    </div>
  )
}
