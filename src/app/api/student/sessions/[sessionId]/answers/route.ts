import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const admin = createAdminClient()
  const { data: student } = await admin.from('students').select('id, school_id').eq('profile_id', user.id).single()
  if (!student) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 403 })
  const { data: record } = await admin.from('session_student_records').select('session_id').eq('session_id', params.sessionId).eq('student_id', student.id).single()
  if (!record) return NextResponse.json({ error: 'Esta aula não pertence ao aluno' }, { status: 403 })
  const body = await request.json() as { question_id?: string; answer_text?: string }
  if (!body.question_id) return NextResponse.json({ error: 'Pergunta obrigatória' }, { status: 400 })
  const { error } = await admin.from('session_question_answers').update({ answer_text: body.answer_text?.trim() || null, updated_at: new Date().toISOString() })
    .eq('session_id', params.sessionId).eq('student_id', student.id).eq('question_id', body.question_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await admin.from('session_student_records').update({ attended: true, updated_at: new Date().toISOString() }).eq('session_id', params.sessionId).eq('student_id', student.id)
  return NextResponse.json({ ok: true })
}
