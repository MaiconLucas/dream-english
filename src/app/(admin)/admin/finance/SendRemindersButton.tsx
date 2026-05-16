'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; sent: number; errors: number }
  | { status: 'error'; message: string }

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
      setState({ status: 'success', sent: data.sent, errors: data.errors })
    } catch {
      setState({ status: 'error', message: 'Falha na conexão' })
    }
  }

  const feedback = (() => {
    if (state.status === 'success') {
      const { sent, errors } = state
      if (sent === 0 && errors === 0)
        return { text: 'Nenhum aviso pendente para hoje', color: 'text-[#64748b]' }
      if (errors === 0)
        return { text: `${sent} aviso${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''} com sucesso`, color: 'text-emerald-600' }
      if (sent === 0)
        return { text: `Falha ao enviar ${errors} aviso${errors !== 1 ? 's' : ''}`, color: 'text-red-600' }
      return { text: `${sent} enviado${sent !== 1 ? 's' : ''}, ${errors} com erro`, color: 'text-amber-600' }
    }
    if (state.status === 'error')
      return { text: state.message, color: 'text-red-600' }
    return null
  })()

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state.status === 'loading'}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Bell size={15} />
        {state.status === 'loading' ? 'Enviando...' : 'Enviar avisos de vencimento'}
      </button>
      {feedback && (
        <span className={`text-sm ${feedback.color}`}>{feedback.text}</span>
      )}
    </div>
  )
}
