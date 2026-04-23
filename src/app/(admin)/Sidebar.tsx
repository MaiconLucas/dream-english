'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Alunos', icon: Users },
  { href: '/admin/teachers', label: 'Professores', icon: GraduationCap },
  { href: '/admin/classes', label: 'Turmas', icon: BookOpen },
  { href: '/admin/finance', label: 'Financeiro', icon: DollarSign },
]

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e2e8f0] flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-[#e2e8f0]">
        <span className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          🎓 Dream English
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-primary-light text-primary'
                  : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#e2e8f0]">
        <p className="text-xs text-[#64748b] truncate">{email}</p>
        <p className="text-[10px] text-[#94a3b8] mt-1">v0.1.7</p>
      </div>
    </aside>
  )
}
