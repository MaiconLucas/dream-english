// ============================================================
// Tipos: Módulos e Lições (conteúdo da trilha de aprendizado)
// ============================================================

export type LessonStatus = 'DRAFT' | 'PUBLISHED'
export type CefrLevel = 'A1' | 'A1/A2' | 'A2' | 'A2/B1' | 'B1' | 'B1/B2' | 'B2' | 'C1'

// Linha da tabela de teoria gramatical
export interface TheoryRow {
  col1: string
  col2: string
  col3?: string
}

// Bloco de teoria da lição
export interface LessonTheory {
  explanation: string
  tip?: string
  headers?: string[]
  rows: TheoryRow[]
}

// Atividade (jogo ou exercício)
export interface LessonActivity {
  type: 'game' | 'song'
  title: string
  duration_min: number
  instructions: string
  examples: string[]
}

// Verso do exercício de música
export interface SongVerse {
  text: string        // texto com ___ onde vai a lacuna
  blank_word: string  // resposta correta
}

// Exercício de música com lacunas
export interface SongExercise {
  song_title: string
  artist: string
  verses: SongVerse[]
  discussion_questions: string[]
}

// Pergunta de conversação
export interface LessonQuestion {
  id: string
  school_id: string
  lesson_id: string
  order_index: number
  emoji?: string
  question: string
  follow_up?: string
  created_at: string
}

// Módulo (ex: Foundation — Earth)
export interface CourseModule {
  id: string
  school_id: string
  title: string
  description?: string
  cefr_level: CefrLevel
  order_index: number
  is_published: boolean
  created_by?: string
  created_at: string
  updated_at: string
  // joins opcionais
  lessons?: CourseLessonSummary[]
}

// Lição completa
export interface CourseLesson {
  id: string
  school_id: string
  module_id: string
  teacher_id?: string
  order_index: number
  status: LessonStatus
  title: string
  grammar_focus?: string
  duration_min: number
  cefr_level: CefrLevel
  objectives: string[]
  theory: LessonTheory
  activity: LessonActivity
  song_exercise: SongExercise
  homework_text?: string
  created_at: string
  updated_at: string
  // joins opcionais
  questions?: LessonQuestion[]
}

// Resumo da lição para listagens e trilha
export interface CourseLessonSummary {
  id: string
  module_id: string
  order_index: number
  status: LessonStatus
  title: string
  grammar_focus?: string
  duration_min: number
  cefr_level: CefrLevel
}

// Progresso do aluno em uma lição
export interface LessonProgress {
  id: string
  school_id: string
  student_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

// Trilha do aluno: lição + estado de progresso
export interface StudentTrailLesson extends CourseLessonSummary {
  progress?: LessonProgress
  is_unlocked: boolean  // calculado no cliente: completed anterior = true
}
