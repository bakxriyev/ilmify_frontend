'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api, Exercise, Task } from '@/lib/api';
import { decryptUnitId } from '@/lib/crypto';
import SummaryD from '@/components/exercises/SummaryD';
import SummaryC from '@/components/exercises/SummaryC';
import SummaryChoice from '@/components/exercises/SummaryChoice';
import SummaryIng from '@/components/exercises/SummaryIng';
import SummaryNo from '@/components/exercises/SummaryNo';
import ExerciseResultModal from '@/components/ExerciseResultModal';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Writing from '../../../../../components/exercises/Writing';

/**
 * Berilgan task ichidagi blanklar (sub-questions) sonini qaytaradi.
 * Har bir exercise turi uchun alohida hisoblash logikasi.
 */
function countBlanksInTask(task: Task, exerciseType: string): number {
  try {
    const extra = typeof task.extra_data === 'string'
      ? JSON.parse(task.extra_data)
      : task.extra_data;

    switch (exerciseType) {
      case 'summary_ing':
        // extra.sentences – har bir senga alohida blank
        return extra?.sentences?.length || 1;

      case 'summary_no':
        // Hozircha bitta blank, lekin kelajakda ko‘payishi mumkin
        return 1;

      case 'summary_c':
        // parts array – har bir part alohida blank
        return extra?.parts?.length || 1;

      case 'summary_choice':
        // sentences array – har bir sentence uchun blank
        return extra?.sentences?.length || 1;

      case 'summary_d':
        // correct_answer obyektidagi kalitlar soni blanklar soni
        const correctMap = typeof task.correct_answer === 'string'
          ? JSON.parse(task.correct_answer)
          : task.correct_answer;
        return Object.keys(correctMap).length;

      default:
        return 1; // noma’lum tur – bitta blank deb hisobla
    }
  } catch (error) {
    console.warn('countBlanksInTask error:', error);
    return 1; // xatolik bo‘lsa ham bitta blank
  }
}

function makeBlankId(taskId: string, blankIndex: number): string {
  return `${taskId}_${blankIndex}`;
}

export default function UnitExercisesPage() {
  const { hashedUnitId } = useParams();
  const searchParams = useSearchParams();
  const exerciseId = searchParams.get('exerciseId');
  const router = useRouter();
  const { user } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blankResults, setBlankResults] = useState<Record<string, boolean>>({});
  const [showResultModal, setShowResultModal] = useState(false);

  const unitId = useMemo(() => {
    if (!hashedUnitId) return null;
    try {
      return decryptUnitId(hashedUnitId as string);
    } catch {
      return null;
    }
  }, [hashedUnitId]);

  const getStorageKey = (exId: string) => `exercise_blanks_${exId}`;

  // Joriy exercise o‘zgarganda localStorage’dan blank natijalarini yuklash
  useEffect(() => {
    if (!currentExercise) return;
    const saved = localStorage.getItem(getStorageKey(currentExercise.id));
    if (saved) {
      try {
        setBlankResults(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse localStorage', e);
      }
    } else {
      setBlankResults({});
    }
  }, [currentExercise]);

  // Exercise va tasklarni yuklash
  useEffect(() => {
    const fetchData = async () => {
      if (!unitId || !user?.id) return;
      try {
        setLoading(true);
        const data = await api.getExercisesByUnit(unitId);
        data.forEach((ex) =>
          ex.tasks.sort((a, b) => a.ordinary_number - b.ordinary_number)
        );
        setExercises(data);

        if (exerciseId) {
          const ex = data.find((e) => e.id === exerciseId);
          if (ex) {
            setCurrentExercise(ex);
            setCurrentTaskIndex(0);
          } else {
            setError('Exercise not found in this unit');
          }
        } else if (data.length > 0) {
          setCurrentExercise(data[0]);
          setCurrentTaskIndex(0);
        } else {
          setError('No exercises in this unit');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unitId, exerciseId, user]);

  const handleBlankAnswer = useCallback((taskId: string, blankIndex: number, isCorrect: boolean) => {
    if (!currentExercise) return;
    const blankId = makeBlankId(taskId, blankIndex);
    const newResults = { ...blankResults, [blankId]: isCorrect };
    setBlankResults(newResults);
    localStorage.setItem(
      getStorageKey(currentExercise.id),
      JSON.stringify(newResults)
    );
  }, [currentExercise, blankResults]);

  const handleNextTask = () => {
    if (!currentExercise) return;
    const lastIndex = currentExercise.tasks.length - 1;
    if (currentTaskIndex === lastIndex) {
      setShowResultModal(true);
    } else {
      setCurrentTaskIndex((prev) => prev + 1);
    }
  };

  const handlePrevTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  const handleRetry = () => {
    if (!currentExercise) return;
    localStorage.removeItem(getStorageKey(currentExercise.id));
    setBlankResults({});
    setCurrentTaskIndex(0);
    setShowResultModal(false);
  };

  const handleNextExercise = () => {
    const currentIndex = exercises.findIndex((ex) => ex.id === currentExercise?.id);
    const nextExercise = exercises[currentIndex + 1];
    if (nextExercise) {
      router.push(`/dashboard/exercises/tasks/${hashedUnitId}?exerciseId=${nextExercise.id}`);
    } else {
      router.back(); // Boshqa exercise qolmagan bo‘lsa, orqaga qaytish
    }
    setShowResultModal(false);
  };

  const handleBackToMain = () => {
    router.push('/dashboard/lessons'); // Unit exercises ro‘yxatiga qaytish
    setShowResultModal(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading exercises...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  if (!currentExercise) return <div className="p-10 text-center text-gray-500">No exercise selected</div>;

  const currentTask = currentExercise.tasks[currentTaskIndex];
  const totalTasks = currentExercise.tasks.length;

  // Barcha blanklarni (task bo‘yicha) tekis ro‘yxatga yig‘ish
  const allBlanks: { blankId: string; taskId: string }[] = [];
  currentExercise.tasks.forEach((task) => {
    const blankCount = countBlanksInTask(task, currentExercise.type);
    for (let i = 0; i < blankCount; i++) {
      allBlanks.push({
        blankId: makeBlankId(task.id, i),
        taskId: task.id,
      });
    }
  });

  const resultsArray = allBlanks.map((b) => blankResults[b.blankId] || false);
  const correctCount = resultsArray.filter(Boolean).length;
  const totalBlanks = allBlanks.length;
  const percentage = totalBlanks > 0 ? Math.round((correctCount / totalBlanks) * 100) : 0;

  const commonProps = {
    task: currentTask,
    exercise: currentExercise,
    studentId: user!.id,
    onComplete: handleNextTask,
    onBlankAnswer: handleBlankAnswer,
  };

  const renderExercise = () => {
    switch (currentExercise.type) {
      case 'summary_d':
        return <SummaryD key={currentTask.id} {...commonProps} />;
      case 'summary_c':
        return <SummaryC key={currentTask.id} {...commonProps} />;
      case 'summary_choice':
        return <SummaryChoice key={currentTask.id} {...commonProps} />;
      case 'summary_ing':
        return <SummaryIng key={currentTask.id} {...commonProps} />;
      case 'summary_no':
        return <SummaryNo key={currentTask.id} {...commonProps} />;
         case 'writing':
      return <Writing key={currentTask.id} {...commonProps} />;
        
      default:
        return (
          <div className="text-center py-20 text-gray-400">
            Exercise type &quot;{currentExercise.type}&quot; not yet implemented
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header – task navigatsiyasi */}
        <div className="bg-white rounded-t-3xl px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-sm font-bold text-gray-500">
            Task {currentTask.ordinary_number} of {totalTasks}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrevTask}
              disabled={currentTaskIndex === 0}
              className={`p-2 rounded-full transition-colors ${
                currentTaskIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={handleNextTask}
              disabled={currentTaskIndex === totalTasks - 1}
              className={`p-2 rounded-full transition-colors ${
                currentTaskIndex === totalTasks - 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-b-3xl shadow-xl">{renderExercise()}</div>
      </div>
    
      <ExerciseResultModal
        open={showResultModal}
        exerciseName={currentExercise.name}
        totalTasks={totalBlanks}              
        correctCount={correctCount}
        percentage={percentage}
        results={resultsArray}                  
        onNext={handleNextExercise}
        onRetry={handleRetry}
        onBackToMain={handleBackToMain}
      />
    </div>
  );
}