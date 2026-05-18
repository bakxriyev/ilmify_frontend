'use client';

import React, { useState } from 'react';
import { api, Task, Exercise } from '@/lib/api';
import AnswerFeedback from '@/components/RightAnswer';

interface Props {
  task: Task;
  exercise: Exercise;
  studentId: string;
  onComplete?: () => void;
  onBlankAnswer: (taskId: string, blankIndex: number, isCorrect: boolean) => void;
}

export default function SummaryNo({ task, exercise, studentId, onComplete, onBlankAnswer }: Props) {
  // ---------- Parse task data ----------
  const { sentence, options } = (() => {
    try {
      const parsed = typeof task.extra_data === 'string' ? JSON.parse(task.extra_data) : task.extra_data;
      return {
        sentence: parsed.sentence || '',
        options: parsed.options || [],
      };
    } catch {
      return { sentence: '', options: [] };
    }
  })();

  const correctAnswer = (() => {
    try {
      const ca = task.correct_answer;
      if (typeof ca === 'string') {
        try {
          const parsed = JSON.parse(ca);
          return typeof parsed === 'string' ? parsed : '';
        } catch {
          return ca;
        }
      }
      return '';
    } catch {
      return '';
    }
  })();

  // ---------- State ----------
  const [selectedOption, setSelectedOption] = useState('');
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // ---------- Handle option click (immediate check) ----------
  const handleOptionClick = async (option: string) => {
    if (checked || isSubmitting) return;

    setSelectedOption(option);
    setIsSubmitting(true);

    const correct = option === correctAnswer;
    setIsCorrect(correct);
    setChecked(true);
    setShowFeedback(true);

    // Yagona blank (index 0) natijasini parentga yuborish
    onBlankAnswer(task.id, 0, correct);

    try {
      await api.postStudentAnswer({
        student_id: Number(studentId),
        unit_id: Number(exercise.unit_id),
        exercise_id: Number(exercise.id),
        task_id: Number(task.id),
        answer_text: JSON.stringify({ answer: option }),
        q_type: exercise.type,
        is_correct: correct,
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
    const base = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';
    return `${base}/uploads/tasks/${path}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 pb-28">
      <AnswerFeedback show={showFeedback} isCorrect={isCorrect} onNext={handleNext} />

      {task.question_text && (
        <h2 className="text-xl font-bold text-gray-800">{task.question_text}</h2>
      )}

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

      {sentence && (
        <div className="text-gray-800 text-base bg-gray-50 p-4 rounded-lg border">
          {sentence}
        </div>
      )}

      {!checked && options.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10">
          <div className="max-w-4xl mx-auto flex justify-center">
            <div className="flex flex-wrap gap-3 justify-center">
              {options.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  disabled={checked || isSubmitting}
                  className={`
                    px-5 py-2.5 rounded-full border-2 text-sm font-medium transition
                    bg-white border-gray-300 text-gray-700
                    hover:border-blue-400 hover:text-blue-700 hover:shadow
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {checked && (
        <div className="text-center text-base font-semibold pt-2">
          {isCorrect ? 'Correct!' : 'Wrong answer.'}
        </div>
      )}
    </div>
  );
}