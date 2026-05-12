'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, GraduationCap, BookOpen, DollarSign, LogOut, Layers, ClipboardList, BookMarked } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Alunos', icon: Users },
  { href: '/admin/teachers', label: 'Professores', icon: GraduationCap },
  { href: '/admin/classes', label: 'Turmas', icon: BookOpen },
  { href: '/admin/modules', label: 'Módulos', icon: Layers },
  { href: '/admin/homework', label: 'Homework', icon: ClipboardList },
  { href: '/admin/course', label: 'Conteúdo', icon: BookMarked },
  { href: '/admin/finance', label: 'Financeiro', icon: DollarSign },
]

export default function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e2e8f0] flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-[#e2e8f0]">
        <span className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          🎓 Dream English
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-[#ebf3ff] text-[#1a56db]'
                  : 'text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#e2e8f0] space-y-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#0f172a] truncate">{name}</p>
          <p className="text-[11px] text-[#64748b] truncate">{email}</p>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">v0.2.0</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
