import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { class_id, lesson_id } = body as { class_id: string; lesson_id: string }
    if (!class_id || !lesson_id) {
      return NextResponse.json({ error: 'class_id and lesson_id are required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: teacher } = await admin
      .from('teachers')
      .select('id, school_id')
      .eq('profile_id', user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 403 })

    // Return existing session if already created
    const { data: existing } = await admin
      .from('class_sessions')
      .select('id')
      .eq('class_id', class_id)
      .eq('lesson_id', lesson_id)
      .maybeSingle()

    if (existing) return NextResponse.json({ sessionId: existing.id })

    const { data: session, error: sessionError } = await admin
      .from('class_sessions')
      .insert({
        school_id: teacher.school_id,
        class_id,
        lesson_id,
        teacher_id: teacher.id,
        status: 'draft',
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: sessionError?.message ?? 'Failed to create session' }, { status: 500 })
    }

    const { data: enrollments } = await admin
      .from('enrollments')
      .select('student_id')
      .eq('class_id', class_id)
      .eq('status', 'ACTIVE')

    const studentIds = (enrollments ?? []).map((e: { student_id: string }) => e.student_id)

    const { data: questions } = await admin
      .from('lesson_questions')
      .select('id')
      .eq('lesson_id', lesson_id)

    const questionIds = (questions ?? []).map((q: { id: string }) => q.id)

    if (studentIds.length > 0) {
      await admin.from('session_student_records').insert(
        studentIds.map((student_id: string) => ({
          school_id: teacher.school_id,
          session_id: session.id,
          student_id,
          attended: false,
        }))
      )

      if (questionIds.length > 0) {
        await admin.from('session_question_answers').insert(
          studentIds.flatMap((student_id: string) =>
            questionIds.map((question_id: string) => ({
              school_id: teacher.school_id,
              session_id: session.id,
              student_id,
              question_id,
            }))
          )
        )
      }
    }

    return NextResponse.json({ sessionId: session.id })
  } catch (err) {
    console.error('[POST /api/sessions]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
