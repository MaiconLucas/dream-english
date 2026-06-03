// ── Tipos compartilhados ─────────────────────────────────────────────────────

export type RevenueMonth = {
  month: string   // YYYY-MM
  label: string   // "Jan 25"
  received: number  // cents (status PAID)
  expected: number  // cents (todos os status)
}

export type DefaulterRecord = {
  paymentId: string
  studentId: string
  studentName: string
  className: string | null
  amountCents: number
  dueDate: string
  daysOverdue: number
}

export type ClassAttendanceSummary = {
  classId: string
  className: string
  total: number    // total de registros de presença
  present: number  // status = 'PRESENT'
  rate: number     // 0–100
}

export type AtRiskStudent = {
  studentId: string
  studentName: string
  className: string | null
  attended: number
  total: number
  rate: number  // 0–100
}

// ── Exportar CSV ──────────────────────────────────────────────────────────────
// Chamada apenas pelo browser (botões dos componentes client).
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const rows = [
    headers.map(escape).join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(',')),
  ]
  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
