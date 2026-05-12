'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { completeLesson } from '../../actions'

export default function CompleteButton({
  lessonId,
  moduleId,
  completed,
}: {
  lessonId: string
  moduleId: string
  completed: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(completed)

  async function handleComplete() {
    setLoading(true)
    const result = await completeLesson(lessonId, moduleId)
    setLoading(false)
    if (!result?.error) setDone(true)
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-2 py-3.5 bg-[#ecfdf5] border border-[#bbf7d0] rounded-xl text-[#10b981] text-sm font-semibold">
        <CheckCircle size={18} />
        Aula concluída!
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#1a56db] text-white text-sm font-semibold rounded-xl hover:bg-[#1648c0] disabled:opacity-60 transition"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
      Marcar aula como concluída
    </button>
  )
}
