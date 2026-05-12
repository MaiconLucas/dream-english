'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createModule } from '../actions'

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'] as const

const schema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string(),
  level: z.enum(LEVELS, { error: 'Selecione um nível' }),
  orderIndex: z.number().int().min(0, 'Ordem deve ser 0 ou maior'),
  content: z.string(),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export default function NewModuleForm({ schoolId }: { schoolId: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', level: 'Beginner', orderIndex: 0, content: '', active: true },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createModule({ ...values, schoolId })
    if (result.error) { setServerError(result.error); return }
    router.push('/admin/modules')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">{serverError}</div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Identificação</h2>

        <Field label="Título" error={errors.title?.message}>
          <input {...register('title')} type="text" placeholder="Ex: Unit 1 — Greetings" className={inputCls(!!errors.title)} />
        </Field>

        <Field label="Descrição curta" error={errors.description?.message}>
          <input {...register('description')} type="text" placeholder="Breve resumo do módulo" className={inputCls(!!errors.description)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Nível" error={errors.level?.message}>
            <select {...register('level')} className={inputCls(!!errors.level)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="Posição na trilha (0 = primeiro)" error={errors.orderIndex?.message}>
            <input
              {...register('orderIndex', { valueAsNumber: true })}
              type="number" min={0}
              className={inputCls(!!errors.orderIndex)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <input {...register('active')} type="checkbox" id="active" className="h-4 w-4 rounded border-[#e2e8f0] text-[#1a56db] focus:ring-[#1a56db]" />
          <label htmlFor="active" className="text-sm text-[#374151]">Módulo ativo (visível na trilha)</label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Conteúdo</h2>
        <Field label="Conteúdo (Markdown suportado)" error={errors.content?.message}>
          <textarea
            {...register('content')}
            rows={12}
            placeholder={`# Título\n\nEscreva o conteúdo da aula aqui...\n\n## Vocabulário\n\n- Word: meaning\n\n## Exercícios\n\n1. ...`}
            className={inputCls(false) + ' resize-y font-mono text-xs leading-relaxed'}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition">
          {isSubmitting ? 'Salvando...' : 'Criar Módulo'}
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
