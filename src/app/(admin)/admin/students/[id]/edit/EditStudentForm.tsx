'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, X, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { updateStudent, changeStudentPassword } from '../../actions'

const schema = z.object({
  fullName:         z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone:            z.string(),
  classId:          z.string(),
  level:            z.string(),
  active:           z.boolean(),
  enrollmentActive: z.boolean(),
  monthlyFee:       z.number().min(0),
  discountPercent:  z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
  firstDueDate:     z.string(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  studentId: string
  profileId: string
  schoolId:  string
  classes:   { id: string; name: string }[]
  defaults:  FormValues
}

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function EditStudentForm({ studentId, profileId, schoolId, classes, defaults }: Props) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // password modal state
  const [pwOpen, setPwOpen]         = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [pwLoading, setPwLoading]   = useState(false)
  const [pwError, setPwError]       = useState('')
  const [pwSuccess, setPwSuccess]   = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  const monthlyFee      = useWatch({ control, name: 'monthlyFee' }) ?? 0
  const discountPercent = useWatch({ control, name: 'discountPercent' }) ?? 0
  const finalAmount     = monthlyFee * (1 - discountPercent / 100)

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await updateStudent(studentId, profileId, schoolId, {
      fullName:         values.fullName,
      phone:            values.phone,
      classId:          values.classId,
      level:            values.level,
      active:           values.active,
      enrollmentActive: values.enrollmentActive,
      monthlyFeeCents:  Math.round(values.monthlyFee * 100),
      discountPercent:  values.discountPercent,
      firstDueDate:     values.firstDueDate,
    })
    if (result.error) {
      setServerError(result.error)
      return
    }
    setSuccess(true)
    router.push(`/admin/students/${studentId}`)
    router.refresh()
  }

  function closePwModal() {
    setPwOpen(false)
    setNewPassword('')
    setConfirmPassword('')
    setPwError('')
    setPwSuccess(false)
    setPwLoading(false)
    setShowPw(false)
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPassword.length < 6) { setPwError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (newPassword !== confirmPassword) { setPwError('As senhas não coincidem.'); return }
    setPwLoading(true)
    const result = await changeStudentPassword(profileId, newPassword)
    setPwLoading(false)
    if (result.error) { setPwError(result.error); return }
    setPwSuccess(true)
    setTimeout(closePwModal, 1800)
  }

  return (
    <>
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

        {/* Dados pessoais */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Dados pessoais
            </h2>
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] transition"
            >
              <KeyRound size={13} />
              Redefinir senha
            </button>
          </div>

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

            <Field label="1° Vencimento" error={errors.firstDueDate?.message}>
              <input
                {...register('firstDueDate')}
                type="date"
                className={inputCls(!!errors.firstDueDate)}
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
                <option value="">Sem turma</option>
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

          <div className="flex items-center gap-3">
            <input
              {...register('enrollmentActive')}
              type="checkbox"
              id="enrollmentActive"
              className="h-4 w-4 rounded border-[#e2e8f0] text-[#1a56db] focus:ring-[#1a56db]"
            />
            <label htmlFor="enrollmentActive" className="text-sm text-[#374151]">Matrícula ativa</label>
          </div>
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

      {/* Password modal */}
      {pwOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closePwModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#0f172a]">Redefinir senha do aluno</h2>
              <button onClick={closePwModal} className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition">
                <X size={16} />
              </button>
            </div>

            {pwSuccess ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 size={40} className="text-[#10b981] mb-3" />
                <p className="text-sm font-medium text-[#0f172a]">Senha alterada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">Confirmar nova senha</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                  />
                </div>

                {pwError && <p className="text-xs text-[#ef4444]">{pwError}</p>}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2.5 rounded-lg bg-[#1a56db] text-white text-sm font-medium hover:bg-[#1648c0] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {pwLoading ? <><Loader2 size={14} className="animate-spin" /> Salvando…</> : 'Salvar nova senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
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
