import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { submission_id } = await request.json()
    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: submission, error: subError } = await admin
      .from('hw_submissions')
      .select('id, content, homework_id')
      .eq('id', submission_id)
      .single()

    if (subError || !submission) {
      return NextResponse.json({ error: 'Submissão não encontrada' }, { status: 404 })
    }

    const { data: homework, error: hwError } = await admin
      .from('homework')
      .select('title, description, instructions')
      .eq('id', submission.homework_id)
      .single()

    if (hwError || !homework) {
      return NextResponse.json({ error: 'Homework não encontrado' }, { status: 404 })
    }

    const enunciado = [
      homework.description,
      homework.instructions ? `\nInstruções: ${homework.instructions}` : '',
    ].join('')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Você é um professor de inglês experiente. Corrija a seguinte atividade:

Enunciado: ${enunciado}
Resposta do aluno: ${submission.content ?? '(sem resposta)'}

Forneça:
1. Uma nota de 0 a 10
2. Feedback construtivo em português
3. Correções específicas dos erros encontrados
4. Pontos positivos da resposta

Responda SOMENTE em JSON válido, sem texto fora do JSON:
{ "grade": number, "feedback": string, "corrections": string, "positives": string }`,
        },
      ],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: { grade: number; feedback: string; corrections: string; positives: string }
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] ?? rawText)
    } catch {
      return NextResponse.json({ error: 'Erro ao parsear resposta da IA', raw: rawText }, { status: 500 })
    }

    const aiFeedbackText = [
      parsed.feedback,
      parsed.corrections ? `\n\nCorreções: ${parsed.corrections}` : '',
      parsed.positives ? `\n\nPontos positivos: ${parsed.positives}` : '',
    ].join('')

    const { error: updateError } = await admin
      .from('hw_submissions')
      .update({
        grade: parsed.grade,
        ai_feedback: aiFeedbackText,
        status: 'CORRECTED',
        corrected_at: new Date().toISOString(),
      })
      .eq('id', submission_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ grade: parsed.grade, feedback: aiFeedbackText })
  } catch (err) {
    console.error('[/api/homework/correct]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
