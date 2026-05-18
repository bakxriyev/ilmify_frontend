'use client';

import React, { useState, useEffect } from 'react';
import { Task, Exercise } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Music, Film, File } from 'lucide-react';

interface WritingProps {
  task: Task;
  exercise: Exercise;
  studentId: string;
  onComplete: () => void;
  onBlankAnswer: (taskId: string, blankIndex: number, isCorrect: boolean) => void;
}

export default function Writing({
  task,
  exercise,
  studentId,
  onComplete,
  onBlankAnswer,
}: WritingProps) {
  const [answer, setAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz';

  // Reset when task changes
  useEffect(() => {
    setAnswer('');
    setWordCount(0);
  }, [task.id]);

  // Update word count
  useEffect(() => {
    const words = answer.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [answer]);

  const handleNext = () => {
    // writing task has only one blank (index 0)
    onBlankAnswer(task.id, 0, true); // always mark as completed (true)
    onComplete();
  };

  const isNextDisabled = answer.trim().length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Left column: instruction + media */}
      <div className="space-y-4">
        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold text-gray-800"></h3>
          <p className="text-gray-700 whitespace-pre-wrap">{task.question_text}</p>
        </div>

        {/* Media files */}
        {task.photo && (
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
              <Camera className="h-4 w-4 text-blue-500" />
              Task photo
            </p>
            <img
              src={`${API_BASE_URL}/uploads/tasks/${task.photo}`}
              alt="Task"
              className="max-h-64 rounded-lg object-contain mx-auto"
            />
          </div>
        )}

        {task.audio && (
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
              <Music className="h-4 w-4 text-green-500" />
              Audio
            </p>
            <audio controls src={`${API_BASE_URL}/uploads/tasks/${task.audio}`} className="w-full" />
          </div>
        )}

        {task.video && (
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
              <Film className="h-4 w-4 text-purple-500" />
              Video
            </p>
            <video controls src={`${API_BASE_URL}/uploads/tasks/${task.video}`} className="max-h-64 rounded-lg" />
          </div>
        )}

        {task.media && (
          <div className="border rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
              <File className="h-4 w-4 text-gray-500" />
              Media fayl
            </p>
            <a
              href={`${API_BASE_URL}/uploads/tasks/${task.media}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {task.media}
            </a>
          </div>
        )}
      </div>

      {/* Right column: answer area */}
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
            Your answer
          </label>
          <Textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Matnni shu yerga yozing..."
            rows={12}
            className="border-gray-300 resize-none"
          />
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span>So‘zlar soni: {wordCount}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={isNextDisabled}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            Check
          </Button>
        </div>
      </div>
    </div>
  );
}