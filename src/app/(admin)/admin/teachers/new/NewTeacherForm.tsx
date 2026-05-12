'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { X } from 'lucide-react'
import { createTeacher } from '../actions'

const schema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  bio: z.string(),
})

type FormValues = z.infer<typeof schema>

const SPECIALTY_SUGGESTIONS = [
  'General English',
  'Business English',
  'Kids / Young Learners',
  'Conversation',
  'Grammar',
  'Pronunciation',
  'IELTS / TOEFL',
  'FCE / CAE',
]

export default function NewTeacherForm({ schoolId }: { schoolId: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', bio: '' },
  })

  function addSpecialty(value: string) {
    const trimmed = value.trim()
    if (!trimmed || specialties.includes(trimmed)) return
    setSpecialties((prev) => [...prev, trimmed])
    setSpecialtyInput('')
  }

  function removeSpecialty(s: string) {
    setSpecialties((prev) => prev.filter((x) => x !== s))
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createTeacher({ ...values, specialties, schoolId })
    if (result.error) {
      setServerError(result.error)
      return
    }
    router.push('/admin/teachers?created=1')
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
            placeholder="João Silva"
            className={inputCls(!!errors.fullName)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Email" error={errors.email?.message}>
            <input
              {...register('email')}
              type="email"
              placeholder="joao@email.com"
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

      {/* Perfil profissional */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Perfil profissional
        </h2>

        {/* Especialidades */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#374151]">
            Especialidades
          </label>

          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ebf3ff] text-[#1a56db]"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(s)}
                    className="hover:text-[#ef4444] transition"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addSpecialty(specialtyInput) }
              }}
              placeholder="Digite e pressione Enter..."
              className={inputCls(false) + ' flex-1'}
            />
            <button
              type="button"
              onClick={() => addSpecialty(specialtyInput)}
              className="px-3 py-2 text-sm font-medium text-[#1a56db] border border-[#1a56db] rounded-lg hover:bg-[#ebf3ff] transition"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {SPECIALTY_SUGGESTIONS.filter((s) => !specialties.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSpecialty(s)}
                className="px-2 py-0.5 rounded-full text-xs text-[#64748b] border border-[#e2e8f0] hover:border-[#1a56db] hover:text-[#1a56db] transition"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <Field label="Bio" error={errors.bio?.message}>
          <textarea
            {...register('bio')}
            rows={3}
            placeholder="Breve descrição sobre o professor..."
            className={inputCls(false) + ' resize-none'}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar Professor'}
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
