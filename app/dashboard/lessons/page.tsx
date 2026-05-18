// app/dashboard/lessons/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Lock,
  ChevronDown,
  X,
  Play,
  Key,
  Bookmark,
  ArrowRight,
  BookOpen,
  Video,
  Dumbbell,
  Film,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Exercise, ExerciseResult } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { encryptUnitId } from '@/lib/crypto';

// ---------- Types ----------
interface SubTask {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;          // 0-100
  hasMedal?: boolean;
  type?: 'default' | 'badge' | 'test';
  testScore?: number;
}

interface Section {
  id: string;
  type: 'vocabulary' | 'theory' | 'exercises' | 'film';
  title: string;
  subtitle: string;
  progress: number;
  locked: boolean;
  icon: any;
  color: string;
  tasks?: SubTask[];
  filmDetails?: string[];
}

interface Unit {
  id: string;
  unitNumber: string;
  title: string;
  color: string;
  icon: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  progress: number;
  date: string;               // formatted lesson date
  availableFrom: Date;        // when unit becomes available (lesson time + 2h)
  sections: Section[];
  imageUrl: string;
  lessonId: string;           // for reference
}

// ---------- Constants ----------
const SKILL_NAMES = ['Reading', 'Listening', 'Writing', 'Speaking', 'Grammar', 'Vocabulary'];
const UNIT_BACKGROUND_IMAGES = [
  '/blc.png',
  '/blc.png',
  '/blc.png',
  '/blc.png',
  '/blc.png',
  '/blc.png',
  '/blc.png',
  '/blc.png',
];

const getUnitColor = (index: number, progress: number): string => {
  if (progress === 100) return '#10b981';
  if (progress > 0) return '#3b82f6';
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return colors[index % colors.length];
};

// ---------- Helpers ----------
function parseLessonDateTime(dateStr: string, timeStr: string): Date {
  // dateStr: "2026-02-27T00:00:00.000Z" -> extract date part
  // timeStr: "08:00:00"
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const [hour, minute, second] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second); // local time (Uzbekistan)
}

// ---------- Skeleton ----------
function LessonsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="animate-pulse">
        <div className="h-16 bg-white rounded-2xl mb-6"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="w-[240px] h-[280px] bg-gray-200 rounded-[2.5rem] flex-shrink-0"></div>)}
        </div>
      </div>
    </div>
  );
}

export default function LessonPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Send notification when a unit becomes available
  const sendAvailabilityNotification = useCallback(async (unit: Unit) => {
    try {
      const now = new Date();
      // Only send if exactly now or within the last hour (to avoid spamming on every visit)
      const timeDiff = now.getTime() - unit.availableFrom.getTime();
      if (timeDiff >= 0 && timeDiff <= 60 * 60 * 1000) {
        const notified = localStorage.getItem(`notified_unit_${unit.id}`);
        if (!notified) {
          await api.sendNotification({
            userId: user?.id,
            title: 'Unit available!',
            description: `Unit ${unit.unitNumber}: ${unit.title} is now ready.`,
            link: `/dashboard/lessons?unit=${unit.id}`,
          });
          localStorage.setItem(`notified_unit_${unit.id}`, 'true');
        }
      }
    } catch (err) {
      console.error('Failed to send notification', err);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Get student and group
        const student = await api.getStudentById(user.id);
        const group = student.group_students[0]?.group;
        if (!group) throw new Error('Student has no group');
        const groupId = group.id;

        // 2. Get all lessons for the group
        const lessons = await api.getGroupLessons(groupId);
        // Filter lessons that have a unit
        const lessonsWithUnit = lessons.filter((l: any) => l.unit !== null);
        // Sort by date (ascending)
        lessonsWithUnit.sort((a: any, b: any) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // 3. Build units with exercises and results
        const unitsPromises = lessonsWithUnit.map(async (lesson: any, index: number) => {
          const unit = lesson.unit;
          const lessonDateTime = parseLessonDateTime(lesson.date, lesson.time);
          const availableFrom = new Date(lessonDateTime.getTime() + 2 * 60 * 60 * 1000);
          const now = new Date();
          const isTimeLocked = now < availableFrom;

          // Fetch exercises for this unit
          const exercises: Exercise[] = await api.getExercisesByUnit(unit.id);
          // Fetch results for each exercise
          const exerciseResults = await Promise.all(
            exercises.map(async (ex) => {
              try {
                const result = await api.getExerciseResult(ex.id, user.id);
                return { exerciseId: ex.id, percentage: result?.percentage || 0 };
              } catch {
                return { exerciseId: ex.id, percentage: 0 };
              }
            })
          );
          const progressMap = Object.fromEntries(
            exerciseResults.map(r => [r.exerciseId, r.percentage])
          );

          // Group exercises by type
          const vocabEx = exercises.filter(e => e.type === 'vocabulary' || e.name?.toLowerCase().includes('vocab'));
          const theoryEx = exercises.filter(e => e.type === 'video' || e.name?.toLowerCase().includes('video'));
          const otherEx = exercises.filter(e => !vocabEx.includes(e) && !theoryEx.includes(e));

          // Build sections
          const sections: Section[] = [];

          // Vocabulary section
          if (vocabEx.length > 0) {
            const tasks: SubTask[] = vocabEx.map(ex => ({
              id: ex.id,
              title: ex.name || `Vocabulary ${ex.number}`,
              subtitle: ex.description || '',
              progress: progressMap[ex.id] || 0,
            }));
            const avgProgress = tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length;
            sections.push({
              id: 'vocab',
              type: 'vocabulary',
              title: 'Vocabulary',
              subtitle: `${tasks.length} WORDS`,
              progress: avgProgress,
              locked: false, // time lock applies only to unit overall; section lock may be added later
              icon: BookOpen,
              color: 'from-blue-500 to-indigo-600',
              tasks,
            });
          } else {
            // Placeholder if no vocabulary exercises
            sections.push({
              id: 'vocab',
              type: 'vocabulary',
              title: 'Vocabulary',
              subtitle: '0 WORDS',
              progress: 0,
              locked: true,
              icon: BookOpen,
              color: 'from-blue-500 to-indigo-600',
              tasks: [],
            });
          }

          // Theory section
          if (theoryEx.length > 0) {
            const tasks: SubTask[] = theoryEx.map(ex => ({
              id: ex.id,
              title: ex.name || `Theory ${ex.number}`,
              subtitle: ex.description || '',
              progress: progressMap[ex.id] || 0,
            }));
            const avgProgress = tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length;
            sections.push({
              id: 'theory',
              type: 'theory',
              title: 'Theory',
              subtitle: `${tasks.length} VIDEO`,
              progress: avgProgress,
              locked: false,
              icon: Video,
              color: 'from-purple-500 to-pink-600',
              tasks,
            });
          } else {
            sections.push({
              id: 'theory',
              type: 'theory',
              title: 'Theory',
              subtitle: 'No video',
              progress: 0,
              locked: true,
              icon: Video,
              color: 'from-purple-500 to-pink-600',
              tasks: [],
            });
          }

          // Exercises section
          if (otherEx.length > 0) {
            const tasks: SubTask[] = otherEx.map(ex => ({
              id: ex.id,
              title: ex.name || `Task ${ex.number}`,
              subtitle: ex.description || 'Optional task',
              progress: progressMap[ex.id] || 0,
            }));
            const avgProgress = tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length;
            sections.push({
              id: 'exercises',
              type: 'exercises',
              title: 'Exercises',
              subtitle: `${tasks.length} EXERCISE`,
              progress: avgProgress,
              locked: false, // will be updated later based on previous unit's performance
              icon: Dumbbell,
              color: 'from-gray-600 to-gray-800',
              tasks,
            });
          } else {
            sections.push({
              id: 'exercises',
              type: 'exercises',
              title: 'Exercises',
              subtitle: '0 EXERCISE',
              progress: 0,
              locked: true,
              icon: Dumbbell,
              color: 'from-gray-600 to-gray-800',
              tasks: [],
            });
          }

          // Film section (static)
          sections.push({
            id: 'film',
            type: 'film',
            title: 'Film',
            subtitle: 'Coming soon!',
            progress: 0,
            locked: true,
            icon: Film,
            color: 'from-gray-400 to-gray-600',
            filmDetails: [
              'COMING SOON!',
              'A01 -1 9',
              '16:12:34:21',
              'Roadside',
              'Jakob & Ryan',
              'Thomas Taggart'
            ],
          });

          // Unit result for overall progress
          const unitResult = await api.getUnitResult(user.id, unit.id);
          const unitProgress = unitResult?.percentage || 0;

          // Determine status based on time and progress
          let status: 'locked' | 'available' | 'in-progress' | 'completed' = 'available';
          if (isTimeLocked) {
            status = 'locked';
          } else if (unitProgress === 100) {
            status = 'completed';
          } else if (unitProgress > 0) {
            status = 'in-progress';
          }

          // Format date for display
          const displayDate = new Date(lesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          return {
            id: unit.id,
            unitNumber: unit.unit_number?.toString() || `${index + 1}`,
            title: unit.title || `Unit ${unit.unit_number}`,
            color: getUnitColor(index, unitProgress),
            icon: '📚',
            status,
            progress: unitProgress,
            date: displayDate,
            availableFrom,
            sections,
            imageUrl: UNIT_BACKGROUND_IMAGES[index % UNIT_BACKGROUND_IMAGES.length],
            lessonId: lesson.id,
          };
        });

        const loadedUnits = await Promise.all(unitsPromises);

        // 4. Apply previous unit condition: if previous unit's exercises average < 80%, lock current unit's exercises section
        for (let i = 1; i < loadedUnits.length; i++) {
          const prevUnit = loadedUnits[i - 1];
          const currUnit = loadedUnits[i];

          // Find exercises section in previous unit
          const prevExercisesSection = prevUnit.sections.find(s => s.type === 'exercises');
          if (prevExercisesSection && prevExercisesSection.tasks && prevExercisesSection.tasks.length > 0) {
            const prevAvg = prevExercisesSection.progress; // already average
            if (prevAvg < 80) {
              // Lock current unit's exercises section
              const currExercisesSection = currUnit.sections.find(s => s.type === 'exercises');
              if (currExercisesSection) {
                currExercisesSection.locked = true;
              }
            }
          }
        }

        setUnits(loadedUnits);

        // 5. Send notifications for newly available units
        loadedUnits.forEach(unit => {
          if (unit.status !== 'locked') {
            sendAvailabilityNotification(unit);
          }
        });

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load lessons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, sendAvailabilityNotification]);

  const openUnit = (unit: Unit) => {
    if (unit.status === 'locked') return;
    setSelectedUnit(unit);
    setExpandedExercises(false);
    setIsDrawerOpen(true);
  };

  const scroll = (dir: 'l' | 'r') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({ left: dir === 'l' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSectionClick = (section: Section) => {
    if (section.locked) return;
    if (section.type === 'exercises') return; // exercises are handled via task clicks
    console.log('Section clicked (unlocked):', section.id);
    // Future: navigate to theory/vocabulary pages
  };

  const handleTaskClick = (taskId: string) => {
    if (!selectedUnit) return;
    const encryptedUnitId = encryptUnitId(selectedUnit.id);
    router.push(`/dashboard/exercises/tasks/${encryptedUnitId}?exerciseId=${taskId}`);
  };

  const toggleExercises = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedExercises(!expandedExercises);
  };

  if (isLoading) return <LessonsSkeleton />;
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-2xl text-center">
          <p className="text-red-600 font-bold">Error: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-12 min-h-screen">
      <div className="px-4 md:px-10 space-y-6">
        {/* Stats Card – all zeros for now */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-2 ring-yellow-500/20 flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80"
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{user?.name || 'Student'}</p>
                <p className="text-xs text-gray-500">Level: IELTS</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Coins</p>
                <p className="font-bold text-gray-800">0</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Stars</p>
                <p className="font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {SKILL_NAMES.map(skill => (
              <div key={skill} className="bg-gray-50 p-2 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{skill}</p>
                <p className="text-sm font-black text-gray-400">0%</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 text-xs border-t border-gray-100 pt-3">
            <span className="text-gray-500 font-medium">February average</span>
            <span className="font-black text-gray-400">0%</span>
          </div>
        </section>

        {/* Learning Path */}
        <section className="relative">
          <h2 className="text-lg font-bold text-gray-800 mb-4 md:mb-6 px-1">Learning path</h2>
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 snap-x"
          >
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => unit.status !== 'locked' && openUnit(unit)}
                className={`snap-start flex-shrink-0 w-[240px] md:w-[260px] h-[300px] md:h-[320px] rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl relative group ${
                  unit.status === 'locked' ? 'opacity-90' : ''
                }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${unit.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />
                {unit.status === 'locked' && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                    <div className="w-20 h-20 bg-white/90 backdrop-blur-2xl rounded-2xl flex items-center justify-center shadow-2xl">
                      <Lock className="h-10 w-10 text-red-600" />
                    </div>
                  </div>
                )}
                <div className="relative h-full flex flex-col p-5 md:p-6 text-white z-10">
                  <div className="absolute top-5 left-5 bg-white/10 backdrop-blur-md px-4 py-1 rounded-full text-[10px] md:text-xs font-black tracking-widest border border-white/30">
                    UNIT {unit.unitNumber}
                  </div>
                  <div className="mt-auto">
                    <p className="font-bold text-xl md:text-2xl leading-tight drop-shadow-md line-clamp-3 mb-6 md:mb-8 px-1">
                      {unit.title}
                    </p>

                    {unit.status !== 'locked' && unit.progress > 0 && (
                      <div className="mb-3 px-1">
                        <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-white/80 mb-1">
                          <span>Progress</span>
                          <span>{unit.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${unit.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      className={`w-full py-3 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${
                        unit.status === 'locked'
                          ? 'bg-red-500/90 text-white hover:bg-red-600'
                          : unit.progress === 100
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : unit.progress > 0
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                          : 'bg-white text-gray-900 hover:bg-yellow-300'
                      }`}
                    >
                      {unit.status === 'locked' && <Lock size={14} />}
                      {unit.status === 'locked'
                        ? 'Locked'
                        : unit.progress > 0
                        ? `${unit.progress}%`
                        : 'Start'}
                    </button>

                    <p className="text-white/70 text-[10px] md:text-xs font-medium mt-3 text-center tracking-wider">
                      {unit.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => scroll('l')}
            className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('r')}
            className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white shadow-xl rounded-full flex items-center justify-center border border-gray-100 z-10"
          >
            <ChevronRight size={18} />
          </button>
        </section>
      </div>

      {/* RIGHT DRAWER */}
      {isDrawerOpen && selectedUnit && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-[420px] md:max-w-[450px] h-full bg-[#f8f9fa] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
            <div className="p-5 md:p-6 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-10">
              <h2 className="text-base md:text-lg font-black text-gray-800">Unit {selectedUnit.unitNumber}</h2>
              <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600">
                  <Key size={18} />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <Bookmark size={18} />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-5 pb-20">
              {/* Unit progress bar */}
              {selectedUnit.status !== 'locked' && selectedUnit.progress > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Progress</span>
                    <span className="text-sm font-black text-yellow-600">{selectedUnit.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${selectedUnit.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {selectedUnit.sections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <div
                    className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all hover:shadow-md ${
                      !section.locked && section.type !== 'exercises' ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleSectionClick(section)}
                  >
                    <div className={`relative h-20 md:h-24 bg-gradient-to-br ${section.color}`}>
                      <div className="absolute inset-0 bg-black/10">
                        <div className="absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 opacity-30">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <path d="M0,100 L50,30 L100,100 Z" fill="white" opacity="0.3" />
                            <path d="M20,100 L70,50 L100,100 Z" fill="white" opacity="0.2" />
                          </svg>
                        </div>
                      </div>
                      {section.locked && (
                        <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Lock className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      {!section.locked && (
                        <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <section.icon className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {!section.locked && section.type !== 'exercises' && (
                        <div className="absolute top-3 right-3">
                          {section.progress === 100 ? (
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-0.5">
                              <span className="text-xs font-bold text-green-600">100%</span>
                            </div>
                          ) : section.progress > 0 ? (
                            <span className="bg-pink-500 text-white font-bold px-2 py-0.5 rounded-lg text-xs">
                              {Math.round(section.progress)}%
                            </span>
                          ) : null}
                        </div>
                      )}
                      {section.locked && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/90 text-red-600 font-bold px-2 py-0.5 rounded-lg text-xs">
                            Locked
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-12 right-3 text-white">
                        <h3 className="text-sm md:text-base font-bold drop-shadow-md">{section.title}</h3>
                        <p className="text-[10px] md:text-xs opacity-90 drop-shadow-md">{section.subtitle}</p>
                      </div>
                      {!section.locked && section.progress === 100 && section.type !== 'exercises' && (
                        <div className="absolute top-3 left-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      {section.type === 'exercises' && !section.locked && section.tasks && section.tasks.length > 0 && (
                        <div
                          className="absolute bottom-2 right-3 cursor-pointer p-1 bg-white/20 rounded-full hover:bg-white/30 transition"
                          onClick={toggleExercises}
                        >
                          <ChevronDown
                            className={`h-4 w-4 text-white transition-transform ${
                              expandedExercises ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      )}
                    </div>
                    {!section.locked && section.type !== 'exercises' && section.progress > 0 && section.progress < 100 && (
                      <div className="px-3 py-2 bg-gray-50">
                        <div className="flex justify-between text-[10px] text-gray-600 mb-1 font-medium">
                          <span>Progress</span>
                          <span className="font-bold">{Math.round(section.progress)}%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${section.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tasks under exercises (if expanded) */}
                  {section.type === 'exercises' && expandedExercises && section.tasks && section.tasks.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {section.tasks.map((task) => {
                        const progress = task.progress || 0;
                        const progressColor = progress >= 80 ? 'text-green-600' : 'text-red-500';
                        return (
                          <div
                            key={task.id}
                            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-yellow-500/50 transition-colors"
                            onClick={() => handleTaskClick(task.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-black text-xs text-gray-800">{task.title}</h4>
                                <p className="text-[8px] font-bold text-gray-400">{task.subtitle}</p>
                              </div>
                              {task.hasMedal && <span className="text-base">🥇</span>}
                            </div>
                            {task.progress !== undefined && (
                              <>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${task.progress}%` }}
                                  ></div>
                                </div>
                                <p className={`text-[7px] font-black text-right mt-1 ${progressColor}`}>
                                  {task.progress}%
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}