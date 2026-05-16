'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteStudent } from './actions'

export default function DeleteStudentButton({
  studentId,
  profileId,
  studentName,
}: {
  studentId: string
  profileId: string
  studentName: string
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`Excluir "${studentName}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      const { error } = await deleteStudent(studentId, profileId)
      if (error) {
        alert(`Erro ao excluir: ${error}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef4444] hover:text-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      {isPending ? 'Excluindo…' : 'Excluir'}
    </button>
  )
}
