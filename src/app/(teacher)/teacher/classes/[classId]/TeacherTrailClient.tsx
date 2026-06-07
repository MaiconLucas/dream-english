'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react'

type Lesson = {
  id: string
  title: string
  grammar_focus: string | null
  duration_min: number
  order_index: number
}

type SessionInfo = { id: string; status: string }

function statusBadge(session: SessionInfo | undefined) {
  if (!session) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b]">
        Não iniciada
      </span>
    )
  }
  if (session.status === 'published') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#ecfdf5] text-[#10b981]">
        <CheckCircle size={11} />
        Publicada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-[#f59e0b]">
      <FileText size={11} />
      Rascunho
    </span>
  )
}

export default function TeacherTrailClient({
  classId,
  lessons,
  sessionMap,
}: {
  classId: string
  lessons: Lesson[]
  sessionMap: Record<string, SessionInfo>
}) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function openLesson(lessonId: string) {
    // If session already exists, navigate directly
    const existing = sessionMap[lessonId]
    if (existing) {
      router.push(`/teacher/classes/${classId}/sessions/${existing.id}`)
      return
    }

    setLoadingId(lessonId)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classId, lesson_id: lessonId }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Erro: ${data.error ?? 'Falha ao criar sessão'}`)
        return
      }
      router.push(`/teacher/classes/${classId}/sessions/${data.sessionId}`)
    } catch {
      alert('Erro de conexão')
    } finally {
      setLoadingId(null)
    }
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-[#e2e8f0]">
        <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
        <p className="text-sm text-[#64748b]">Nenhuma aula publicada neste módulo ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson, index) => {
        const session = sessionMap[lesson.id]
        const isLoading = loadingId === lesson.id

        return (
          <button
            key={lesson.id}
            onClick={() => openLesson(lesson.id)}
            disabled={isLoading}
            className="w-full text-left bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#1a56db] transition disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#ebf3ff]">
                {isLoading ? (
                  <Loader2 size={15} className="text-[#1a56db] animate-spin" />
                ) : (
                  <span className="text-sm font-semibold text-[#1a56db]">{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{lesson.title}</p>
                {lesson.grammar_focus && (
                  <p className="text-xs text-[#64748b] truncate mt-0.5">{lesson.grammar_focus}</p>
                )}
                <span className="flex items-center gap-1 text-[10px] text-[#94a3b8] mt-1">
                  <Clock size={10} />{lesson.duration_min} min
                </span>
              </div>

              {statusBadge(session)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
