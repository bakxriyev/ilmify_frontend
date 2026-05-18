'use client';

import React, { useState, useEffect } from 'react';
import { api, Task, Exercise } from '@/lib/api';
import AnswerFeedback from '@/components/RightAnswer';

interface Props {
  task: Task;
  exercise: Exercise;
  studentId: string;
  onComplete?: () => void;
  onBlankAnswer: (taskId: string, blankIndex: number, isCorrect: boolean) => void;
}

export default function SummaryIng({
  task,
  exercise,
  studentId,
  onComplete,
  onBlankAnswer,
}: Props) {
  // ---------- Parse task data ----------
  const sentences = (() => {
    try {
      const parsed = typeof task.extra_data === 'string'
        ? JSON.parse(task.extra_data)
        : task.extra_data;
      return parsed.sentences || [];
    } catch {
      return [];
    }
  })();

  const correctAnswers = (() => {
    try {
      const ca = task.correct_answer;
      if (typeof ca === 'string') {
        try {
          const parsed = JSON.parse(ca);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [ca];
        }
      }
      return [];
    } catch {
      return [];
    }
  })();

  const [userAnswers, setUserAnswers] = useState<string[]>(() =>
    sentences.map(() => '')
  );
  const [checkedBlanks, setCheckedBlanks] = useState<boolean[]>(() =>
    sentences.map(() => false)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allCorrect, setAllCorrect] = useState(false);

  const storageKey = `task_ing_${task.id}_answers`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setUserAnswers(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved answers', e);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (!checkedBlanks.every(Boolean)) {
      localStorage.setItem(storageKey, JSON.stringify(userAnswers));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [userAnswers, checkedBlanks, storageKey]);

  const normalise = (str: string): string => {
    return str.trim().replace(/\s+/g, ' ').toLowerCase();
  };

  const handleCheck = async () => {
    if (isSubmitting) return;

    const correctArray = sentences.map((_: any, idx: number) => {
      const userAns = userAnswers[idx] || '';
      const correctAns = correctAnswers[idx] || '';
      return normalise(userAns) === normalise(correctAns);
    });

    const allBlanksCorrect = correctArray.every(Boolean);
    setAllCorrect(allBlanksCorrect);
    setCheckedBlanks(sentences.map(() => true));
    setShowFeedback(true);
    setIsSubmitting(true);

    correctArray.forEach((isCorrect, idx) => {
      onBlankAnswer(task.id, idx, isCorrect);
    });

    try {
      await api.postStudentAnswer({
        student_id: Number(studentId),
        unit_id: Number(exercise.unit_id),
        exercise_id: Number(exercise.id),
        task_id: Number(task.id),
        answer_text: JSON.stringify({ answers: userAnswers }),
        q_type: exercise.type,
        is_correct: allBlanksCorrect,
        attempt_number: 1,
        is_completed: true,
      });
    } catch (err) {
      console.error('Failed to submit answer', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (onComplete) onComplete();
  };

  const getMediaUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return `${base}/uploads/tasks/${path}`;
  };

  const allFilled = userAnswers.every((ans) => ans.trim().length > 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-28">
      <AnswerFeedback show={showFeedback} isCorrect={allCorrect} onNext={handleNext} />

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-800">
          {task.question_text || 'Combine each sentence using V-ing.'}
        </h2>
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
        {sentences.map((sentence: string, idx: number) => {
          const isChecked = checkedBlanks[idx];
          const isCorrectBlank = isChecked
            ? normalise(userAnswers[idx]) === normalise(correctAnswers[idx] || '')
            : null;

          return (
            <div key={idx} className="space-y-1">
              <p className="text-gray-800">{sentence}</p>
              <textarea
                value={userAnswers[idx]}
                onChange={(e) => {
                  const newAnswers = [...userAnswers];
                  newAnswers[idx] = e.target.value;
                  setUserAnswers(newAnswers);
                }}
                placeholder="Your answer..."
                rows={1}
                disabled={isChecked}
                className={`
                  w-full p-2 border rounded resize-none overflow-hidden
                  transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300
                  ${
                    isChecked
                      ? isCorrectBlank
                        ? 'border-green-600 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-400'
                  }
                `}
              />
            </div>
          );
        })}
      </div>

      {!checkedBlanks.every(Boolean) && allFilled && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleCheck}
            disabled={isSubmitting}
            className="px-8 py-2 text-base font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Submitting...' : 'CHECK'}
          </button>
        </div>
      )}

      {checkedBlanks.every(Boolean) && (
        <div className="text-center text-base font-semibold">
          {allCorrect ? 'All correct!' : 'Some answers are wrong.'}
        </div>
      )}
    </div>
  );
}