'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { updateCourseModule } from '../../actions'

const CEFR_LEVELS = ['A1', 'A1/A2', 'A2', 'A2/B1', 'B1', 'B1/B2', 'B2', 'C1']

type Mod = {
  id: string
  title: string
  description: string | null
  cefr_level: string
  order_index: number
  is_published: boolean
}

export default function EditCourseModuleForm({ mod }: { mod: Mod }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isPublished, setIsPublished] = useState(mod.is_published)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('is_published', isPublished ? 'true' : 'false')
    const result = await updateCourseModule(null, fd)
    setSaving(false)
    if (result?.error) { setError(result.error); return }
    router.push(`/admin/course/${mod.id}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl">
      <Link href={`/admin/course/${mod.id}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Voltar
      </Link>

      <h1 className="text-xl font-bold text-[#0f172a] mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Editar Módulo
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 space-y-5">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
        )}

        <input type="hidden" name="id" value={mod.id} />

        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">Título *</label>
          <input
            name="title"
            required
            defaultValue={mod.title}
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#374151] mb-1.5">Descrição</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={mod.description ?? ''}
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Nível CEFR *</label>
            <select
              name="cefr_level"
              defaultValue={mod.cefr_level}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"
            >
              {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">Ordem (0 = primeiro)</label>
            <input
              name="order_index"
              type="number"
              min={0}
              defaultValue={mod.order_index}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded border-[#e2e8f0] text-[#1a56db] focus:ring-[#1a56db]"
          />
          <span className="text-sm text-[#374151]">Publicado</span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          Salvar Alterações
        </button>
      </form>
    </div>
  )
}
