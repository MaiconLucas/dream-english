import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

const SCHEMA_DESCRIPTION = `
{
  "title": "string — título da aula",
  "grammar_focus": "string — foco gramatical (ex: Verb To Be)",
  "duration_min": number — duração estimada em minutos (padrão 50),
  "cefr_level": "A1 | A1/A2 | A2 | A2/B1 | B1 | B1/B2 | B2 | C1",
  "objectives": ["string"] — lista de objetivos de aprendizagem,
  "theory": {
    "explanation": "string — explicação gramatical completa",
    "tip": "string — dica opcional",
    "headers": ["string", "string", "string"] — cabeçalhos da tabela (máx 3),
    "rows": [{"col1": "string", "col2": "string", "col3": "string"}] — linhas da tabela gramatical
  },
  "activity": {
    "type": "game | song",
    "title": "string — nome da atividade",
    "duration_min": number,
    "instructions": "string — como funciona",
    "examples": ["string"] — exemplos de uso
  },
  "song_exercise": {
    "song_title": "string",
    "artist": "string",
    "verses": [{"text": "string com ___ no lugar do blank", "blank_word": "string — a resposta"}],
    "discussion_questions": ["string"]
  },
  "homework_text": "string — tarefa de casa",
  "questions": [{"emoji": "string", "question": "string", "follow_up": "string"}]
}
`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json() as { text: string }
  if (!text?.trim()) return NextResponse.json({ error: 'Texto vazio' }, { status: 400 })

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Você é um assistente especializado em estruturar planos de aula de inglês.

Analise o texto abaixo e extraia todas as informações para preencher o JSON da aula.
Seja fiel ao conteúdo original — não invente informações que não estão no texto.
Se uma seção não estiver presente no texto, use string vazia ou array vazio.

Para o song_exercise: se houver exercício de fill-the-gap com uma música, extraia os versos substituindo a palavra-lacuna por ___ no campo "text" e coloque a resposta correta em "blank_word".

TEXTO DA AULA:
${text}

Responda SOMENTE com JSON válido, sem texto fora do JSON, seguindo exatamente esta estrutura:
${SCHEMA_DESCRIPTION}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text()

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'IA não retornou JSON válido' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json({ lesson: parsed })
  } catch (err) {
    console.error('[import-lesson]', err)
    return NextResponse.json({ error: 'Erro ao processar com IA' }, { status: 500 })
  }
}
