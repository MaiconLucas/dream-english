'use client'

import { useRouter } from 'next/navigation'
import { deleteCourseModule, deleteCourseLesson } from './actions'

export function DeleteModuleButton({ moduleId }: { moduleId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return
    await deleteCourseModule(moduleId)
    router.push('/admin/course')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
    >
      Excluir
    </button>
  )
}

export function DeleteLessonButton({ lessonId, moduleId }: { lessonId: string; moduleId: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Excluir esta aula?')) return
    await deleteCourseLesson(lessonId, moduleId)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="px-2.5 py-1 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition"
    >
      Excluir
    </button>
  )
}
