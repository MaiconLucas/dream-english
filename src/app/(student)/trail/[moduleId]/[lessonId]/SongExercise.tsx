'use client'

import { useState } from 'react'
import type { SongExercise } from '@/types/course'

export default function SongExerciseComponent({ exercise }: { exercise: SongExercise }) {
  const [answers, setAnswers] = useState<string[]>(exercise.verses.map(() => ''))
  const [checked, setChecked] = useState(false)

  if (!exercise.song_title) return null

  function isCorrect(i: number) {
    return answers[i].trim().toLowerCase() === exercise.verses[i].blank_word.toLowerCase()
  }

  const score = checked ? exercise.verses.filter((_, i) => isCorrect(i)).length : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div>
          <p className="text-sm font-semibold text-[#0f172a]">{exercise.song_title}</p>
          <p className="text-xs text-[#64748b]">{exercise.artist}</p>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        {exercise.verses.map((verse, i) => {
          const parts = verse.text.split('___')
          return (
            <div key={i} className="flex items-center flex-wrap gap-1.5 text-sm text-[#374151] leading-relaxed">
              {parts[0] && <span>{parts[0]}</span>}
              <input
                value={answers[i]}
                onChange={e => {
                  if (checked) return
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
                placeholder="___"
                className={`inline-block w-28 px-2 py-1 rounded-lg border text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] transition ${
                  !checked
                    ? 'border-[#e2e8f0] bg-white'
                    : isCorrect(i)
                    ? 'border-[#10b981] bg-[#ecfdf5] text-[#10b981] font-medium'
                    : 'border-[#ef4444] bg-red-50 text-[#ef4444]'
                }`}
              />
              {parts[1] && <span>{parts[1]}</span>}
              {checked && !isCorrect(i) && (
                <span className="text-xs font-semibold text-[#10b981] bg-[#ecfdf5] px-1.5 py-0.5 rounded">
                  {verse.blank_word}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {!checked ? (
        <button
          onClick={() => setChecked(true)}
          className="px-5 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          Verificar respostas
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${score === exercise.verses.length ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
            {score}/{exercise.verses.length} corretas
          </span>
          <button
            onClick={() => { setAnswers(exercise.verses.map(() => '')); setChecked(false) }}
            className="text-xs text-[#64748b] underline hover:text-[#0f172a] transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {exercise.discussion_questions?.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#f1f5f9]">
          <p className="text-xs font-semibold text-[#374151] mb-2">Discussão</p>
          <ul className="space-y-1.5">
            {exercise.discussion_questions.map((q, i) => (
              <li key={i} className="text-sm text-[#374151]">· {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
