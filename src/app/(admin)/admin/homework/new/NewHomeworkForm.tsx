'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createHomework } from '../actions'

const schema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().min(5, 'Enunciado deve ter pelo menos 5 caracteres'),
  classId: z.string().min(1, 'Selecione uma turma'),
  moduleId: z.string(),
  dueDate: z.string(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  schoolId: string
  classes: { id: string; name: string }[]
  modules: { id: string; title: string; level: string }[]
}

export default function NewHomeworkForm({ schoolId, classes, modules }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', classId: '', moduleId: '', dueDate: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createHomework({ ...values, schoolId })
    if (result.error) { setServerError(result.error); return }
    router.push('/admin/homework')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">{serverError}</div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Atividade</h2>

        <Field label="Título" error={errors.title?.message}>
          <input {...register('title')} type="text" placeholder="Ex: Unit 1 — Writing Exercise" className={inputCls(!!errors.title)} />
        </Field>

        <Field label="Enunciado / Descrição" error={errors.description?.message}>
          <textarea {...register('description')} rows={5}
            placeholder="Escreva o enunciado da atividade aqui..."
            className={inputCls(!!errors.description) + ' resize-y'} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Turma" error={errors.classId?.message}>
            <select {...register('classId')} className={inputCls(!!errors.classId)}>
              <option value="">Selecionar turma</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Data de entrega" error={errors.dueDate?.message}>
            <input {...register('dueDate')} type="datetime-local" className={inputCls(!!errors.dueDate)} />
          </Field>
        </div>

        <Field label="Módulo relacionado (opcional)" error={errors.moduleId?.message}>
          <select {...register('moduleId')} className={inputCls(!!errors.moduleId)}>
            <option value="">Nenhum</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.level} — {m.title}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition">
          {isSubmitting ? 'Salvando...' : 'Criar Homework'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function inputCls(e: boolean) {
  return `w-full px-3 py-2.5 rounded-lg border text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition ${e ? 'border-[#ef4444] bg-red-50' : 'border-[#e2e8f0] bg-white'}`
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
