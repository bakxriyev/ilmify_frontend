"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Medal, 
  Award, 
  Loader2, 
  Star, 
  Coins as CoinIcon, 
  Users, 
  Flag, 
  UserCheck 
} from "lucide-react";
import { api } from "@/lib/api";

// ------------------------------
// Types
// ------------------------------
interface LeaderboardEntry {
  id: number;
  student_id: string;
  coins: number;
  scores: number;
  createdAt: string;
  updatedAt: string;
}

interface StudentWithScore {
  rank: number;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  photo: string | null;
  levelName: string;
  groupName?: string;
  scores: number;
  coins: number;
}

// ------------------------------
// Compact Responsive Radar Chart
// ------------------------------
function RadarChart() {
  const centerX = 130;
  const centerY = 130;
  const maxRadius = 88;

  const skillData = [
    { name: "Vocabulary", percent: 99, angle: -90, icon: "📖" },
    { name: "Grammar", percent: 87, angle: -30, icon: "A+" },
    { name: "Listening", percent: 80, angle: 30, icon: "🎧" },
    { name: "Writing", percent: 95, angle: 90, icon: "✍️" },
    { name: "Reading", percent: 92, angle: 150, icon: "📚" },
    { name: "Pronunciation", percent: 100, angle: 210, icon: "🔊" },
  ];

  let outerPoints = "";
  let dataPoints = "";

  skillData.forEach((skill) => {
    const rad = (skill.angle * Math.PI) / 180;
    const ox = centerX + maxRadius * Math.cos(rad);
    const oy = centerY + maxRadius * Math.sin(rad);
    outerPoints += `${ox},${oy} `;

    const dataRadius = (skill.percent / 100) * maxRadius;
    const dx = centerX + dataRadius * Math.cos(rad);
    const dy = centerY + dataRadius * Math.sin(rad);
    dataPoints += `${dx},${dy} `;
  });

  return (
    <div className="relative w-full max-w-[260px] mx-auto aspect-square">
      <svg width="260" height="260" viewBox="0 0 260 260" className="drop-shadow-xl w-full h-full">
        <polygon points={outerPoints} fill="none" stroke="#E5E7EB" strokeWidth="9" strokeLinejoin="round" />
        {skillData.map((_, i) => {
          const rad = (skillData[i].angle * Math.PI) / 180;
          const ox = centerX + maxRadius * Math.cos(rad);
          const oy = centerY + maxRadius * Math.sin(rad);
          return <line key={i} x1={centerX} y1={centerY} x2={ox} y2={oy} stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4 4" />;
        })}
        <polygon points={dataPoints} fill="#FEF08C" fillOpacity="0.92" stroke="#FACC15" strokeWidth="6" strokeLinejoin="round" />
        {skillData.map((skill, i) => {
          const rad = (skill.angle * Math.PI) / 180;
          const r = (skill.percent / 100) * maxRadius;
          const x = centerX + r * Math.cos(rad);
          const y = centerY + r * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="6.5" fill="#FACC15" />
              <circle cx={x} cy={y} r="3" fill="#fff" />
            </g>
          );
        })}
      </svg>

      {skillData.map((skill, i) => {
        const rad = (skill.angle * Math.PI) / 180;
        const labelR = maxRadius + 26;
        const x = centerX + labelR * Math.cos(rad);
        const y = centerY + labelR * Math.sin(rad);
        return (
          <div
            key={i}
            className="absolute text-center pointer-events-none text-xs"
            style={{ left: `${x - 28}px`, top: `${y - 16}px`, width: "56px" }}
          >
            <div className="text-xl mb-0.5">{skill.icon}</div>
            <div className="font-bold text-yellow-800 tracking-widest">{skill.name.toUpperCase()}</div>
            <div className="font-black text-yellow-900 -mt-1">{skill.percent}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------
// TO'LIQ RESPONSIVE RANKING PAGE
// ------------------------------
export default function RankingPage() {
  const [students, setStudents] = useState<StudentWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"school" | "branch" | "group">("school");
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("student");
    if (stored) {
      try {
        const student = JSON.parse(stored);
        setCurrentStudentId(student.id);
      } catch (e) {}
    }

    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const leaderboardData: LeaderboardEntry[] = await api.getLeaderboard();

        const studentPromises = leaderboardData.map((entry) =>
          api.getStudentById(entry.student_id).then((student) => ({ ...entry, student })).catch(() => null)
        );

        const results = await Promise.all(studentPromises);

        const validResults = results
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map((item) => {
            const s = item.student;
            const gs = s.group_students?.[0];
            return {
              studentId: s.id,
              firstName: s.first_name,
              lastName: s.last_name,
              fullName: `${s.first_name} ${s.last_name}`,
              photo: s.photo,
              levelName: gs?.group?.level?.name || "No level",
              groupName: gs?.group?.name,
              scores: item.scores,
              coins: item.coins,
            };
          });

        const sorted = validResults
          .sort((a, b) => b.scores - a.scores)
          .map((st, i) => ({ ...st, rank: i + 1 }));

        setStudents(sorted);
      } catch (err) {
        setError("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const top3 = students.slice(0, 3);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400 drop-shadow" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-slate-300 drop-shadow" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-500 drop-shadow" />;
    return <span className="text-2xl font-black text-blue-900">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-300 to-amber-400 border-2 border-yellow-400";
    if (rank === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 border-2 border-slate-300";
    if (rank === 3) return "bg-gradient-to-br from-orange-300 to-amber-400 border-2 border-orange-400";
    return "bg-blue-50 border border-blue-200";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1280px] mx-auto">
        {/* ===================== RESPONSIVE CONTAINER ===================== */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* ===================== MAIN CONTENT ===================== */}
          <div className="flex-1 min-w-0">
            {/* PODIUM — responsive */}
            {!loading && top3.length === 3 && (
              <div className="mb-8 bg-gradient-to-br from-yellow-300 via-amber-300 to-yellow-400 rounded-3xl p-5 sm:p-8 lg:p-10 relative shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.65),transparent)]" />

                <div className="flex justify-center items-end gap-4 sm:gap-6 lg:gap-8 relative">
                  {/* 2-o‘rin */}
                  <div className="flex flex-col items-center">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-4 ring-white shadow-md mb-2">
                      <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${top3[1].photo}`} />
                      <AvatarFallback className="bg-black text-white text-3xl">M</AvatarFallback>
                    </Avatar>
                    <div className="w-20 h-32 sm:w-24 sm:h-36 lg:w-24 lg:h-36 bg-gradient-to-b from-amber-400 to-yellow-600 rounded-t-2xl flex items-end justify-center relative shadow">
                      <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-yellow-500 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-black text-yellow-600">2</span>
                      </div>
                    </div>
                    <p className="mt-3 text-base sm:text-lg font-semibold text-blue-900 text-center">{top3[1].firstName}</p>
                  </div>

                  {/* 1-o‘rin */}
                  <div className="flex flex-col items-center -mt-3 sm:-mt-4 lg:-mt-6">
                    <Avatar className="h-18 w-18 sm:h-20 sm:w-20 lg:h-24 lg:w-24 ring-4 ring-white shadow-lg mb-2 scale-110">
                      <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${top3[0].photo}`} />
                      <AvatarFallback className="bg-black text-white text-4xl">D</AvatarFallback>
                    </Avatar>
                    <div className="w-24 h-40 sm:w-28 sm:h-44 lg:w-32 lg:h-48 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-3xl flex items-end justify-center relative shadow-2xl">
                      <div className="absolute -top-6 sm:-top-7 lg:-top-8 left-1/2 -translate-x-1/2 bg-white w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-4 lg:border-5 border-yellow-400 flex items-center justify-center">
                        <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-yellow-600">1</span>
                      </div>
                    </div>
                    <p className="mt-3 text-lg sm:text-xl lg:text-2xl font-bold text-blue-900 flex items-center gap-1">
                      {top3[0].firstName} 👑
                    </p>
                  </div>

                  {/* 3-o‘rin */}
                  <div className="flex flex-col items-center">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-4 ring-white shadow-md mb-2">
                      <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${top3[2].photo}`} />
                      <AvatarFallback className="bg-black text-white text-3xl">A</AvatarFallback>
                    </Avatar>
                    <div className="w-20 h-32 sm:w-24 sm:h-36 lg:w-24 lg:h-36 bg-gradient-to-b from-orange-400 to-amber-600 rounded-t-2xl flex items-end justify-center relative shadow">
                      <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 bg-white w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-orange-500 flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl font-black text-orange-600">3</span>
                      </div>
                    </div>
                    <p className="mt-3 text-base sm:text-lg font-semibold text-blue-900 text-center">{top3[2].firstName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs + Filter — responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="inline-flex bg-white rounded-3xl p-1 shadow-sm w-full sm:w-auto">
                <Button variant="default" className="flex-1 sm:flex-none rounded-3xl px-6 py-2.5 text-sm">My level</Button>
                <Button variant="ghost" className="flex-1 sm:flex-none rounded-3xl px-6 py-2.5 text-sm text-gray-500">All levels</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {["By branch", "By group", "By school"].map((text, idx) => (
                  <Button
                    key={idx}
                    variant={filter === (idx === 0 ? "branch" : idx === 1 ? "group" : "school") ? "default" : "outline"}
                    onClick={() => setFilter(idx === 0 ? "branch" : idx === 1 ? "group" : "school")}
                    className="rounded-2xl px-5 py-2 text-sm whitespace-nowrap"
                  >
                    {text}
                  </Button>
                ))}
              </div>
            </div>

            {/* Leaderboard — responsive */}
            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50 p-6 text-red-600 text-center">
                {error}
              </Card>
            )}

            {!loading && !error && (
              <div className="space-y-2.5">
                {students.slice(0, 15).map((student) => (
                  <div
                    key={student.studentId}
                    className={`flex items-center px-4 sm:px-6 py-4 rounded-2xl border-2 transition-all hover:shadow ${getRankColor(
                      student.rank
                    )} ${student.studentId === currentStudentId ? "ring-2 ring-blue-500" : ""}`}
                  >
                    <div className="w-9 sm:w-11 flex justify-center flex-shrink-0">
                      {getRankIcon(student.rank)}
                    </div>

                    <Avatar className="h-11 w-11 sm:h-12 sm:w-12 border-2 border-white shadow ml-3 flex-shrink-0">
                      <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${student.photo}`} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg">
                        {student.firstName[0]}{student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="ml-4 sm:ml-5 flex-1 min-w-0">
                      <p className="font-bold text-base sm:text-lg text-blue-950 truncate">{student.fullName}</p>
                      <p className="text-blue-600 text-sm">{student.levelName}</p>
                      {student.groupName && <p className="text-xs text-gray-500 truncate">{student.groupName}</p>}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tighter">
                          {student.scores.toLocaleString("ru-RU")}
                        </div>
                      </div>
                      <Star className="h-7 w-7 text-yellow-400 fill-yellow-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===================== RIGHT SIDEBAR — responsive ===================== */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-5">
            {/* Kamron card */}
            <Card className="shadow border-yellow-400/30">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <Avatar className="h-14 w-14 ring-2 ring-yellow-400 flex-shrink-0">
                    <AvatarImage src="https://i.ibb.co/0jQ9vYJ/kamron-avatar.jpg" />
                    <AvatarFallback className="bg-black text-white text-3xl">KB</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-bold text-xl leading-tight">Kamron Bakhriyev</div>
                    <div className="text-xs text-gray-500">No branch | IELTS</div>
                  </div>
                </div>

                <div className="mt-5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-2xl px-5 py-4 flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-black">0%</div>
                    <div className="text-xs opacity-90">February progress</div>
                  </div>
                  <div className="text-4xl">🚀</div>
                </div>
              </CardContent>
            </Card>

            {/* Coins & Score */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <CoinIcon className="h-7 w-7 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">0</div>
                  <div className="text-[10px] text-gray-500 tracking-widest">COINS</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-7 w-7 text-yellow-500 mx-auto mb-2 fill-current" />
                  <div className="text-2xl font-bold text-blue-900">0</div>
                  <div className="text-[10px] text-gray-500 tracking-widest">SCORE</div>
                </CardContent>
              </Card>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-emerald-200 rounded-2xl p-3 text-center">
                <Users className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <div className="text-xl font-bold text-emerald-600">0nd</div>
                <div className="text-[9px] text-emerald-700">School ranking</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center opacity-70">
                <Flag className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold">x0</div>
                <div className="text-[9px] text-gray-500">Sprint winner</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-3 text-center opacity-70">
                <UserCheck className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold">x0</div>
                <div className="text-[9px] text-gray-500">Smart winner</div>
              </div>
            </div>

            {/* Radar Chart */}
            <Card className="shadow border-yellow-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-yellow-800 text-base">
                  <Star className="h-5 w-5" /> My skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                <RadarChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}