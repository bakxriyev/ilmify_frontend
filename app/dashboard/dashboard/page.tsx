"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useAuth } from "@/contexts/AuthContext"
import { api, GroupLesson, Payment, Student } from "@/lib/api"
import { ScheduleView } from "@/components/schedule/ScheduleView"
import {
  Users, BookOpen, Calendar, Newspaper, CreditCard, Clock, ArrowRight,
  ChevronLeft, ChevronRight, GraduationCap, School, UserCheck, AlertTriangle,
  DollarSign, TrendingUp, MapPin, Phone, Mail, Bell, BellRing, X, CheckCircle2,
  UserX, Percent, CalendarDays, Menu, Wallet, Eye, EyeOff, XCircle
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, isToday, startOfMonth, endOfMonth, isFuture } from "date-fns"

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

export default function DashboardPage() {
  const { user, isStudent, isTeacher, isParent } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  // Student data
  const [studentGroup, setStudentGroup] = useState<any>(null)
  const [studentLessons, setStudentLessons] = useState<GroupLesson[]>([])
  const [studentPayments, setStudentPayments] = useState<Payment[]>([])
  const [studentMonthAttendance, setStudentMonthAttendance] = useState<any>(null)

  // Teacher data
  const [teacherGroups, setTeacherGroups] = useState<any[]>([])
  const [isTeacherGroupsLoading, setIsTeacherGroupsLoading] = useState(true)
  const [teacherStats, setTeacherStats] = useState<{ groups: number; students: number } | null>(null)

  // Parent data
  const [parentChildren, setParentChildren] = useState<Student[]>([])
  const [childrenDetails, setChildrenDetails] = useState<Record<string, { lessons: GroupLesson[]; payments: Payment[]; attendance: any }>>({})

  // News
  const [news, setNews] = useState<any[]>([])
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)

  // ---------- Load Student Data ----------
  const loadStudentData = useCallback(async () => {
    if (!user?.id || !isStudent) return
    try {
      const student = await api.getStudentById(user.id.toString())
      const gs = student.group_students?.[0]
      if (gs?.group) {
        setStudentGroup(gs.group)
        const [lessons, payments] = await Promise.all([
          api.getGroupLessons(gs.group.id).catch(() => []),
          api.getStudentPayments(user.id.toString()).catch(() => []),
        ])
        setStudentLessons(lessons)
        setStudentPayments(payments)

        // Load current month attendance
        const now = new Date()
        try {
          const grid = await api.getMonthlyAttendanceGrid(gs.group.id, now.getFullYear(), now.getMonth() + 1)
          setStudentMonthAttendance(grid)
        } catch {}
      }
    } catch (err) {
      console.error("Student data load error:", err)
    }
  }, [user?.id, isStudent])

  // ---------- Load Teacher Data ----------
  const loadTeacherData = useCallback(async () => {
    if (!user?.id || !isTeacher) return
    try {
      setIsTeacherGroupsLoading(true)
      const groupsData = await api.getTeacherGroups(Number(user.id))
      const allGroups = [...(groupsData.main_groups || []), ...(groupsData.support_groups || [])]
      setTeacherGroups(allGroups)
      const totalStudents = allGroups.reduce((s: number, g: any) => s + (g.student_count || 0), 0)
      setTeacherStats({
        groups: groupsData.total_groups,
        students: totalStudents,
      })
    } catch (err) {
      console.error("Teacher data load error:", err)
    } finally {
      setIsTeacherGroupsLoading(false)
    }
  }, [user?.id, isTeacher])

  // ---------- Load Parent Data ----------
  const loadParentData = useCallback(async () => {
    if (!user?.id || !isParent) return
    try {
      const children = await api.getParentChildren(Number(user.id))
      setParentChildren(children)

      // Load details for each child
      const details: Record<string, any> = {}
      await Promise.all(children.map(async (child) => {
        const gs = child.group_students?.[0]
        if (!gs?.group) return
        try {
          const [lessons, payments, grid] = await Promise.all([
            api.getGroupLessons(gs.group.id).catch(() => [] as GroupLesson[]),
            api.getStudentPayments(child.id).catch(() => [] as Payment[]),
            api.getMonthlyAttendanceGrid(gs.group.id, new Date().getFullYear(), new Date().getMonth() + 1).catch(() => null),
          ])
          details[child.id] = { lessons, payments, attendance: grid }
        } catch {}
      }))
      setChildrenDetails(details)
    } catch (err) {
      console.error("Parent data load error:", err)
    }
  }, [user?.id, isParent])

  // ---------- Load News ----------
  const loadNews = useCallback(async () => {
    try {
      const data = await api.getNews()
      if (data && data.length > 0) setNews(data)
    } catch {}
  }, [])

  // ---------- Initial Load ----------
  useEffect(() => {
    Promise.all([
      loadStudentData(),
      loadTeacherData(),
      loadParentData(),
      loadNews(),
    ]).finally(() => setIsLoading(false))
  }, [loadStudentData, loadTeacherData, loadParentData, loadNews])

  // Auto news slider
  useEffect(() => {
    if (news.length <= 1) return
    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [news.length])

  // ---------- Helpers ----------
  const getCurrentMonthPayment = (payments: Payment[]): { status: string; amount: number; paid: number } => {
    const now = new Date()
    const monthPayments = payments.filter(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear())
    const total = monthPayments.reduce((s, p) => s + Number(p.amount), 0)
    const paid = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
    const anyPaid = monthPayments.some(p => p.status === 'paid')
    const anyPartial = monthPayments.some(p => p.status === 'partial')
    const status = anyPaid ? (anyPartial ? 'partial' : 'paid') : 'unpaid'
    return { status, amount: total || 0, paid }
  }

  const getStudentAttendancePercent = (studentId: string, studentGroupId: string, grid: any): number => {
    if (!grid?.lessons?.length || !grid?.attendance_map) return 0
    const total = grid.lessons.length
    let present = 0
    for (const lesson of grid.lessons) {
      const attMap = grid.attendance_map[lesson.id]
      if (attMap && attMap[studentId]?.is_present) present++
    }
    return total > 0 ? Math.round((present / total) * 100) : 0
  }

  const getTodayLessons = (lessons: GroupLesson[]): GroupLesson[] => {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    return lessons.filter(l => l.date === todayStr)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  // ===================== STUDENT DASHBOARD =====================
  if (isStudent && user) {
    const currentMonthPay = getCurrentMonthPayment(studentPayments)
    const todayLessons = getTodayLessons(studentLessons)
    const upcomingLessons = studentLessons.filter(l => !isFuture(parseISO(l.date)) === false).slice(0, 3)
    const attPercent = studentGroup ? getStudentAttendancePercent(user.id.toString(), studentGroup.id, studentMonthAttendance) : 0

    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">Xush kelibsiz, {(user as any).first_name || "Oquvchi"}!</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {todayLessons.length > 0 ? "Bugungi darslar" : "Dars jadvali"}
                  </h2>
                </div>
                <ScheduleView
                  lessons={studentLessons}
                  groupName={studentGroup?.name}
                  roomName={studentGroup?.room?.name}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <School className="h-5 w-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Mening guruhim</h2>
                  </div>
                  {studentGroup ? (
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-gray-900">{studentGroup.name}</p>
                      {studentGroup.level && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="h-4 w-4" />
                          <span>{studentGroup.level.name || studentGroup.level.title}</span>
                        </div>
                      )}
                      {studentGroup.room && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>Xona: {studentGroup.room.name}</span>
                        </div>
                      )}
                      {studentGroup.monthly_price && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>Oylik: {Number(studentGroup.monthly_price).toLocaleString()} UZS</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Guruhga biriktirilmagansiz</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Ustozlarim</h2>
                  </div>
                  {studentGroup ? (
                    <div className="space-y-3">
                      {studentGroup.mainTeacher && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={studentGroup.mainTeacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${studentGroup.mainTeacher.photo}` : ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {studentGroup.mainTeacher.first_name?.[0]}{studentGroup.mainTeacher.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {studentGroup.mainTeacher.first_name} {studentGroup.mainTeacher.last_name}
                            </p>
                            <p className="text-xs text-gray-500">Asosiy oqituvchi</p>
                          </div>
                        </div>
                      )}
                      {studentGroup.supportTeacher && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={studentGroup.supportTeacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${studentGroup.supportTeacher.photo}` : ""} />
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {studentGroup.supportTeacher.first_name?.[0]}{studentGroup.supportTeacher.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {studentGroup.supportTeacher.first_name} {studentGroup.supportTeacher.last_name}
                            </p>
                            <p className="text-xs text-gray-500">Yordamchi oqituvchi</p>
                          </div>
                        </div>
                      )}
                      {!studentGroup.mainTeacher && !studentGroup.supportTeacher && (
                        <p className="text-sm text-gray-400">Oqituvchi malumotlari yoq</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Malumot yoq</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Percent className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Davomat</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke={attPercent >= 80 ? "#22c55e" : attPercent >= 50 ? "#eab308" : "#ef4444"} strokeWidth="3"
                        strokeDasharray={`${attPercent * 1.005} 100.5`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                      {attPercent}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Joriy oy uchun davomat</p>
                    {studentMonthAttendance?.lessons && (
                      <p className="text-xs text-gray-400">{studentMonthAttendance.lessons.length} ta dars</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className={`border ${currentMonthPay.status === 'paid' ? 'border-green-200 bg-green-50' : currentMonthPay.status === 'partial' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className={`h-5 w-5 ${currentMonthPay.status === 'paid' ? 'text-green-600' : currentMonthPay.status === 'partial' ? 'text-yellow-600' : 'text-red-600'}`} />
                  <h2 className="text-lg font-semibold text-gray-900">Tolov</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Holat</span>
                    <Badge className={
                      currentMonthPay.status === 'paid' ? 'bg-green-100 text-green-700 border-0' :
                      currentMonthPay.status === 'partial' ? 'bg-yellow-100 text-yellow-700 border-0' :
                      'bg-red-100 text-red-700 border-0'
                    }>
                      {currentMonthPay.status === 'paid' ? 'Tolangan' : currentMonthPay.status === 'partial' ? 'Qisman' : 'Tolanmagan'}
                    </Badge>
                  </div>
                  {currentMonthPay.amount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Summa</span>
                        <span className="font-semibold text-gray-900">{currentMonthPay.amount.toLocaleString()} UZS</span>
                      </div>
                      {currentMonthPay.status !== 'paid' && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Qarzdorlik</span>
                          <span className="font-semibold text-red-600">{(currentMonthPay.amount - currentMonthPay.paid).toLocaleString()} UZS</span>
                        </div>
                      )}
                    </>
                  )}
                  {studentGroup?.monthly_price && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Oylik narx</span>
                      <span className="font-semibold text-gray-900">{Number(studentGroup.monthly_price).toLocaleString()} UZS</span>
                    </div>
                  )}
                </div>
                {currentMonthPay.status !== 'paid' && (
                  <Link href="/dashboard/profile">
                    <Button variant="outline" size="sm" className="w-full mt-3 border-red-200 text-red-600 hover:bg-red-50">
                      Tolov qilish
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {todayLessons.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Bugungi dars</h2>
                  </div>
                  {todayLessons
                    .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"))
                    .map((lesson) => (
                      <div key={lesson.id} className="flex items-start gap-3 py-2 border-b border-blue-100 last:border-0">
                        <div className="w-10 h-10 bg-blue-200 rounded-xl flex items-center justify-center shrink-0">
                          <Clock className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {lesson.unit?.name || lesson.unit?.title || "Dars"}
                          </p>
                          <p className="text-xs text-gray-600">{lesson.time}</p>
                          {studentGroup?.room && <p className="text-xs text-gray-400">{studentGroup.room.name}</p>}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {studentPayments.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Oxirgi tolovlar</h3>
                  <div className="space-y-1.5">
                    {studentPayments.slice(-3).reverse().map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{p.month}.{p.year}</span>
                        <span className="font-medium">{p.amount.toLocaleString()} UZS</span>
                        <Badge className={`text-[10px] ${p.status === 'paid' ? 'bg-green-100 text-green-700' : p.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} border-0`}>
                          {p.status === 'paid' ? 'Tolangan' : p.status === 'partial' ? 'Qisman' : 'Tolanmagan'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {news.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Yangiliklar</h2>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <div className="relative h-64">
                  <img
                    src={news[currentNewsIndex]?.image ? `${process.env.NEXT_PUBLIC_API_URL}${news[currentNewsIndex].image.startsWith('/') ? '' : '/uploads/news/'}${news[currentNewsIndex].image}` : "/placeholder.svg"}
                    alt={news[currentNewsIndex]?.title || ""}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x400/6366f1/ffffff?text=Yangilik" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{news[currentNewsIndex]?.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{news[currentNewsIndex]?.description}</p>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    {news.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentNewsIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentNewsIndex ? "bg-white scale-110" : "bg-white/50"}`} />
                    ))}
                  </div>
                  <button onClick={() => setCurrentNewsIndex(p => (p - 1 + news.length) % news.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/50">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setCurrentNewsIndex(p => (p + 1) % news.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 rounded-full text-white hover:bg-black/50">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    )
  }

  // ===================== TEACHER DASHBOARD =====================
  if (isTeacher) {
    const totalMonthlyIncome = teacherGroups.reduce((s: number, g: any) => s + ((g.kp || 0) * (g.student_count || 0)), 0)
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Xush kelibsiz, {user && 'first_name' in user ? (user as any).first_name : "Oqituvchi"}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Sizning guruhlaringiz va oquvchilaringiz</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <School className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teacherStats?.groups || teacherGroups.length}</p>
                <p className="text-sm text-white/80">Jami guruhlar</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teacherStats?.students || 0}</p>
                <p className="text-sm text-white/80">Jami oquvchilar</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMonthlyIncome.toLocaleString()} so'm</p>
                <p className="text-sm text-white/80">Oylik daromad</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-700 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teacherGroups.filter((g: any) => g.teacher_id === user?.id).length}</p>
                <p className="text-sm text-white/80">Asosiy guruhlar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <School className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mening guruhlarim</h2>
            <span className="text-sm text-gray-400">({teacherGroups.length} ta)</span>
          </div>
          {isTeacherGroupsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-white rounded-2xl animate-pulse p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : teacherGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherGroups.map((group) => {
                const isMain = group.teacher_id === user?.id
                const income = (group.kp || 0) * (group.student_count || 0)
                return (
                  <Link href={`/dashboard/marks?groupId=${group.id}`} key={group.id}>
                    <Card className={`hover:shadow-xl transition-all duration-200 cursor-pointer border-0 shadow-md overflow-hidden group ${isMain ? 'ring-1 ring-blue-200' : 'ring-1 ring-gray-200'}`}>
                      <div className={`h-1.5 ${isMain ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base truncate">{group.name}</h3>
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 font-medium ${isMain ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                              {isMain ? "Asosiy oqituvchi" : "Yordamchi oqituvchi"}
                            </span>
                          </div>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMain ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Users className={`h-5 w-5 ${isMain ? 'text-blue-600' : 'text-gray-500'}`} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {group.room && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{group.room.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Users className="h-3.5 w-3.5" />
                            <span>{group.student_count || 0} oquvchi</span>
                          </div>
                          {group.kp ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <Wallet className="h-3.5 w-3.5" />
                              <span>{Number(group.kp).toLocaleString()} so'm</span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>{income.toLocaleString()} so'm/oy</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <School className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg font-medium">Hozircha sizga biriktirilgan guruh mavjud emas</p>
                <p className="text-gray-400 text-sm mt-2">Administrator bilan bog'laning!</p>
              </CardContent>
            </Card>
          )}
        </section>

        {news.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Yangiliklar </h2>
            </div>
            <Card className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-0 relative">
                <div className="relative h-64">
                  <img src={news[currentNewsIndex]?.image ? `${process.env.NEXT_PUBLIC_API_URL}${news[currentNewsIndex].image.startsWith('/') ? '' : '/uploads/news/'}${news[currentNewsIndex].image}` : "https://placehold.co/800x400/6366f1/ffffff?text=Yangilik"} alt={news[currentNewsIndex]?.title || ""} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x400/6366f1/ffffff?text=Yangilik" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{news[currentNewsIndex]?.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{news[currentNewsIndex]?.description}</p>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    {news.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentNewsIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentNewsIndex ? "bg-white scale-110" : "bg-white/50"}`} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    )
  }

  // ===================== PARENT DASHBOARD =====================
  if (isParent) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Xush kelibsiz, {user && "first_name" in user ? `${(user as any).first_name} ${(user as any).last_name}` : "Ota-ona"}!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{parentChildren.length}</p>
                <p className="text-sm text-white/80">Farzandlarim</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {parentChildren.filter((c: any) => c.group_students?.[0]?.group).length}
                </p>
                <p className="text-sm text-white/80">Guruhda</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">Farzandlarim</h2>
          </div>
          {parentChildren.length > 0 ? (
            <div className="space-y-6">
              {parentChildren.map((child) => {
                const gs = child.group_students?.[0]
                const group = gs?.group
                const childData = childrenDetails[child.id]
                const childPayments = childData?.payments || []
                const childLessons = childData?.lessons || []
                const childGrid = childData?.attendance
                const pay = getCurrentMonthPayment(childPayments)
                const attPercent = childGrid ? getStudentAttendancePercent(child.id, group?.id, childGrid) : 0

                return (
                  <Card key={child.id} className="border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-white/50 shrink-0">
                          <AvatarImage src={child.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${child.photo}` : ""} />
                          <AvatarFallback className="bg-white/20 text-white text-lg">
                            {child.first_name?.[0]}{child.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-white">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg">{child.first_name} {child.last_name}</h3>
                            <Badge className={`border-0 text-[10px] ${child.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                              {child.isActive ? "Faol" : "Nofaol"}
                            </Badge>
                          </div>
                          {group && (
                            <div className="flex items-center gap-3 text-sm text-white/80 mt-0.5">
                              <span className="flex items-center gap-1"><School className="h-3.5 w-3.5" /> {group.name}</span>
                              {group.room && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {group.room.name}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-5 space-y-5">
                      {/* Stats row: Attendance + Payment */}
                      <div className="grid grid-cols-2 gap-3">
                        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-green-100">
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="relative w-14 h-14 shrink-0">
                              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#d1d5db" strokeWidth="3" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke={attPercent >= 80 ? "#22c55e" : attPercent >= 50 ? "#eab308" : "#ef4444"} strokeWidth="3"
                                  strokeDasharray={`${attPercent * 1.005} 100.5`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                                {attPercent}%
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Davomat</p>
                              <p className="text-[10px] text-gray-500">{childGrid?.lessons?.length || 0} ta dars</p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={`border-0 ${pay.status === 'paid' ? 'bg-gradient-to-br from-green-50 to-emerald-100' : pay.status === 'partial' ? 'bg-gradient-to-br from-amber-50 to-yellow-100' : 'bg-gradient-to-br from-red-50 to-rose-100'}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-700">To'lov</span>
                              {pay.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                               pay.status === 'partial' ? <Clock className="h-4 w-4 text-amber-600" /> :
                               <XCircle className="h-4 w-4 text-red-500" />}
                            </div>
                            <Badge className={`border-0 text-[10px] ${pay.status === 'paid' ? 'bg-green-200 text-green-800' : pay.status === 'partial' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'}`}>
                              {pay.status === 'paid' ? "To'langan" : pay.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                            </Badge>
                            {pay.amount > 0 && (
                              <p className="text-xs font-semibold text-gray-800 mt-1">{pay.amount.toLocaleString()} UZS</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Full Schedule */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarDays className="h-4 w-4 text-purple-600" />
                          <h4 className="text-sm font-semibold text-gray-800">Dars jadvali</h4>
                        </div>
                        {childLessons.length > 0 ? (
                          <ScheduleView
                            lessons={childLessons}
                            groupName={group?.name}
                            roomName={group?.room?.name}
                          />
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-4">Dars jadvali mavjud emas</p>
                        )}
                      </div>

                      {/* Absence alert */}
                      {childGrid && (() => {
                        const todayStr = new Date().toISOString().split('T')[0]
                        const todayLessons = childLessons.filter(l => l.date === todayStr)
                        const absentToday = todayLessons.filter(l => {
                          const map = childGrid.attendance_map?.[l.id]
                          return map && map[child.id] && !map[child.id].is_present
                        })
                        return absentToday.length > 0 ? (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-xs text-red-700">Farzandingiz bugungi darsga kelmagan ({absentToday.length} ta)</p>
                          </div>
                        ) : null
                      })()}

                      {/* Recent Payments */}
                      {childPayments.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-emerald-600" />
                              <h4 className="text-sm font-semibold text-gray-800">Oxirgi to'lovlar</h4>
                            </div>
                            <Link href={`/dashboard/payments?childId=${child.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600">
                                Barchasi
                              </Button>
                            </Link>
                          </div>
                          <div className="space-y-1.5">
                            {childPayments.slice(-5).reverse().map((p: Payment) => (
                              <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg border ${
                                p.status === 'paid' ? 'border-green-100 bg-green-50/50' :
                                p.status === 'partial' ? 'border-amber-100 bg-amber-50/50' :
                                'border-red-100 bg-red-50/50'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {p.status === 'paid' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> :
                                   p.status === 'partial' ? <Clock className="h-3.5 w-3.5 text-amber-600" /> :
                                   <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                  <span className="text-xs font-medium text-gray-700">{MONTHS[p.month - 1]} {p.year}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-800">{p.amount.toLocaleString()} UZS</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Link href={`/dashboard/marks?childId=${child.id}`} className="flex-1">
                          <Button size="sm" className="w-full text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0">
                            <Percent className="h-3.5 w-3.5 mr-1" />
                            Davomat
                          </Button>
                        </Link>
                        <Link href={`/dashboard/payments?childId=${child.id}`} className="flex-1">
                          <Button size="sm" className="w-full text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 border-0">
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            To'lovlar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Sizga biriktirilgan farzand yoq</p>
                <p className="text-sm text-gray-400 mt-1">Administrator bilan boglaning</p>
              </CardContent>
            </Card>
          )}
        </section>

        {news.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Yangiliklar</h2>
            </div>
            <Card className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-0 relative">
                <div className="relative h-64">
                  <img src={news[currentNewsIndex]?.image ? `${process.env.NEXT_PUBLIC_API_URL}${news[currentNewsIndex].image.startsWith('/') ? '' : '/uploads/news/'}${news[currentNewsIndex].image}` : "https://placehold.co/800x400"} alt={news[currentNewsIndex]?.title || ""} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x400/6366f1/ffffff?text=Yangilik" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold">{news[currentNewsIndex]?.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{news[currentNewsIndex]?.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 text-center text-gray-500">
      Iltimos, profilingiz toliq yuklanishini kuting.
    </div>
  )
}
