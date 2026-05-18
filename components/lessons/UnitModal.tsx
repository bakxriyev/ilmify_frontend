// UnitModal component (yangilangan)
function UnitModal({ unit, onClose }: { unit: any; onClose: () => void }) {
  const [expandedExercises, setExpandedExercises] = useState(false);
  const router = useRouter();

  // Asosiy bo'limlar
  const sections = [
    {
      id: 'vocab',
      type: 'vocabulary',
      title: 'Vocabulary',
      subtitle: '41 words',
      progress: 100,
      locked: false,
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'theory',
      type: 'theory',
      title: 'Theory',
      subtitle: 'Video lesson',
      progress: 100,
      locked: false,
      icon: Video,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'exercises',
      type: 'exercises',
      title: 'Exercises',
      subtitle: '14 exercise',
      progress: 100,
      locked: false,
      icon: Dumbbell,
      color: 'from-gray-600 to-gray-800',
      hasExpand: true // exercises ochiladigan bo'lim
    },
    {
      id: 'film',
      type: 'film',
      title: 'Film',
      subtitle: 'Coming soon!',
      progress: 0,
      locked: true,
      icon: Film,
      color: 'from-gray-400 to-gray-600'
    }
  ];

  // Exercises ichidagi tasklar (image'dagidek)
  const exerciseTasks = [
    {
      id: 'task9',
      title: 'SKILL Task 9',
      subtitle: 'Optional task',
      progress: 0
    },
    {
      id: 'task10',
      title: 'PRACTICE Task 10',
      subtitle: 'Optional task',
      progress: 0
    },
    {
      id: 'taskop',
      title: 'PRA Task Op',
      subtitle: '',
      progress: 0
    }
  ];

  const getSectionBackground = (section: any) => {
    if (section.locked) return "bg-gradient-to-br from-gray-400 to-gray-600";
    return `bg-gradient-to-br ${section.color}`;
  };

  const getProgressBadge = (section: any) => {
    if (section.locked) {
      return (
        <Badge className="bg-white/90 text-red-600 font-bold px-3 py-1 hover:bg-white">
          Locked
        </Badge>
      );
    }
    if (section.progress === 100) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-sm font-bold text-green-600">100%</span>
        </div>
      );
    }
    if (section.progress > 0) {
      return (
        <Badge className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-3 py-1">
          {section.progress}%
        </Badge>
      );
    }
    return null;
  };

  const handleSectionClick = (section: any) => {
    if (section.locked) return;
    // Agar Exercises bo'limi bo'lsa va u ochiladigan bo'lsa, hech narsa qilmaymiz (faqat strelka ishlaydi)
    if (section.id === 'exercises') return;
    // Boshqa bo'limlar uchun kerakli sahifaga o'tish
    router.push(`/lessons/unit/${unit.id}/section/${section.id}`);
  };

  const toggleExercises = (e: React.MouseEvent) => {
    e.stopPropagation(); // card bosilishini oldini olish
    setExpandedExercises(!expandedExercises);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={onClose}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">
            Unit {unit.unitNumber}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24 space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <Card
              className={`cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-2 ${
                section.locked ? 'border-gray-300' : 'border-gray-200'
              } overflow-hidden`}
              onClick={() => handleSectionClick(section)}
            >
              <div className={`relative h-24 ${getSectionBackground(section)}`}>
                {/* Background pattern */}
                <div className="absolute inset-0 bg-black/10">
                  <div className="absolute bottom-0 right-0 w-32 h-32 opacity-30">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <path d="M0,100 L50,30 L100,100 Z" fill="white" opacity="0.3"/>
                      <path d="M20,100 L70,50 L100,100 Z" fill="white" opacity="0.2"/>
                    </svg>
                  </div>
                </div>

                {/* Lock icon for locked sections */}
                {section.locked && (
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Lock className="h-5 w-5 text-red-600" />
                  </div>
                )}

                {/* Section icon for unlocked sections */}
                {!section.locked && (
                  <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Progress badge */}
                <div className="absolute top-4 right-4">
                  {getProgressBadge(section)}
                </div>

                {/* Section info */}
                <div className="absolute bottom-3 left-14 right-4 text-white">
                  <h3 className="text-base font-bold drop-shadow-md">{section.title}</h3>
                  <p className="text-xs opacity-90 drop-shadow-md">
                    {section.subtitle}
                  </p>
                </div>

                {/* Checkmark for completed */}
                {section.progress === 100 && !section.locked && (
                  <div className="absolute top-4 left-4 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Expand arrow for Exercises */}
                {section.hasExpand && !section.locked && (
                  <div
                    className="absolute bottom-3 right-4 cursor-pointer p-1 bg-white/20 rounded-full hover:bg-white/30 transition"
                    onClick={toggleExercises}
                  >
                    <ChevronDown
                      className={`h-5 w-5 text-white transition-transform ${
                        expandedExercises ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Progress bar (agar progress 0 dan katta va 100 dan kichik bo‘lsa) */}
              {section.progress > 0 && section.progress < 100 && !section.locked && (
                <div className="px-4 py-2 bg-gray-50">
                  <div className="flex justify-between text-xs text-gray-600 mb-1 font-medium">
                    <span>Progress</span>
                    <span className="font-bold">{section.progress}%</span>
                  </div>
                  <Progress value={section.progress} className="h-1.5" />
                </div>
              )}
            </Card>

            {/* Expanded tasks for Exercises */}
            {section.id === 'exercises' && expandedExercises && (
              <div className="mt-2 pl-4 space-y-2 max-h-64 overflow-y-auto pr-2">
                {exerciseTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="border border-gray-200 bg-gray-50/80 hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => router.push(`/lessons/unit/${unit.id}/task/${task.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-gray-800">{task.title}</h4>
                          <p className="text-xs text-gray-500">{task.subtitle || 'Optional task'}</p>
                        </div>
                        <div className="text-xs font-bold text-gray-400">{task.progress}%</div>
                      </div>
                      <div className="mt-2 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Unit info card (ixtiyoriy) */}
        <Card className="border border-gray-200 mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">About this unit</h3>
            <p className="text-gray-600 text-sm mb-4">
              {unit.description || "Complete all sections to master this unit."}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {sections.length}
                </div>
                <div className="text-xs text-gray-600 font-medium">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {sections.filter(s => s.progress === 100).length}
                </div>
                <div className="text-xs text-gray-600 font-medium">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(sections.reduce((sum, s) => sum + s.progress, 0) / sections.length)}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}