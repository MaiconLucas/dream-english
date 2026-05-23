'use client'

import { useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; sent: number; errors: number; errorDetails?: string[] }
  | { status: 'error'; message: string }

type Feedback = {
  icon: React.ReactNode
  title: string
  detail: string
  style: string
}

function getFeedback(state: State): Feedback | null {
  if (state.status === 'success') {
    const { sent, errors } = state

    if (sent === 0 && errors === 0)
      return {
        icon: <Info size={15} />,
        title: 'Nenhum aviso enviado',
        detail: 'Não há parcelas pendentes com vencimento hoje ou em 3 dias, ou os lembretes de hoje já foram disparados.',
        style: 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b]',
      }

    if (errors === 0)
      return {
        icon: <CheckCircle size={15} />,
        title: `${sent} aviso${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''} com sucesso`,
        detail: `Os alunos com vencimento hoje ou em 3 dias foram notificados por e-mail.`,
        style: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      }

    if (sent === 0)
      return {
        icon: <AlertCircle size={15} />,
        title: `Falha ao enviar ${errors} aviso${errors !== 1 ? 's' : ''}`,
        detail: state.errorDetails?.join(' | ') ?? 'Verifique se os alunos têm e-mail cadastrado no perfil e se a chave do Resend está configurada corretamente.',
        style: 'bg-red-50 border-red-200 text-red-700',
      }

    return {
      icon: <AlertCircle size={15} />,
      title: `${sent} enviado${sent !== 1 ? 's' : ''}, ${errors} com falha`,
      detail: state.errorDetails?.join(' | ') ?? 'Alguns e-mails não foram entregues. Confira se todos os alunos têm e-mail cadastrado no perfil.',
      style: 'bg-amber-50 border-amber-200 text-amber-700',
    }
  }

  if (state.status === 'error')
    return {
      icon: <AlertCircle size={15} />,
      title: state.message,
      detail: 'Tente novamente. Se o erro persistir, verifique se você está autenticado como administrador.',
      style: 'bg-red-50 border-red-200 text-red-700',
    }

  return null
}

export default function SendRemindersButton() {
  const [state, setState] = useState<State>({ status: 'idle' })

  async function handleClick() {
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/emails/payment-reminder', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Erro ao enviar avisos' })
        return
      }
      setState({ status: 'success', sent: data.sent, errors: data.errors, errorDetails: data.errorDetails })
    } catch {
      setState({ status: 'error', message: 'Falha na conexão' })
    }
  }

  const feedback = getFeedback(state)

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleClick}
        disabled={state.status === 'loading'}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Bell size={15} />
        {state.status === 'loading' ? 'Enviando...' : 'Enviar avisos de vencimento'}
      </button>

      {feedback && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs max-w-xs ${feedback.style}`}>
          <span className="mt-0.5 shrink-0">{feedback.icon}</span>
          <div>
            <p className="font-medium leading-snug">{feedback.title}</p>
            <p className="opacity-80 mt-0.5 leading-snug">{feedback.detail}</p>
          </div>
        </div>
      )}
    </div>
  )
}
