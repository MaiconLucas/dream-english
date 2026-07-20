import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { lessonId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: teacher } = await admin.from('teachers').select('id, school_id').eq('profile_id', user.id).single()
  if (!teacher) return NextResponse.json({ error: 'Professor não encontrado' }, { status: 403 })

  const body = await request.json() as { action?: 'approve' | 'request_changes'; note?: string }
  if (!['approve', 'request_changes'].includes(body.action ?? '')) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }
  if (body.action === 'request_changes' && !body.note?.trim()) {
    return NextResponse.json({ error: 'Descreva o que precisa ser revisado' }, { status: 400 })
  }

  const { data: targetLesson } = await admin.from('course_lessons').select('id, module_id')
    .eq('id', params.lessonId).eq('school_id', teacher.school_id).eq('status', 'PUBLISHED').single()
  if (!targetLesson) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })
  const { data: assignedClass } = await admin.from('classes').select('id').eq('teacher_id', teacher.id).eq('module_id', targetLesson.module_id).limit(1).maybeSingle()
  if (!assignedClass) return NextResponse.json({ error: 'Esta aula não pertence a uma turma sua' }, { status: 403 })

  const update = body.action === 'approve'
    ? { review_status: 'APPROVED', review_note: null, reviewed_by: teacher.id, reviewed_at: new Date().toISOString() }
    : { review_status: 'CHANGES_REQUESTED', review_note: body.note!.trim(), reviewed_by: teacher.id, reviewed_at: new Date().toISOString() }

  const { data: lesson, error } = await admin.from('course_lessons').update(update)
    .eq('id', params.lessonId).eq('school_id', teacher.school_id).eq('status', 'PUBLISHED')
    .select('id, review_status, review_note').single()
  if (error || !lesson) return NextResponse.json({ error: error?.message ?? 'Aula não encontrada' }, { status: 404 })
  return NextResponse.json({ lesson })
}
