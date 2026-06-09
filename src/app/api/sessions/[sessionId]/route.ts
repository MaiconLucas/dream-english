import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type Params = { params: { sessionId: string } }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: session, error: sessionError } = await admin
      .from('class_sessions')
      .select('id, status, summary, meet_chat, conducted_at, lesson_id')
      .eq('id', params.sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: lesson } = await admin
      .from('course_lessons')
      .select('title, grammar_focus, objectives, theory, activity, song_exercise, homework_text')
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

    // Get question texts
    const questionIds = Array.from(new Set((answers ?? []).map((a: { question_id: string }) => a.question_id)))
    const { data: questions } = questionIds.length
      ? await admin
          .from('lesson_questions')
          .select('id, question')
          .in('id', questionIds)
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

    // Get student names
    const studentIds = (studentRecords ?? []).map((r: { student_id: string }) => r.student_id)
    const { data: studentProfiles } = studentIds.length
      ? await admin
          .from('students')
          .select('id, profiles!profile_id(full_name)')
          .in('id', studentIds)
      : { data: [] }

    const nameMap: Record<string, string> = {}
    for (const s of studentProfiles ?? []) {
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

    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        summary: session.summary ?? '',
        meet_chat: session.meet_chat ?? '',
        conducted_at: session.conducted_at,
        lesson,
      },
      students,
    })
  } catch (err) {
    console.error('[GET /api/sessions/[sessionId]]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const body = await request.json() as {
      summary: string
      meet_chat: string
      students: {
        student_id: string
        attended: boolean
        performance_note: string
        answers: {
          question_id: string
          answer_text: string
          teacher_feedback: string
          score: number | null
        }[]
      }[]
    }

    const { data: session } = await admin
      .from('class_sessions')
      .select('id, school_id, status')
      .eq('id', params.sessionId)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.status === 'published') {
      return NextResponse.json({ error: 'Cannot edit published session' }, { status: 400 })
    }

    await admin
      .from('class_sessions')
      .update({ summary: body.summary, meet_chat: body.meet_chat, updated_at: new Date().toISOString() })
      .eq('id', params.sessionId)

    for (const student of body.students ?? []) {
      await admin.from('session_student_records').upsert({
        session_id: params.sessionId,
        student_id: student.student_id,
        school_id: session.school_id,
        attended: student.attended,
        performance_note: student.performance_note || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id,student_id' })

      for (const answer of student.answers ?? []) {
        await admin.from('session_question_answers').upsert({
          session_id: params.sessionId,
          student_id: student.student_id,
          question_id: answer.question_id,
          school_id: session.school_id,
          answer_text: answer.answer_text || null,
          teacher_feedback: answer.teacher_feedback || null,
          score: answer.score ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'session_id,student_id,question_id' })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/sessions/[sessionId]]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
