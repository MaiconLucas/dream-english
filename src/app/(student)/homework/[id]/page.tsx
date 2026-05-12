'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, Send, Loader2, CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'

type Homework = {
  id: string
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  module_id: string | null
}

type Submission = {
  id: string
  content: string | null
  status: string
  grade: number | null
  ai_feedback: string | null
  corrected_at: string | null
}

type PageState = 'loading' | 'pending' | 'submitted' | 'reviewing' | 'done' | 'error'

export default function HomeworkAnswerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [hw, setHw] = useState<Homework | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [answer, setAnswer] = useState('')
  const [pageState, setPageState] = useState<PageState>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [feedback, setFeedback] = useState<{ grade: number; feedback: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: hwData } = await supabase
        .from('homework')
        .select('id, title, description, instructions, due_date, module_id')
        .eq('id', params.id)
        .single()

      if (!hwData) { setPageState('error'); setErrorMsg('Atividade não encontrada.'); return }
      setHw(hwData as Homework)

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!studentData) { setPageState('error'); setErrorMsg('Perfil de aluno não encontrado.'); return }

      const { data: sub } = await supabase
        .from('hw_submissions')
        .select('id, content, status, grade, ai_feedback, corrected_at')
        .eq('homework_id', params.id)
        .eq('student_id', studentData.id)
        .maybeSingle()

      if (sub) {
        setSubmission(sub as Submission)
        if (sub.status === 'CORRECTED' && sub.ai_feedback) {
          setFeedback({ grade: sub.grade ?? 0, feedback: sub.ai_feedback })
          setPageState('done')
        } else if (sub.status === 'SUBMITTED') {
          setPageState('submitted')
        } else {
          setPageState('pending')
          setAnswer(sub.content ?? '')
        }
      } else {
        setPageState('pending')
      }
    }
    load()
  }, [params.id, router])

  async function handleSubmit() {
    if (!answer.trim() || !hw) return
    setPageState('reviewing')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: studentData } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single()
    if (!studentData) return

    // Upsert submission
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single()

    const upsertPayload = {
      homework_id: hw.id,
      student_id: studentData.id,
      school_id: (profile as { school_id: string } | null)?.school_id ?? '',
      content: answer.trim(),
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
    }

    const { data: sub, error: subError } = submission
      ? await supabase.from('hw_submissions').update(upsertPayload).eq('id', submission.id).select('id').single()
      : await supabase.from('hw_submissions').insert(upsertPayload).select('id').single()

    if (subError || !sub) {
      setPageState('error')
      setErrorMsg('Erro ao salvar resposta: ' + (subError?.message ?? 'unknown'))
      return
    }

    // Call AI correction API
    try {
      const res = await fetch('/api/homework/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: sub.id }),
      })
      const data = await res.json()
      if (res.ok && data.grade !== undefined) {
        setFeedback({ grade: data.grade, feedback: data.feedback })
        setPageState('done')
      } else {
        setPageState('submitted')
      }
    } catch {
      setPageState('submitted')
    }
  }

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#1a56db]" />
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="text-center py-16">
        <p className="text-[#ef4444] text-sm">{errorMsg}</p>
        <Link href="/trail" className="text-xs text-[#1a56db] mt-2 inline-block">Voltar para Trilha</Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/trail" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Voltar para Trilha
      </Link>

      {/* Homework card */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 mb-6">
        <h1 className="text-xl font-bold text-[#0f172a] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {hw?.title}
        </h1>
        {hw?.description && (
          <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{hw.description}</p>
        )}
        {hw?.instructions && (
          <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
            <p className="text-xs font-medium text-[#64748b] mb-1">Instruções</p>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{hw.instructions}</p>
          </div>
        )}
      </div>

      {/* Answer / feedback */}
      {pageState === 'done' && feedback ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#bbf7d0] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={20} className="text-[#10b981]" />
              <h2 className="text-sm font-semibold text-[#0f172a]">Atividade corrigida pela IA</h2>
              <div className="ml-auto flex items-center gap-1.5 bg-[#ecfdf5] px-3 py-1 rounded-full">
                <Star size={13} className="text-[#f59e0b] fill-[#f59e0b]" />
                <span className="text-sm font-bold text-[#0f172a]">{feedback.grade}/10</span>
              </div>
            </div>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{feedback.feedback}</p>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <p className="text-xs font-medium text-[#64748b] mb-2">Sua resposta</p>
            <p className="text-sm text-[#374151] whitespace-pre-wrap">{answer || submission?.content}</p>
          </div>
        </div>
      ) : pageState === 'submitted' ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 text-center">
          <CheckCircle size={32} className="mx-auto text-[#10b981] mb-3" />
          <p className="text-sm font-semibold text-[#0f172a]">Resposta enviada!</p>
          <p className="text-xs text-[#64748b] mt-1">Aguardando correção da IA...</p>
        </div>
      ) : pageState === 'reviewing' ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          <div className="mb-4">
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Sua resposta</label>
            <div className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#374151] min-h-[120px] whitespace-pre-wrap">
              {answer}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <Loader2 size={16} className="animate-spin text-[#1a56db]" />
            Corrigindo com IA...
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          <label className="block text-xs font-medium text-[#374151] mb-1.5">Sua resposta</label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="Digite sua resposta aqui..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition resize-y"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-[#94a3b8]">{answer.trim().length > 0 ? `${answer.length} caracteres` : 'Escreva sua resposta'}</span>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-50 transition"
            >
              <Send size={14} />
              Enviar resposta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
