import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import DiaryClient from './DiaryClient'

export default async function TeacherDiaryPage({
  params,
}: {
  params: { classId: string; sessionId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: session } = await admin
    .from('class_sessions')
    .select('id, status, summary, meet_chat, conducted_at, lesson_id')
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  const { data: lesson } = await admin
    .from('course_lessons')
    .select('title, grammar_focus, objectives, theory, activity, homework_text')
    .eq('id', session.lesson_id)
    .single()

  const { data: studentRecords } = await admin
    .from('session_student_records')
    .select('student_id, attended, performance_note')
    .eq('session_id', params.sessionId)

  const { data: answers } = await admin
    .from('session_question_answers')
    .select('student_id, question_id, answer_text, teacher_feedback, score')
    .eq('session_id', params.sessionId)

  const questionIds = Array.from(new Set((answers ?? []).map((a: { question_id: string }) => a.question_id)))
  const { data: questions } = questionIds.length
    ? await admin.from('lesson_questions').select('id, question').in('id', questionIds)
    : { data: [] }

  const questionMap: Record<string, string> = {}
  for (const q of questions ?? []) questionMap[q.id] = q.question

  const answersByStudent: Record<string, {
    question_id: string
    question_text: string
    answer_text: string | null
    teacher_feedback: string | null
    score: number | null
  }[]> = {}
  for (const a of answers ?? []) {
    if (!answersByStudent[a.student_id]) answersByStudent[a.student_id] = []
    answersByStudent[a.student_id].push({
      question_id: a.question_id,
      question_text: questionMap[a.question_id] ?? '',
      answer_text: a.answer_text,
      teacher_feedback: a.teacher_feedback,
      score: a.score,
    })
  }

  const studentIds = (studentRecords ?? []).map((r: { student_id: string }) => r.student_id)
  const { data: studentData } = studentIds.length
    ? await admin
        .from('students')
        .select('id, profiles!profile_id(full_name)')
        .in('id', studentIds)
    : { data: [] }

  const nameMap: Record<string, string> = {}
  for (const s of studentData ?? []) {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
    nameMap[s.id] = (profile as { full_name: string } | null)?.full_name ?? 'Aluno'
  }

  const students = (studentRecords ?? []).map((r: {
    student_id: string
    attended: boolean
    performance_note: string | null
  }) => ({
    student_id: r.student_id,
    name: nameMap[r.student_id] ?? 'Aluno',
    attended: r.attended,
    performance_note: r.performance_note ?? '',
    answers: answersByStudent[r.student_id] ?? [],
  }))

  const initialData = {
    session: {
      id: session.id,
      status: session.status as 'draft' | 'published',
      summary: session.summary ?? '',
      meet_chat: session.meet_chat ?? '',
      conducted_at: session.conducted_at,
      lesson: lesson as {
        title: string
        grammar_focus?: string
        objectives?: string[]
        theory?: Record<string, unknown>
        activity?: Record<string, unknown>
        homework_text?: string
      } | null,
    },
    students,
  }

  return (
    <div>
      <Link
        href={`/teacher/classes/${params.classId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6"
      >
        <ChevronLeft size={15} />
        Trilha da Turma
      </Link>

      <DiaryClient sessionId={params.sessionId} liveHref={`/teacher/classes/${params.classId}/sessions/${params.sessionId}/live`} initialData={initialData} />
    </div>
  )
}
