'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface ExerciseResultModalProps {
  open: boolean;
  exerciseName?: string;
  totalTasks: number;
  correctCount: number;
  percentage?: number;
  results: boolean[];
  onNext?: () => void;
  onRetry?: () => void;
  onBackToMain: () => void;
}

export default function ExerciseResultModal({
  open,
  exerciseName = 'Exercise',
  totalTasks,
  correctCount,
  results,
  onNext,
  onRetry,
  onBackToMain,
}: ExerciseResultModalProps) {
  const percentage = Math.round((correctCount / totalTasks) * 100);
  const isPassed = percentage >= 80;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-600">Your result</p>
            <p className="text-3xl font-bold text-gray-900">
              {correctCount} / {totalTasks}
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {results.map((isCorrect, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-gray-700">Question {idx + 1}</span>
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            {isPassed && (
              <p className="text-xl font-semibold text-green-600">Excellent!</p>
            )}
            <p className="text-4xl font-bold text-gray-900">{percentage}%</p>
            <p className="text-gray-600">
              {correctCount} of {totalTasks}
            </p>
          </div>

          <div className="flex justify-center gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-500">1</p>
              <p className="text-sm text-gray-500">coin</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">10</p>
              <p className="text-sm text-gray-500">score</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={onBackToMain}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Main
            </Button>
            {isPassed && onNext && (
              <Button
                onClick={onNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            )}
            {!isPassed && onRetry && (
              <Button
                onClick={onRetry}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}