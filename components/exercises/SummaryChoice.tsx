'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api, Task, Exercise } from '@/lib/api';
import AnswerFeedback from '@/components/RightAnswer';

interface Props {
  task: Task;
  exercise: Exercise;
  studentId: string;
  onComplete?: () => void;
  onBlankAnswer: (taskId: string, blankIndex: number, isCorrect: boolean) => void;
}

export default function SummaryChoice({ task, exercise, studentId, onComplete, onBlankAnswer }: Props) {
  // ---------- Memoised parsed data ----------
  const extraData = useMemo(() => {
    try {
      const parsed = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
      return {
        sentences: parsed.sentences || [],
        options: parsed.options || {},
      };
    } catch {
      return { sentences: [], options: {} };
    }
  }, [task.extra_data]);

  const correctAnswers = useMemo(() => {
    try {
      return typeof task.correct_answer === 'string'
        ? JSON.parse(task.correct_answer)
        : task.correct_answer || {};
    } catch {
      return {};
    }
  }, [task.correct_answer]);

  const totalBlanks = extraData.sentences.length;
  const storageKey = `task_choice_${task.id}_answers`;

  // ---------- State ----------
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeBlank, setActiveBlank] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<Record<number, string[]>>({});

  const isMounted = useRef(true);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Initialise
  useEffect(() => {
    isMounted.current = true;

    const shuffled: Record<number, string[]> = {};
    Object.keys(extraData.options).forEach((key) => {
      const idx = Number(key);
      shuffled[idx] = shuffleArray(extraData.options[idx] || []);
    });
    setShuffledOptions(shuffled);

    const saved = localStorage.getItem(storageKey);
    let loadedAnswers: Record<number, string> = {};
    if (saved) {
      try {
        loadedAnswers = JSON.parse(saved);
        setUserAnswers(loadedAnswers);
      } catch {}
    }

    const firstEmpty = extraData.sentences.findIndex((_, idx) => !loadedAnswers[idx]?.trim());
    setActiveBlank(firstEmpty !== -1 ? firstEmpty : null);

    return () => {
      isMounted.current = false;
    };
  }, [storageKey, extraData.sentences, extraData.options]);

  // Auto‑save
  useEffect(() => {
    if (!checked && isMounted.current) {
      localStorage.setItem(storageKey, JSON.stringify(userAnswers));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [userAnswers, checked, storageKey]);

  const findNextEmpty = (current: number): number | null => {
    for (let i = current + 1; i < totalBlanks; i++) {
      if (!userAnswers[i]) return i;
    }
    for (let i = 0; i < current; i++) {
      if (!userAnswers[i]) return i;
    }
    return null;
  };

  const handleBlankClick = (blankIndex: number) => {
    if (checked) return;
    if (userAnswers[blankIndex]) {
      const newAnswers = { ...userAnswers };
      delete newAnswers[blankIndex];
      setUserAnswers(newAnswers);
      setActiveBlank(blankIndex);
    } else {
      setActiveBlank(blankIndex);
    }
  };

  const handleOptionClick = (option: string) => {
    if (checked || activeBlank === null) return;

    const newAnswers = { ...userAnswers, [activeBlank]: option };
    setUserAnswers(newAnswers);

    const nextBlank = findNextEmpty(activeBlank);
    setActiveBlank(nextBlank);
  };

  const allFilled = extraData.sentences.every((_, idx) => userAnswers[idx]?.trim());

  const handleCheck = async () => {
    if (!allFilled || checked || isSubmitting) return;
    setIsSubmitting(true);

    const newResults = extraData.sentences.map(
      (_, idx) => userAnswers[idx] === correctAnswers[idx]
    );
    const allCorrect = newResults.every(Boolean);

    // Har bir blank natijasini parentga yuborish
    newResults.forEach((isCorrect, idx) => {
      onBlankAnswer(task.id, idx, isCorrect);
    });

    if (isMounted.current) {
      setResults(newResults);
      setIsCorrect(allCorrect);
      setChecked(true);
      setShowFeedback(true);
    }

    try {
      await api.postStudentAnswer({
        student_id: Number(studentId),
        unit_id: Number(exercise.unit_id),
        exercise_id: Number(exercise.id),
        task_id: Number(task.id),
        answer_text: JSON.stringify(userAnswers),
        q_type: exercise.type,
        is_correct: allCorrect,
        attempt_number: 1,
        is_completed: true,
      });
    } catch (err) {
      console.error('Failed to submit answer', err);
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (onComplete) onComplete();
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
    return `${base}/uploads/tasks/${path}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-28">
      <AnswerFeedback show={showFeedback} isCorrect={isCorrect} onNext={handleNext} />

      <div>
        <h2 className="text-xl font-bold text-gray-800">
          {task.question_text || 'Fill in the blanks using the given options.'}
        </h2>
        {!checked && activeBlank === null && allFilled && (
          <p className="text-sm text-gray-400 italic mt-1">All blanks filled! Ready to check.</p>
        )}
      </div>

      {task.photo && (
        <div className="flex justify-center">
          <img
            src={getMediaUrl(task.photo)}
            alt="Task"
            className="max-h-48 rounded-lg shadow-md object-contain"
          />
        </div>
      )}
      {task.audio && <audio controls src={getMediaUrl(task.audio)} className="w-full max-w-md mx-auto" />}
      {task.video && (
        <video controls src={getMediaUrl(task.video)} className="max-h-48 w-full max-w-md mx-auto" />
      )}

      <div className="space-y-4">
        {extraData.sentences.map((sentence, idx) => {
          const parts = sentence.split('___');
          const isActive = activeBlank === idx;
          const answer = userAnswers[idx];
          const isCorrectAnswer = checked ? results[idx] : null;

          return (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-base text-gray-800 flex-1 leading-relaxed">
                {parts.map((part, i) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < parts.length - 1 && (
                      <button
                        onClick={() => handleBlankClick(idx)}
                        disabled={checked}
                        className={`
                          mx-1 px-3 py-1 rounded-lg border-2 font-medium transition
                          min-w-[70px] text-center
                          ${
                            checked
                              ? isCorrectAnswer
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-red-500 bg-red-500 text-white'
                              : isActive
                              ? 'border-blue-500 bg-blue-100 text-blue-800'
                              : answer
                              ? 'border-gray-400 bg-white text-gray-800 cursor-pointer hover:border-blue-400'
                              : 'border-dashed border-gray-300 bg-gray-50 text-gray-500 cursor-pointer hover:border-blue-400'
                          }
                        `}
                      >
                        {answer || '_____'}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {!checked && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 flex justify-center">
              {activeBlank !== null ? (
                <div className="flex flex-wrap gap-3 justify-center">
                  {(shuffledOptions[activeBlank] || []).map((opt) => {
                    const isSelected = userAnswers[activeBlank] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(opt)}
                        className={`
                          px-5 py-2.5 rounded-full border-2 text-sm font-medium transition
                          ${
                            isSelected
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:shadow'
                          }
                        `}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center">
                  {allFilled ? 'All blanks filled! Ready to check.' : 'Click a blank to see its options.'}
                </p>
              )}
            </div>

            {allFilled && (
              <button
                onClick={handleCheck}
                disabled={isSubmitting}
                className="px-6 py-2 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition flex-shrink-0"
              >
                {isSubmitting ? '...' : 'CHECK'}
              </button>
            )}
          </div>
        </div>
      )}

      {checked && (
        <div className="text-center text-base font-semibold pt-2">
          You got {results.filter(Boolean).length} out of {totalBlanks} correct.
        </div>
      )}
    </div>
  );
}