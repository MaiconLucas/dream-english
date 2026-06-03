'use client'

import { useState } from 'react'
import { TrendingUp, AlertCircle, BookOpen, AlertTriangle } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { RevenueMonth, DefaulterRecord, ClassAttendanceSummary, AtRiskStudent } from '@/lib/reports'

// Dynamic imports to avoid SSR issues with Recharts
const RevenueReport    = dynamic(() => import('@/components/admin/reports/RevenueReport'),    { ssr: false })
const DefaultersReport = dynamic(() => import('@/components/admin/reports/DefaultersReport'), { ssr: false })
const AttendanceReport = dynamic(() => import('@/components/admin/reports/AttendanceReport'), { ssr: false })
const AtRiskReport     = dynamic(() => import('@/components/admin/reports/AtRiskReport'),     { ssr: false })

type Tab = 'revenue' | 'defaulters' | 'attendance' | 'atrisk'

interface Props {
  revenueData: RevenueMonth[]
  defaultersData: DefaulterRecord[]
  attendanceData: ClassAttendanceSummary[]
  atRiskData: AtRiskStudent[]
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'revenue',    label: 'Receita',         icon: TrendingUp   },
  { id: 'defaulters', label: 'Inadimplência',   icon: AlertCircle  },
  { id: 'attendance', label: 'Presença',        icon: BookOpen     },
  { id: 'atrisk',     label: 'Alunos em Risco', icon: AlertTriangle },
]

export default function ReportsClient({ revenueData, defaultersData, attendanceData, atRiskData }: Props) {
  const [tab, setTab] = useState<Tab>('revenue')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
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

      {tab === 'revenue'    && <RevenueReport    data={revenueData}    />}
      {tab === 'defaulters' && <DefaultersReport data={defaultersData} />}
      {tab === 'attendance' && <AttendanceReport data={attendanceData} />}
      {tab === 'atrisk'     && <AtRiskReport     data={atRiskData}     />}
    </div>
  )
}
