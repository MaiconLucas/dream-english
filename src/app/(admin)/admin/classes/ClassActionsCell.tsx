'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Trash2, PowerOff, Power, Loader2 } from 'lucide-react'
import { toggleClassActive, deleteClass } from './actions'

export default function ClassActionsCell({
  classId,
  className,
  active,
}: {
  classId: string
  className: string
  active: boolean
}) {
  const [isPendingToggle, startToggle] = useTransition()
  const [isPendingDelete, startDelete] = useTransition()
  const router = useRouter()

  function handleToggle() {
    const action = active ? 'inativar' : 'ativar'
    if (!confirm(`Deseja ${action} a turma "${className}"?`)) return
    startToggle(async () => {
      const { error } = await toggleClassActive(classId, !active)
      if (error) alert(`Erro: ${error}`)
      else router.refresh()
    })
  }

  function handleDelete() {
    if (
      !confirm(
        `Excluir a turma "${className}"?\n\nIsso removerá todas as matrículas, aulas e registros de presença vinculados. Esta ação não pode ser desfeita.`,
      )
    )
      return
    startDelete(async () => {
      const { error } = await deleteClass(classId)
      if (error) alert(`Erro ao excluir: ${error}`)
      else router.refresh()
    })
  }

  const busy = isPendingToggle || isPendingDelete

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/classes/${classId}/edit`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] transition"
      >
        <Pencil size={13} />
        Editar
      </Link>

      <button
        onClick={handleToggle}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
          active
            ? 'text-[#f59e0b] hover:text-[#d97706]'
            : 'text-[#10b981] hover:text-[#059669]'
        }`}
      >
        {isPendingToggle ? (
          <Loader2 size={13} className="animate-spin" />
        ) : active ? (
          <PowerOff size={13} />
        ) : (
          <Power size={13} />
        )}
        {isPendingToggle ? 'Aguarde…' : active ? 'Inativar' : 'Ativar'}
      </button>

      <button
        onClick={handleDelete}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ef4444] hover:text-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isPendingDelete ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        {isPendingDelete ? 'Excluindo…' : 'Excluir'}
      </button>
    </div>
  )
}
