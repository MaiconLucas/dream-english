'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, DollarSign,
  LogOut, BookMarked, BarChart2, Menu, X,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/students',  label: 'Alunos',      icon: Users           },
  { href: '/admin/teachers',  label: 'Professores', icon: GraduationCap   },
  { href: '/admin/classes',   label: 'Turmas',      icon: BookOpen        },
  { href: '/admin/course',    label: 'Conteúdo',    icon: BookMarked      },
  { href: '/admin/finance',   label: 'Financeiro',  icon: DollarSign      },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2       },
]

function NavLinks({ pathname }: { pathname: string }) {
  return (
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
  )
}

function SidebarFooter({ name, email }: { name: string; email: string }) {
  return (
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
  )
}

export default function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Fecha o drawer ao navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia scroll do body quando drawer está aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Desktop: sidebar fixa ──────────────────────── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e2e8f0] flex-col z-30">
        <div className="h-16 flex items-center px-6 border-b border-[#e2e8f0]">
          <span className="flex items-center gap-2 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Image src="/logo.png" alt="" width={28} height={28} className="object-contain shrink-0" />
            Dream English
          </span>
        </div>
        <NavLinks pathname={pathname} />
        <SidebarFooter name={name} email={email} />
      </aside>

      {/* ── Mobile: top bar com hamburger ─────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[#e2e8f0] flex items-center gap-3 px-4 z-30">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <span className="flex items-center gap-2 text-base font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <Image src="/logo.png" alt="" width={24} height={24} className="object-contain shrink-0" />
          Dream English
        </span>
      </div>

      {/* ── Mobile: drawer overlay ─────────────────────── */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-72 bg-white flex flex-col z-50 shadow-xl">
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#e2e8f0]">
              <span className="flex items-center gap-2 text-base font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                <Image src="/logo.png" alt="" width={24} height={24} className="object-contain shrink-0" />
                Dream English
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} />
            <SidebarFooter name={name} email={email} />
          </aside>
        </>
      )}
    </>
  )
}
