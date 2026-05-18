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
  answers: string[];
  activeBlank: number;
  availableWords: string[];
}

export default function SummaryD({ task, exercise, studentId, onComplete, onBlankAnswer }: Props) {
  const extraData = JSON.parse(task.extra_data);
  const sentences: string[] = extraData.sentences;
  const allWords: string[] = (extraData.words as string[]).filter((w) => w && w.trim() !== '');
  const correctMap: Record<string, string> = JSON.parse(task.correct_answer);
  const totalBlanks = Object.keys(correctMap).length;
  const storageKey = `task_${task.id}_answers`;

  const stateRef = useRef<State>({
    answers: new Array(totalBlanks).fill(''),
    activeBlank: 0,
    availableWords: [],
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
    let initAnswers = new Array(totalBlanks).fill('');
    const pool = [...allWords];

    if (saved) {
      try {
        const parsed: string[] = JSON.parse(saved);
        if (parsed.length === totalBlanks) {
          initAnswers = parsed;
          parsed.forEach((w) => {
            if (w !== '') {
              const i = pool.indexOf(w);
              if (i !== -1) pool.splice(i, 1);
            }
          });
        }
      } catch { /* игнорируем */ }
    }

    const firstEmpty = initAnswers.findIndex((a) => a === '');
    stateRef.current = {
      answers: initAnswers,
      activeBlank: firstEmpty !== -1 ? firstEmpty : 0,
      availableWords: pool.sort(() => Math.random() - 0.5),
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

  const getNextEmpty = (answers: string[], afterIndex: number): number => {
    for (let i = afterIndex + 1; i < totalBlanks; i++) {
      if (answers[i] === '') return i;
    }
    for (let i = 0; i < afterIndex; i++) {
      if (answers[i] === '') return i;
    }
    return -1;
  };

  const handleBlankClick = (blankIdx: number) => {
    if (checked) return;
    const s = stateRef.current;
    if (s.answers[blankIdx] !== '') {
      const word = s.answers[blankIdx];
      const newAnswers = [...s.answers];
      newAnswers[blankIdx] = '';
      stateRef.current = {
        ...s,
        answers: newAnswers,
        activeBlank: blankIdx,
        availableWords: [...s.availableWords, word].sort(() => Math.random() - 0.5),
      };
    } else {
      stateRef.current = { ...s, activeBlank: blankIdx };
    }
    rerender();
  };

  const handleWordClick = (word: string) => {
    if (checked) return;
    const s = stateRef.current;
    let target = s.activeBlank;

    if (s.answers[target] !== '') {
      const emptyIdx = s.answers.findIndex((a) => a === '');
      if (emptyIdx === -1) return;
      target = emptyIdx;
    }

    const newAnswers = [...s.answers];
    newAnswers[target] = word;
    const newAvailable = [...s.availableWords];
    const idx = newAvailable.indexOf(word);
    if (idx !== -1) newAvailable.splice(idx, 1);
    const nextEmpty = getNextEmpty(newAnswers, target);

    stateRef.current = {
      answers: newAnswers,
      activeBlank: nextEmpty !== -1 ? nextEmpty : target,
      availableWords: newAvailable,
    };
    rerender();
  };

  const handleCheck = async () => {
    const s = stateRef.current;
    if (!s.answers.every((a) => a !== '') || checked || isSubmitting) return;

    setIsSubmitting(true);

    const answersObject: Record<string, string> = {};
    const newResults: boolean[] = [];

    for (let i = 0; i < totalBlanks; i++) {
      const answerValue = s.answers[i];
      answersObject[i.toString()] = answerValue;
      const isRight = answerValue === correctMap[i.toString()];
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

  const { answers, activeBlank, availableWords } = stateRef.current;
  const allFilled = answers.every((a) => a !== '');

  const renderSentences = () => {
    let blankCounter = 0;
    return sentences.map((sentence, sIdx) => {
      const parts = sentence.split(/(___)/g);
      return (
        <div key={sIdx} className="mb-5 text-lg leading-relaxed flex flex-wrap items-center gap-y-3">
          {parts.map((part, pIdx) => {
            if (part !== '___') {
              return <span key={`t-${sIdx}-${pIdx}`} className="text-gray-800">{part}</span>;
            }

            const blankIdx = blankCounter++;
            const answer = answers[blankIdx];
            const isActive = !checked && activeBlank === blankIdx;
            const res = results ? results[blankIdx] : null;

            let cls = '';
            if (checked) {
              cls = res
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-red-500 bg-red-500 text-white';
            } else if (isActive) {
              cls = 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-300 scale-105';
            } else if (answer) {
              cls = 'border-gray-400 bg-white text-gray-800';
            } else {
              cls = 'border-gray-300 bg-white text-gray-400';
            }

            return (
              <button
                key={`b-${sIdx}-${blankIdx}`}
                type="button"
                onClick={() => handleBlankClick(blankIdx)}
                disabled={checked}
                className={`
                  inline-flex items-center justify-center
                  min-w-[130px] mx-1.5 px-5 py-2.5
                  border-2 rounded-xl font-semibold text-sm
                  select-none transition-all duration-200 shadow-sm
                  ${cls}
                  ${!checked ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}
                `}
              >
                {answer ? (
                  <span>{answer}</span>
                ) : isActive ? (
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span
                      className="inline-block w-[2px] h-4 bg-blue-400 rounded-full"
                      style={{ animation: 'blink 1s ease-in-out infinite' }}
                    />
                    <span className="text-xs font-normal">select word</span>
                  </span>
                ) : (
                  <span className="text-gray-400">___</span>
                )}
              </button>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8 pb-24">
      <AnswerFeedback
        show={showFeedback}
        isCorrect={isCorrect}
        onNext={() => {
          setShowFeedback(false);
          if (onComplete) onComplete();
        }}
      />

      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{task.question_text}</h2>
        {!checked && (
          <p className="text-sm text-gray-500 italic">
            💡 Кликните слово → оно автоматически встанет в активный (синий) пропуск.
          </p>
        )}
      </div>

      {task.photo && (
        <div className="flex justify-center">
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/tasks/${task.photo}`}
            alt="Task"
            className="max-h-96 rounded-2xl shadow-lg object-contain"
          />
        </div>
      )}

      <div className="p-8 bg-gray-50 rounded-3xl shadow-inner">
        {renderSentences()}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b border-gray-200">
          ДОСТУПНЫЕ СЛОВА
        </h3>
        <div className="flex flex-wrap gap-3 min-h-[56px] items-center">
          {availableWords.filter((w) => w && w.trim() !== '').length === 0 && !checked && (
            <span className="text-gray-400 italic">Все слова использованы ✓</span>
          )}
          {availableWords.filter((w) => w && w.trim() !== '').map((word, idx) => (
            <button
              type="button"
              key={`aw-${word}-${idx}`}
              onClick={() => handleWordClick(word)}
              disabled={checked}
              className={`
                px-7 py-3 rounded-xl font-bold text-base select-none
                transition-all duration-150 border-2
                ${checked
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-blue-400 text-blue-700 shadow-md cursor-pointer hover:bg-blue-50 hover:shadow-lg hover:scale-105 active:scale-95'
                }
              `}
            >
              {word}
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