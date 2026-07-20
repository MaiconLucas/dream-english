import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ReviewActions from './ReviewActions'

export default async function TeacherLessonReviewPage({ params }: { params: { classId: string; lessonId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: teacher } = await admin.from('teachers').select('id, school_id').eq('profile_id', user.id).single()
  if (!teacher) return null
  const { data: cls } = await admin.from('classes').select('id, module_id').eq('id', params.classId).eq('teacher_id', teacher.id).single()
  if (!cls) notFound()
  const { data: lesson } = await admin.from('course_lessons').select('*').eq('id', params.lessonId).eq('module_id', cls.module_id).eq('school_id', teacher.school_id).single()
  if (!lesson) notFound()
  const { data: questions } = await admin.from('lesson_questions').select('id, emoji, question, follow_up').eq('lesson_id', lesson.id).order('order_index')
  const theory = (lesson.theory ?? {}) as { explanation?: string; tip?: string }
  const activity = (lesson.activity ?? {}) as { title?: string; instructions?: string; examples?: string[] }

  return (
    <div>
      <Link href={`/teacher/classes/${params.classId}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] mb-6"><ChevronLeft size={15} /> Trilha da turma</Link>
      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        <main className="space-y-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6"><p className="text-xs font-semibold text-[#1a56db] mb-1">REVISÃO DO CONTEÚDO</p><h1 className="text-2xl font-bold text-[#0f172a]">{lesson.title}</h1><p className="text-sm text-[#64748b] mt-1">{lesson.grammar_focus}</p></div>
          <Section title="Objetivos">{(lesson.objectives ?? []).map((item: string) => <p key={item} className="text-sm text-[#374151] mb-1">• {item}</p>)}</Section>
          {theory.explanation && <Section title="Explicação"><p className="text-sm text-[#374151] whitespace-pre-wrap">{theory.explanation}</p>{theory.tip && <p className="text-sm bg-amber-50 text-amber-900 rounded-lg p-3 mt-3">Dica: {theory.tip}</p>}</Section>}
          {activity.title && <Section title="Atividade"><p className="font-medium text-sm">{activity.title}</p><p className="text-sm text-[#374151] mt-2 whitespace-pre-wrap">{activity.instructions}</p>{activity.examples?.map(x => <p key={x} className="text-sm text-[#64748b] mt-1">• {x}</p>)}</Section>}
          <Section title={`Perguntas de conversação (${questions?.length ?? 0})`}>{(questions ?? []).map((q, index) => <div key={q.id} className="py-3 border-b last:border-0 border-[#f1f5f9]"><p className="text-sm font-medium">{q.emoji ?? index + 1} {q.question}</p>{q.follow_up && <p className="text-xs text-[#64748b] mt-1">Continuação: {q.follow_up}</p>}</div>)}</Section>
          <Section title="Homework"><p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.homework_text || 'Nenhum homework cadastrado.'}</p></Section>
        </main>
        <ReviewActions lessonId={lesson.id} currentStatus={lesson.review_status} />
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="bg-white border border-[#e2e8f0] rounded-xl p-5"><h2 className="font-semibold text-[#0f172a] mb-3">{title}</h2>{children}</section>
}
