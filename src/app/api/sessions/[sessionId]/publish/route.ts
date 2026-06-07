import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: teacher } = await admin
      .from('teachers')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 403 })

    const { data: session } = await admin
      .from('class_sessions')
      .select('id, teacher_id, status')
      .eq('id', params.sessionId)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.teacher_id !== teacher.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await admin
      .from('class_sessions')
      .update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', params.sessionId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/sessions/[sessionId]/publish]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
