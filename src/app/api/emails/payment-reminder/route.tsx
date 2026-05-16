import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PaymentReminderEmail } from '@emails/PaymentReminderEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

function getTodayBRT(): string {
  // Brazil Standard Time = UTC-3
  const brtMs = Date.now() - 3 * 60 * 60 * 1000
  return new Date(brtMs).toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

async function sendPaymentReminders(
  schoolId?: string
): Promise<{ sent: number; errors: number }> {
  const admin = createAdminClient()

  const todayBRT = getTodayBRT()
  const threeDaysLater = addDays(todayBRT, 3)

  // Deduplication: skip payments already reminded today (UTC midnight boundary)
  const todayUTCMidnight = new Date()
  todayUTCMidnight.setUTCHours(0, 0, 0, 0)
  const todayUTCStr = todayUTCMidnight.toISOString()

  let query = admin
    .from('payments')
    .select('id, amount_cents, due_date, reference_month, student_id')
    .eq('status', 'PENDING')
    .in('due_date', [todayBRT, threeDaysLater])
    .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${todayUTCStr}`)

  if (schoolId) {
    query = query.eq('school_id', schoolId)
  }

  const { data: payments, error: queryError } = await query

  if (queryError) {
    console.error('[PaymentReminder] Query error:', queryError.message)
    return { sent: 0, errors: 1 }
  }

  if (!payments?.length) return { sent: 0, errors: 0 }

  // Build student_id → profile mapping (same pattern as finance page)
  const studentIds = Array.from(new Set(payments.map((p) => p.student_id as string)))

  const { data: students } = await admin
    .from('students')
    .select('id, profile_id')
    .in('id', studentIds)

  const profileIds = Array.from(
    new Set(
      (students ?? []).map((s) => s.profile_id as string).filter(Boolean)
    )
  )

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', profileIds)

  const studentToProfileId = new Map(
    (students ?? []).map((s) => [s.id as string, s.profile_id as string])
  )
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as { id: string; full_name: string; email: string }])
  )

  let sent = 0
  let errors = 0

  for (const payment of payments) {
    const profileId = studentToProfileId.get(payment.student_id as string)
    const profile = profileId ? profileMap.get(profileId) : null

    if (!profile?.email) {
      console.error(
        `[PaymentReminder] No email found for student ${payment.student_id}`
      )
      errors++
      continue
    }

    const daysUntilDue: 0 | 3 =
      (payment.due_date as string) === todayBRT ? 0 : 3

    try {
      const { error: emailError } = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ??
          'Dream English School <onboarding@resend.dev>',
        to: [profile.email],
        subject:
          daysUntilDue === 0
            ? 'Sua parcela vence hoje — Dream English School'
            : 'Sua parcela vence em 3 dias — Dream English School',
        react: (
          <PaymentReminderEmail
            studentName={profile.full_name}
            amount={payment.amount_cents as number}
            dueDate={formatDateBR(payment.due_date as string)}
            daysUntilDue={daysUntilDue}
          />
        ),
      })

      if (emailError) {
        console.error(
          `[PaymentReminder] Resend error for ${profile.email}:`,
          emailError
        )
        errors++
        continue
      }

      await admin
        .from('payments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', payment.id)

      sent++
    } catch (err) {
      console.error(
        `[PaymentReminder] Failed to send to ${profile.email}:`,
        err
      )
      errors++
    }
  }

  return { sent, errors }
}

// GET — Vercel Cron (runs for all schools)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendPaymentReminders()
  return NextResponse.json(result)
}

// POST — Manual admin trigger (runs for the authenticated admin's school only)
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, school_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const result = await sendPaymentReminders(profile.school_id as string)
  return NextResponse.json(result)
}
