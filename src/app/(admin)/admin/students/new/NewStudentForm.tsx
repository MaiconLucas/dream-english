'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createStudent } from '../actions'

const schema = z.object({
  fullName:        z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:           z.string().email('Email inválido'),
  phone:           z.string(),
  password:        z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  classId:         z.string(),
  level:           z.string(),
  monthlyFee:      z.number().min(0),
  discountPercent: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
  dueDay:          z.number().int().min(1, 'Mínimo dia 1').max(28, 'Máximo dia 28'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  classes: { id: string; name: string }[]
  schoolId: string
}

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function NewStudentForm({ classes, schoolId }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '', email: '', phone: '', password: '',
      classId: '', level: '',
      monthlyFee: 0, discountPercent: 0, dueDay: 10,
    },
  })

  const monthlyFee      = useWatch({ control, name: 'monthlyFee' }) ?? 0
  const discountPercent = useWatch({ control, name: 'discountPercent' }) ?? 0
  const finalAmount     = monthlyFee * (1 - discountPercent / 100)

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createStudent({
      fullName:        values.fullName,
      email:           values.email,
      phone:           values.phone,
      password:        values.password,
      classId:         values.classId,
      level:           values.level,
      schoolId,
      monthlyFeeCents: Math.round(values.monthlyFee * 100),
      discountPercent: values.discountPercent,
      dueDay:          values.dueDay,
    })
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

      {/* Dados pessoais */}
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

      {/* Mensalidade */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Mensalidade
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Field label="Valor (R$)" error={errors.monthlyFee?.message}>
            <input
              {...register('monthlyFee', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              className={inputCls(!!errors.monthlyFee)}
            />
          </Field>

          <Field label="Desconto (%)" error={errors.discountPercent?.message}>
            <input
              {...register('discountPercent', { valueAsNumber: true })}
              type="number"
              min="0"
              max="100"
              step="1"
              placeholder="0"
              className={inputCls(!!errors.discountPercent)}
            />
          </Field>

          <Field label="Dia de vencimento" error={errors.dueDay?.message}>
            <input
              {...register('dueDay', { valueAsNumber: true })}
              type="number"
              min="1"
              max="28"
              step="1"
              placeholder="10"
              className={inputCls(!!errors.dueDay)}
            />
          </Field>
        </div>

        {monthlyFee > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3">
            <span className="text-xs text-[#64748b]">
              Valor final após desconto de {discountPercent}%
            </span>
            <span className="text-base font-semibold text-[#1a56db]">
              {formatBRL(finalAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Matrícula */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Matrícula
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Turma" error={errors.classId?.message}>
            <select {...register('classId')} className={inputCls(!!errors.classId)}>
              <option value="">Selecionar turma</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Nível" error={errors.level?.message}>
            <select {...register('level')} className={inputCls(!!errors.level)}>
              <option value="">Selecionar nível</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
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
