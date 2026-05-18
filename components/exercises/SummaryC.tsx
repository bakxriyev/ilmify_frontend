'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, Task, Exercise } from '@/lib/api';
import AnswerFeedback from '@/components/RightAnswer';

interface Props {
  task: Task;
  exercise: Exercise;
  studentId: string;
  onComplete?: () => void;
  onBlankAnswer: (taskId: string, blankIndex: number, isCorrect: boolean) => void;
}

interface State {
  answers: (string | null)[];
  activeBlank: number;
  availableParts: { text: string; originalIndex: number }[];
}

export default function SummaryC({ task, exercise, studentId, onComplete, onBlankAnswer }: Props) {
  const extraData = JSON.parse(task.extra_data);
  const parts: string[] = (extraData.parts as string[]).filter((p) => p && p.trim() !== '');
  const correctOrder: number[] = JSON.parse(task.correct_answer);
  const totalBlanks = parts.length;
  const storageKey = `task_c_${task.id}_answers`;

  const stateRef = useRef<State>({
    answers: new Array(totalBlanks).fill(null),
    activeBlank: 0,
    availableParts: parts.map((text, i) => ({ text, originalIndex: i })),
  });

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Загрузка из localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    let initAnswers: (string | null)[] = new Array(totalBlanks).fill(null);
    let usedIdx: number[] = [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === totalBlanks) {
          initAnswers = parsed;
          parsed.forEach((ans: string | null) => {
            if (ans !== null) {
              const i = parts.indexOf(ans);
              if (i !== -1) usedIdx.push(i);
            }
          });
        }
      } catch { /* игнорируем */ }
    }

    const remaining = parts
      .map((text, i) => ({ text, originalIndex: i }))
      .filter((p) => !usedIdx.includes(p.originalIndex));
    const firstEmpty = initAnswers.findIndex((a) => a === null);

    stateRef.current = {
      answers: initAnswers,
      activeBlank: firstEmpty !== -1 ? firstEmpty : 0,
      availableParts: remaining.sort(() => Math.random() - 0.5),
    };
    rerender();
  }, []);

  // Автосохранение
  useEffect(() => {
    if (checked) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(stateRef.current.answers));
    }
  });

  const getNextEmpty = (answers: (string | null)[], afterIndex: number): number => {
    for (let i = afterIndex + 1; i < totalBlanks; i++) {
      if (answers[i] === null) return i;
    }
    for (let i = 0; i < afterIndex; i++) {
      if (answers[i] === null) return i;
    }
    return -1;
  };

  const handleBlankClick = (blankIdx: number) => {
    if (checked) return;
    const s = stateRef.current;
    if (s.answers[blankIdx] !== null) {
      const text = s.answers[blankIdx] as string;
      const originalIndex = parts.indexOf(text);
      const newAnswers = [...s.answers];
      newAnswers[blankIdx] = null;
      stateRef.current = {
        ...s,
        answers: newAnswers,
        activeBlank: blankIdx,
        availableParts: [...s.availableParts, { text, originalIndex }].sort(() => Math.random() - 0.5),
      };
    } else {
      stateRef.current = { ...s, activeBlank: blankIdx };
    }
    rerender();
  };

  const handlePartClick = (partText: string, partOriginalIndex: number) => {
    if (checked) return;
    const s = stateRef.current;
    let target = s.activeBlank;

    if (s.answers[target] !== null) {
      const emptyIdx = s.answers.findIndex((a) => a === null);
      if (emptyIdx === -1) return;
      target = emptyIdx;
    }

    const newAnswers = [...s.answers];
    newAnswers[target] = partText;
    const newAvailable = s.availableParts.filter((p) => p.originalIndex !== partOriginalIndex);
    const nextEmpty = getNextEmpty(newAnswers, target);

    stateRef.current = {
      answers: newAnswers,
      activeBlank: nextEmpty !== -1 ? nextEmpty : target,
      availableParts: newAvailable,
    };
    rerender();
  };

  const handleCheck = async () => {
    const s = stateRef.current;
    if (s.answers.some((a) => a === null) || checked || isSubmitting) return;

    setIsSubmitting(true);

    const answersObject: Record<string, string> = {};
    const newResults: boolean[] = [];

    for (let i = 0; i < totalBlanks; i++) {
      const answerValue = s.answers[i] as string;
      answersObject[i.toString()] = answerValue;
      const correctText = parts[correctOrder[i]];
      const isRight = answerValue === correctText;
      newResults.push(isRight);
    }

    const allCorrect = newResults.every(Boolean);

    // Har bir blank natijasini parentga yuborish
    newResults.forEach((isCorrect, idx) => {
      onBlankAnswer(task.id, idx, isCorrect);
    });

    try {
      await api.postStudentAnswer({
        student_id: Number(studentId),
        unit_id: Number(exercise.unit_id),
        exercise_id: Number(exercise.id),
        task_id: Number(task.id),
        answer_text: JSON.stringify(answersObject),
        q_type: exercise.type,
        is_correct: allCorrect,
        attempt_number: 1,
        is_completed: true,
      });
    } catch (err) {
      console.error('❌ Ошибка отправки ответов:', err);
    }

    localStorage.removeItem(storageKey);

    setResults(newResults);
    setChecked(true);
    setIsSubmitting(false);
    setIsCorrect(allCorrect);
    setShowFeedback(true);
  };

  const { answers, activeBlank, availableParts } = stateRef.current;
  const allFilled = answers.every((a) => a !== null);

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10 pb-24">
      <AnswerFeedback
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={() => {
          setShowFeedback(false);
          if (onComplete) onComplete();
        }}
      />

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{task.question_text}</h2>
        {!checked && (
          <p className="text-sm text-gray-400 italic">
            💡 Кликните часть → она встанет в активный (синий) пропуск.
          </p>
        )}
      </div>

      {task.photo && (
        <div className="flex justify-center">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/tasks/${task.photo}`}
            alt="Task"
            className="max-h-80 rounded-2xl shadow-lg object-contain"
          />
        </div>
      )}

      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {answers.map((answer, blankIdx) => {
            const isActive = !checked && activeBlank === blankIdx;
            const res = results ? results[blankIdx] : null;

            let cls = '';
            if (checked) {
              cls = res
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-red-500 bg-red-500 text-white';
            } else if (isActive) {
              cls = 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200';
            } else if (answer !== null) {
              cls = 'border-gray-400 bg-white text-gray-800';
            } else {
              cls = 'border-gray-300 bg-gray-50 text-gray-400';
            }

            return (
              <button
                key={blankIdx}
                type="button"
                onClick={() => handleBlankClick(blankIdx)}
                disabled={checked}
                className={`
                  inline-flex items-center justify-center
                  min-w-[90px] px-4 py-2.5
                  border-2 rounded-xl font-semibold text-sm
                  select-none transition-all duration-200 shadow-sm
                  ${cls}
                  ${!checked ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                `}
              >
                {answer !== null ? (
                  <span>{answer}</span>
                ) : isActive ? (
                  <span
                    className="inline-block w-[2px] h-4 bg-blue-400 rounded-full"
                    style={{ animation: 'blink 1s ease-in-out infinite' }}
                  />
                ) : (
                  <span className="opacity-30">___</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-600 mb-3 uppercase tracking-wide">
          Доступные части
        </h3>
        <div className="flex flex-wrap gap-3 min-h-[60px] items-start">
          {availableParts.length === 0 && !checked && (
            <span className="text-gray-400 italic text-sm">Все части использованы ✓</span>
          )}
          {availableParts.map((part) => (
            <button
              type="button"
              key={`part-${part.originalIndex}`}
              onClick={() => handlePartClick(part.text, part.originalIndex)}
              disabled={checked}
              className={`
                px-5 py-3 rounded-2xl font-medium text-sm select-none
                transition-all duration-150 border
                ${checked
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-700 shadow-sm cursor-pointer hover:border-blue-400 hover:text-blue-700 hover:shadow-md hover:scale-105 active:scale-95'
                }
              `}
            >
              {part.text}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allFilled || checked || isSubmitting}
          className={`
            px-12 py-4 rounded-2xl font-black text-xl text-white
            transition-all duration-200
            ${!allFilled || checked || isSubmitting
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 shadow-xl hover:scale-105 active:scale-95'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              ОТПРАВКА...
            </span>
          ) : 'ПРОВЕРИТЬ'}
        </button>
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}