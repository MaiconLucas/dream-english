'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClass } from '../actions'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_PT: Record<string, string> = {
  Monday: 'Seg', Tuesday: 'Ter', Wednesday: 'Qua',
  Thursday: 'Qui', Friday: 'Sex', Saturday: 'Sáb', Sunday: 'Dom',
}
const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  teacherId: z.string(),
  level: z.string(),
  maxStudents: z.number().int().min(1, 'Capacidade mínima é 1'),
  active: z.boolean(),
  scheduleDays: z.array(z.string()),
  scheduleTime: z.string(),
  scheduleDuration: z.number().int().min(1, 'Duração mínima é 1 minuto'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  schoolId: string
  teachers: { id: string; name: string }[]
}

export default function NewClassForm({ schoolId, teachers }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      teacherId: '',
      level: '',
      maxStudents: 10,
      active: true,
      scheduleDays: [],
      scheduleTime: '',
      scheduleDuration: 60,
    },
  })

  const selectedDays = watch('scheduleDays')

  function toggleDay(day: string) {
    const current = selectedDays ?? []
    setValue(
      'scheduleDays',
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
      { shouldValidate: true }
    )
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await createClass({
      name: values.name,
      teacherId: values.teacherId,
      level: values.level,
      maxStudents: values.maxStudents,
      active: values.active,
      schedule: {
        days: values.scheduleDays,
        time: values.scheduleTime,
        duration: values.scheduleDuration,
      },
      schoolId,
    })
    if (result.error) { setServerError(result.error); return }
    router.push('/admin/classes?created=1')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444]">
          {serverError}
        </div>
      )}

      {/* Dados gerais */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Dados gerais
        </h2>

        <Field label="Nome da turma" error={errors.name?.message}>
          <input
            {...register('name')}
            type="text"
            placeholder="Ex: Turma A — Básico"
            className={inputCls(!!errors.name)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Professor" error={errors.teacherId?.message}>
            <select {...register('teacherId')} className={inputCls(!!errors.teacherId)}>
              <option value="">Sem professor</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
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

        <Field label="Capacidade máxima" error={errors.maxStudents?.message}>
          <input
            {...register('maxStudents', { valueAsNumber: true })}
            type="number"
            min={1}
            className={inputCls(!!errors.maxStudents) + ' max-w-[160px]'}
          />
        </Field>

        <div className="flex items-center gap-3">
          <input
            {...register('active')}
            type="checkbox"
            id="active"
            className="h-4 w-4 rounded border-[#e2e8f0] text-[#1a56db] focus:ring-[#1a56db]"
          />
          <label htmlFor="active" className="text-sm text-[#374151]">Turma ativa</label>
        </div>
      </div>

      {/* Horário */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Horário
        </h2>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#374151]">Dias da semana</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = (selectedDays ?? []).includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    selected
                      ? 'bg-[#1a56db] text-white border-[#1a56db]'
                      : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#1a56db] hover:text-[#1a56db]'
                  }`}
                >
                  {DAY_PT[day]}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Horário de início" error={errors.scheduleTime?.message}>
            <input
              {...register('scheduleTime')}
              type="time"
              className={inputCls(!!errors.scheduleTime)}
            />
          </Field>

          <Field label="Duração (minutos)" error={errors.scheduleDuration?.message}>
            <input
              {...register('scheduleDuration', { valueAsNumber: true })}
              type="number"
              min={1}
              className={inputCls(!!errors.scheduleDuration)}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
        >
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar Turma'}
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
