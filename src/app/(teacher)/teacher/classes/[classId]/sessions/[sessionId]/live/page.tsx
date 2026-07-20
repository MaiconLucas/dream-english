import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import LiveLessonClient from './LiveLessonClient'

export default function LiveLessonPage({ params }: { params: { classId: string; sessionId: string } }) {
  return <div className="-m-6 md:-m-8 min-h-screen bg-slate-950 text-white">
    <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <Link href={`/teacher/classes/${params.classId}/sessions/${params.sessionId}`} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ChevronLeft size={16} /> Sair do modo aula</Link>
      <span className="text-xs font-semibold tracking-widest text-violet-300">DREAM ENGLISH • AO VIVO</span>
    </header>
    <LiveLessonClient sessionId={params.sessionId} />
  </div>
}
