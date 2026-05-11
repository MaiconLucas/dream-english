'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateStudent } from '../../actions'

const schema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string(),
  planId: z.string(),
  classId: z.string(),
  level: z.string(),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  studentId: string
  profileId: string
  schoolId: string
  plans: { id: string; name: string }[]
  classes: { id: string; name: string }[]
  defaults: FormValues
}

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

export default function EditStudentForm({ studentId, profileId, schoolId, plans, classes, defaults }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await updateStudent(studentId, profileId, schoolId, values)
    if (result.error) {
      setServerError(result.error)
      return
    }
    setSuccess(true)
    router.push(`/admin/students/${studentId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">
          {serverError}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-[#ecfdf5] border border-[#bbf7d0] px-4 py-3 text-sm text-[#10b981]">
          Dados atualizados com sucesso!
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Dados pessoais
        </h2>

        <Field label="Nome completo" error={errors.fullName?.message}>
          <input {...register('fullName')} type="text" className={inputCls(!!errors.fullName)} />
        </Field>

        <Field label="Telefone" error={errors.phone?.message}>
          <input {...register('phone')} type="text" placeholder="(11) 99999-9999" className={inputCls(!!errors.phone)} />
        </Field>

        <div className="flex items-center gap-3">
          <input
            {...register('active')}
            type="checkbox"
            id="active"
            className="h-4 w-4 rounded border-[#e2e8f0] text-[#1a56db] focus:ring-[#1a56db]"
          />
          <label htmlFor="active" className="text-sm text-[#374151]">Aluno ativo</label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Matrícula
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Plano" error={errors.planId?.message}>
            <select {...register('planId')} className={inputCls(!!errors.planId)}>
              <option value="">Sem plano</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Turma" error={errors.classId?.message}>
            <select {...register('classId')} className={inputCls(!!errors.classId)}>
              <option value="">Sem turma</option>
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
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
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
