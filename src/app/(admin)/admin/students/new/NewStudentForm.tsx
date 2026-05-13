'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createStudent } from '../actions'

const schema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  planId: z.string(),
  classId: z.string(),
  level: z.string(),
})

type FormValues = z.infer<typeof schema>

type Plan = { id: string; name: string; price_cents: number; due_day: number | null }

type Props = {
  plans: Plan[]
  classes: { id: string; name: string }[]
  schoolId: string
}

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

export default function NewStudentForm({ plans, classes, schoolId }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', planId: '', classId: '', level: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createStudent({ ...values, schoolId })
    if (result.error) {
      setServerError(result.error)
      return
    }
    router.push('/admin/students?created=1')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">
          {serverError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Dados pessoais
        </h2>

        <Field label="Nome completo" error={errors.fullName?.message}>
          <input
            {...register('fullName')}
            type="text"
            placeholder="Ana Silva"
            className={inputCls(!!errors.fullName)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="ana@email.com"
              className={inputCls(!!errors.email)}
            />
          </Field>

          <Field label="Telefone" error={errors.phone?.message}>
            <input
              {...register('phone')}
              type="text"
              placeholder="(11) 99999-9999"
              className={inputCls(!!errors.phone)}
            />
          </Field>
        </div>

        <Field label="Senha de acesso" error={errors.password?.message}>
          <input
            {...register('password')}
            type="password"
            placeholder="Mínimo 6 caracteres"
            className={inputCls(!!errors.password)}
          />
        </Field>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Matrícula
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Plano" error={errors.planId?.message}>
            <select {...register('planId')} className={inputCls(!!errors.planId)}>
              <option value="">Selecionar plano</option>
              {plans.map((p) => {
                const price = (p.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                const day = p.due_day ? ` — vence dia ${p.due_day}` : ''
                return <option key={p.id} value={p.id}>{p.name} — {price}{day}</option>
              })}
            </select>
          </Field>

          <Field label="Turma" error={errors.classId?.message}>
            <select {...register('classId')} className={inputCls(!!errors.classId)}>
              <option value="">Selecionar turma</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Nível" error={errors.level?.message}>
          <select {...register('level')} className={inputCls(!!errors.level)}>
            <option value="">Selecionar nível</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar Aluno'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function inputCls(hasError: boolean) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition ${
    hasError ? 'border-[#ef4444] bg-red-50' : 'border-[#e2e8f0] bg-white'
  }`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#374151]">{label}</label>
      {children}
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  )
}
