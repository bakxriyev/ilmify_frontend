"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, Users, Phone, Check, X, DollarSign, AlertTriangle, Pencil, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Student, GroupStudent, Level, Group, AttendanceRecord } from "@/lib/api"
import type { TeacherInfo as TeacherInfoType } from "@/lib/api"
import { format, addMonths, subMonths, isFuture, isToday, addHours } from "date-fns"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { AttendanceSelector } from "@/components/AttendanceSelector"
import { ReasonDialog } from "@/components/ReasonDialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// ---------- Constants ----------
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_AVATAR = "/user.png"; // Public papkadagi default rasm

// ---------- Types ----------
interface LessonInfo {
  date: Date
  time: string
  lessonId: string
  unitId?: string
  unitNumber?: string
}

interface AttendanceValue {
  present: boolean
  reason: string | null
  isLoading?: boolean
}

interface TeacherGroup {
  id: string
  name: string
  teacher_id: string
  support_teacher_id: string
  level_id: string
}

// ---------- Helper Functions ----------
const getStudentPhotoUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) return DEFAULT_AVATAR;
  
  // If it's already a full URL, return as is
  if (photoUrl.startsWith('http')) return photoUrl;
  
  // If it's a relative path that doesn't start with /uploads, add the full URL
  if (!photoUrl.startsWith('/uploads')) {
    return `${API_URL}/uploads/students/${photoUrl}`;
  }
  
  // Otherwise, construct the full URL with the correct path
  return `${API_URL}${photoUrl}`;
}

// ---------- Teacher Card ----------
function TeacherInfo({ teacher, role }: { teacher: TeacherInfoType; role: string }) {
  if (!teacher) return null

  const teacherPhotoUrl = getStudentPhotoUrl(teacher.photo)

  return (
    <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-xl shadow-sm hover:shadow-md transition-all">
      <Avatar className="w-9 h-9 ring-2 ring-blue-100">
        <AvatarImage 
          src={teacherPhotoUrl} 
          alt={`${teacher.first_name} ${teacher.last_name}`}
          onError={(e) => {
            // Agar rasm yuklanmasa, default rasmga o'tish
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
        />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold">
          {teacher.first_name?.[0]}{teacher.last_name?.[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 truncate">
            {teacher.first_name} {teacher.last_name}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase tracking-wide">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span className="truncate text-[11px]">{teacher.phone_number}</span>
        </div>
      </div>
    </div>
  )
}

// ---------- Date Header ----------
function DateHeader({ date, unitNumber }: { date: Date; unitNumber?: string }) {
  const isFutureDate = isFuture(date)
  const isTodayDate = isToday(date)

  return (
    <div
      className={`flex flex-col items-center gap-1 min-w-[64px] p-2 rounded-xl transition-colors ${
        isFutureDate ? "opacity-50" : isTodayDate ? "bg-blue-50 border border-blue-200" : ""
      }`}
    >
      <div className="text-sm font-bold text-gray-800">{format(date, "dd")}</div>
      <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
        {format(date, "MMM")}
      </div>
      {unitNumber && (
        <div className="text-[9px] font-bold bg-gradient-to-r from-gray-100 to-gray-200 px-2 py-0.5 rounded-full text-gray-700 mt-1 shadow-inner">
          Unit {unitNumber}
        </div>
      )}
    </div>
  )
}

// ---------- Student Row ----------
function StudentRow({
  student,
  rank,
  dates,
  unitResults,
  attendanceData,
  isLoadingResults,
  isLoadingAttendance,
  mode,
  teacherRole,
  onAttendanceClick,
  onAttendanceSelect,
  onStudentClick,
  debt,
  isLoadingDebt,
}: {
  student: GroupStudent
  rank: number
  dates: LessonInfo[]
  unitResults: Record<string, Record<string, number | null>>
  attendanceData: Record<string, Record<string, AttendanceValue>>
  isLoadingResults: boolean
  isLoadingAttendance: boolean
  mode: "homework" | "attendance"
  teacherRole: 'main' | 'support' | null
  onAttendanceClick: (lessonId: string, studentId: string, currentValue: AttendanceValue | null) => void
  onAttendanceSelect: (lessonId: string, studentId: string, currentValue: AttendanceValue | null, element: HTMLElement) => void
  onStudentClick?: (student: GroupStudent) => void
  debt?: number
  isLoadingDebt?: boolean
}) {
  const displayName = `${student.first_name} ${student.last_name?.charAt(0)}.`
  const studentPhotoUrl = getStudentPhotoUrl(student.photo)

  // Count only lessons that have unit and are not done
  const notDoneCount = dates.filter(dateObj => {
    if (mode !== "homework") return false
    const unitId = dateObj.unitId
    // Only count if there is a unit
    if (!unitId) return false
    
    const lessonDateTime = new Date(dateObj.date)
    const [hours, minutes] = dateObj.time.split(':').map(Number)
    lessonDateTime.setHours(hours, minutes, 0, 0)
    const availableTime = addHours(lessonDateTime, 2)
    const isAvailable = new Date() >= availableTime
    const isPastLesson = !isFuture(dateObj.date)
    
    return isPastLesson && isAvailable && unitResults[student.id]?.[unitId] === null
  }).length

  const rowClass = notDoneCount >= 3 ? "bg-red-50/50 hover:bg-red-100/50" : ""

  const handleCellClick = (event: React.MouseEvent, lessonId: string, date: Date, attendance: AttendanceValue | null) => {
    event.preventDefault()
    if (!teacherRole || isFuture(date)) return

    const element = event.currentTarget as HTMLElement

    if (teacherRole === 'main') {
      onAttendanceSelect(lessonId, student.id, attendance, element)
    } else if (teacherRole === 'support') {
      if (attendance && !attendance.present && !attendance.reason) {
        onAttendanceClick(lessonId, student.id, attendance)
      }
    }
  }

  return (
    <tr className={`group border-t border-gray-100 hover:bg-gray-50/80 transition-colors ${rowClass}`}>
      <td className="sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-5 text-right">{rank}</span>
          <Avatar className="w-7 h-7 ring-1 ring-gray-200">
            <AvatarImage 
              src={studentPhotoUrl} 
              alt={displayName}
              onError={(e) => {
                // Agar rasm yuklanmasa, default rasmga o'tish
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
              {student.first_name?.[0]}{student.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <button type="button" onClick={() => onStudentClick?.(student)} className="text-xs font-semibold text-gray-900 truncate hover:text-blue-600 text-left">{displayName}</button>
            <div className="text-[9px] text-gray-400">{student.phone_number}</div>
            {!isLoadingDebt && debt !== undefined && debt > 0 && (
              <div className="flex items-center gap-0.5 mt-0.5">
                <DollarSign className="w-2.5 h-2.5 text-red-500" />
                <span className="text-[8px] font-bold text-red-500 leading-none">
                  Qarz: {Math.floor(debt).toLocaleString()} so'm
                </span>
              </div>
            )}
            {isLoadingDebt && (
              <div className="text-[8px] text-gray-400 mt-0.5">...</div>
            )}
          </div>
        </div>
      </td>

      {dates.map((dateObj, colIndex) => {
        const lessonId = dateObj.lessonId
        const unitId = dateObj.unitId
        const isFutureDate = isFuture(dateObj.date)

        if (mode === "homework") {
          const lessonDateTime = new Date(dateObj.date)
          const [hours, minutes] = dateObj.time.split(':').map(Number)
          lessonDateTime.setHours(hours, minutes, 0, 0)
          const availableTime = addHours(lessonDateTime, 2)
          const isAvailable = new Date() >= availableTime
          const isPastLesson = !isFutureDate

          const percentage = unitId ? unitResults[student.id]?.[unitId] : null
          const isLoading = isLoadingResults && percentage === undefined

          // Future lessons - always empty
          if (isFutureDate) {
            return <td key={colIndex} className="px-1 py-2" />
          }

          // If no unit is attached to this lesson - always empty
          if (!unitId) {
            return <td key={colIndex} className="px-1 py-2" />
          }

          // Lesson not available yet (less than 2 hours passed) - empty
          if (!isAvailable) {
            return <td key={colIndex} className="px-1 py-2" />
          }

          // Loading state
          if (isLoading) {
            return (
              <td key={colIndex} className="px-1 py-2 text-center align-middle">
                <Skeleton className="w-9 h-9 rounded-full mx-auto" />
              </td>
            )
          }

          // Past lesson with unit, available, but no result - show red 0
          if (percentage === null) {
            return (
              <td key={colIndex} className="px-1 py-2 text-center align-middle">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto shadow-md bg-gradient-to-br from-red-400 to-red-600 text-white">
                  0
                </div>
              </td>
            )
          }

          // Has result - show percentage
          return (
            <td key={colIndex} className="px-1 py-2 text-center align-middle">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto shadow-md ${
                  percentage >= 80
                    ? "bg-gradient-to-br from-green-400 to-green-600 text-white"
                    : "bg-gradient-to-br from-red-400 to-red-600 text-white"
                }`}
              >
                {percentage}
              </div>
            </td>
          )
        }

        // Attendance mode
        const attendance = lessonId ? attendanceData[student.id]?.[lessonId] : null
        const isLoading = isLoadingAttendance && attendance === null

        let isInteractive = false
        if (teacherRole === 'main') {
          isInteractive = true
        } else if (teacherRole === 'support') {
          isInteractive = !!(attendance && !attendance.present && !attendance.reason)
        }

        return (
          <td key={colIndex} className="px-1 py-2 text-center align-middle">
            {isLoading ? (
              <Skeleton className="w-9 h-9 rounded-full mx-auto" />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => handleCellClick(e, lessonId, dateObj.date, attendance)}
                      disabled={!isInteractive}
                      className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto shadow-md transition-all ${
                        isInteractive ? "cursor-pointer hover:scale-110" : "cursor-default"
                      } ${
                        attendance
                          ? attendance.present
                            ? "bg-gradient-to-br from-green-400 to-green-600"
                            : attendance.reason
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-br from-red-400 to-red-600"
                          : isInteractive
                          ? "bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          : "bg-gray-100 text-gray-400 shadow-inner"
                      }`}
                    >
                      {attendance ? (
                        attendance.present ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <X className="w-5 h-5 text-white" />
                        )
                      ) : isInteractive ? (
                        <span className="text-gray-400">+</span>
                      ) : (
                        "—"
                      )}
                    </button>
                  </TooltipTrigger>
                  {attendance && !attendance.present && attendance.reason && (
                    <TooltipContent side="top" className="bg-gray-800 text-white text-xs max-w-[200px]">
                      <p>{attendance.reason}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </td>
        )
      })}
    </tr>
  )
}

// ---------- Skeleton ----------
function MarksSkeleton() {
  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

// ---------- Main Component ----------
export default function MarksPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { user, isStudent, isTeacher } = useAuth()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const [studentData, setStudentData] = useState<Student | null>(null)
  const [groupStudents, setGroupStudents] = useState<GroupStudent[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [levelData, setLevelData] = useState<Level | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([])
  const [teacherRole, setTeacherRole] = useState<'main' | 'support' | null>(null)

  const [mode] = useState<"homework" | "attendance">("attendance")

  // Homework data (null = not done)
  const [unitResults, setUnitResults] = useState<Record<string, Record<string, number | null>>>({})
  const [isResultsLoading, setIsResultsLoading] = useState(false)

  // Attendance data
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, AttendanceValue>>>({})
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)

  // Selector state
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectorAnchor, setSelectorAnchor] = useState<HTMLElement | null>(null)
  const [pendingSelector, setPendingSelector] = useState<{
    lessonId: string
    studentId: string
    currentValue: AttendanceValue | null
  } | null>(null)

  // Student detail modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<GroupStudent | null>(null)
  const [studentPayments, setStudentPayments] = useState<any[] | null>(null)
  const [studentDebts, setStudentDebts] = useState<any>(null)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [groupDebts, setGroupDebts] = useState<Record<string, number>>({})
  const [isLoadingDebts, setIsLoadingDebts] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [editPhoneValue, setEditPhoneValue] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

  const openStudentDetail = async (student: GroupStudent) => {
    setSelectedStudentDetail(student)
    setStudentPayments(null)
    setStudentDebts(null)
    setLoadingPayments(true)
    try {
      const [payments, debts] = await Promise.all([
        api.getStudentPayments(student.id).catch(() => []),
        api.getStudentDebts(student.id).catch(() => null),
      ])
      setStudentPayments(payments)
      setStudentDebts(debts)
    } catch {} finally { setLoadingPayments(false) }
  }

  // Reason dialog
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [pendingAttendance, setPendingAttendance] = useState<{
    lessonId: string
    studentId: string
    studentName: string
    currentValue: AttendanceValue | null
  } | null>(null)

  // ---------- Load Data ----------
  useEffect(() => {
    const initialize = async () => {
      if (!user?.id) return
      setIsLoading(true)
      setError(null)

      try {
        if (isStudent) {
          const student = await api.getStudentById(user.id)
          setStudentData(student)
          const groupId = student.group_students[0]?.group_id
          if (!groupId) throw new Error("No group found for student")
          setSelectedGroupId(groupId)
          await loadGroupData(groupId)
        } else if (isTeacher) {
          const teacherId = Number(user.id)
          const groupsData = await api.getTeacherGroups(teacherId)
          const allGroups = [
            ...(groupsData.main_groups || []),
            ...(groupsData.support_groups || [])
          ]
          setTeacherGroups(allGroups)

          const urlGroupId = searchParams.get('groupId')
          if (urlGroupId && allGroups.some(g => g.id === urlGroupId)) {
            setSelectedGroupId(urlGroupId)
            await loadGroupData(urlGroupId)
          } else if (allGroups.length > 0) {
            const firstGroupId = allGroups[0].id
            setSelectedGroupId(firstGroupId)
            const params = new URLSearchParams(searchParams.toString())
            params.set('groupId', firstGroupId)
            router.push(`${pathname}?${params.toString()}`)
            await loadGroupData(firstGroupId)
          } else {
            setIsLoading(false)
          }
        }
      } catch (err: any) {
        console.error("Error initializing:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }
    initialize()
  }, [user?.id, isStudent, isTeacher])

  const loadGroupData = async (groupId: string) => {
    try {
      const groupStudentsResponse = await api.getGroupStudents(groupId)
      setGroupStudents(groupStudentsResponse.students)

      const fullGroup = await api.getGroup(groupId)
      setGroup(fullGroup)

      const lessonsData = await api.getGroupLessons(groupId)
      setLessons(lessonsData)

      const levelId = fullGroup.level_id
      if (levelId) {
        const level = await api.getLevelById(levelId)
        setLevelData(level)
      }

      if (isTeacher && user) {
        if (fullGroup.mainTeacher?.id === user.id) {
          setTeacherRole('main')
        } else if (fullGroup.supportTeacher?.id === user.id) {
          setTeacherRole('support')
        } else {
          setTeacherRole(null)
        }
      }
    } catch (err) {
      console.error("Error loading group data:", err)
      throw err
    }
  }

  const handleGroupChange = async (groupId: string) => {
    setSelectedGroupId(groupId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('groupId', groupId)
    router.push(`${pathname}?${params.toString()}`)

    setIsLoading(true)
    try {
      await loadGroupData(groupId)
    } catch (err: any) {
      setError(err.message || "Failed to load group data")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------- Generate dates ----------
  const generateDates = (): LessonInfo[] => {
    if (!lessons.length) return []
    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date)
      return (
        lessonDate.getMonth() === currentDate.getMonth() &&
        lessonDate.getFullYear() === currentDate.getFullYear()
      )
    })
    const sortedLessons = [...monthLessons].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    return sortedLessons.map((lesson) => ({
      date: new Date(lesson.date),
      time: lesson.time,
      lessonId: lesson.id,
      unitId: lesson.unit?.id,
      unitNumber: lesson.unit?.unit_number,
    }))
  }

  // ---------- Fetch homework ----------
  useEffect(() => {
    const fetchUnitResults = async () => {
      if (!groupStudents.length || !levelData || mode !== "homework") return
      const dates = generateDates()
      // Only get units that exist
      const relevantUnits = dates.map((d) => d.unitId).filter(Boolean) as string[]
      if (relevantUnits.length === 0) return

      setIsResultsLoading(true)
      
      // Initialize all results as null only for units that exist
      const results: Record<string, Record<string, number | null>> = {}
      for (const student of groupStudents) {
        results[student.id] = {}
        for (const unitId of relevantUnits) {
          results[student.id][unitId] = null
        }
      }

      const promises: Promise<void>[] = []

      for (const student of groupStudents) {
        for (const unitId of relevantUnits) {
          const promise = api
            .getUnitResult(student.id, unitId)
            .then((res) => {
              results[student.id][unitId] = res?.percentage ?? null
            })
            .catch(() => {
              // Keep null on error
            })
          promises.push(promise)
        }
      }

      await Promise.all(promises)
      setUnitResults(results)
      setIsResultsLoading(false)
    }
    fetchUnitResults()
  }, [groupStudents, levelData, currentDate, mode])

  // ---------- Fetch attendance ----------
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!groupStudents.length || !group || mode !== "attendance") return
      const dates = generateDates()
      const relevantLessons = dates.map((d) => d.lessonId).filter(Boolean) as string[]
      if (relevantLessons.length === 0) return

      setIsAttendanceLoading(true)
      const newAttendance: Record<string, Record<string, AttendanceValue>> = {}

      const promises = relevantLessons.map(async (lessonId, index) => {
        const lessonDate = dates[index].date
        const dateStr = format(lessonDate, "yyyy-MM-dd")
        try {
          const records = await api.getGroupAttendance(group.id, dateStr)
          records.forEach((record: AttendanceRecord) => {
            const studentId = record.student_id
            if (!newAttendance[studentId]) newAttendance[studentId] = {}
            newAttendance[studentId][lessonId] = {
              present: record.is_present,
              reason: record.reason,
            }
          })
        } catch (err) {
          console.error(`Failed to fetch attendance for ${dateStr}:`, err)
        }
      })

      await Promise.all(promises)
      setAttendanceData(newAttendance)
      setIsAttendanceLoading(false)
    }
    fetchAttendance()
  }, [groupStudents, group, currentDate, mode])

  // ---------- Fetch group debts for current month ----------
  useEffect(() => {
    const fetchGroupDebts = async () => {
      if (!selectedGroupId || mode !== "attendance") {
        setGroupDebts({})
        return
      }
      setIsLoadingDebts(true)
      try {
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        const summary = await api.getGroupPaymentSummary(selectedGroupId, month, year)
        if (Array.isArray(summary)) {
          const debtMap: Record<string, number> = {}
          summary.forEach((item: any) => {
            const sid = String(item.student?.id)
            if (sid) debtMap[sid] = item.debt || 0
          })
          setGroupDebts(debtMap)
        }
      } catch {
        // silently fail
      } finally {
        setIsLoadingDebts(false)
      }
    }
    fetchGroupDebts()
  }, [selectedGroupId, currentDate, mode])

  // ---------- Attendance handlers ----------
  const handleAttendanceSelect = (lessonId: string, studentId: string, currentValue: AttendanceValue | null, element: HTMLElement) => {
    setSelectorAnchor(element)
    setPendingSelector({ lessonId, studentId, currentValue })
    setSelectorOpen(true)
  }

  const handleAttendanceChoice = async (present: boolean) => {
    if (!pendingSelector) return
    const { lessonId, studentId, currentValue } = pendingSelector

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [lessonId]: { present, reason: null, isLoading: true }
      }
    }))

    try {
      await api.postAttendance({
        lesson_id: Number(lessonId),
        attendance: [{
          student_id: Number(studentId),
          is_present: present,
          reason: null
        }]
      })
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [lessonId]: { present, reason: null }
        }
      }))
    } catch (err) {
      console.error('Failed to update attendance:', err)
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [lessonId]: currentValue || { present: false, reason: null }
        }
      }))
    }
    setPendingSelector(null)
    setSelectorOpen(false)
  }

  const handleAttendanceClick = (lessonId: string, studentId: string, currentValue: AttendanceValue | null) => {
    const student = groupStudents.find(s => s.id === studentId)
    setPendingAttendance({
      lessonId,
      studentId,
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Student',
      currentValue
    })
    setReasonDialogOpen(true)
  }

  const handleReasonSubmit = async (reason: string) => {
    if (!pendingAttendance) return
    const { lessonId, studentId, currentValue } = pendingAttendance

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [lessonId]: { present: false, reason, isLoading: true }
      }
    }))

    try {
      await api.postAttendance({
        lesson_id: Number(lessonId),
        attendance: [{
          student_id: Number(studentId),
          is_present: false,
          reason
        }]
      })
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [lessonId]: { present: false, reason }
        }
      }))
    } catch (err) {
      console.error('Failed to update attendance:', err)
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [lessonId]: currentValue || { present: false, reason: null }
        }
      }))
    }
    setPendingAttendance(null)
  }

  const startEditingPhone = () => {
    setEditPhoneValue(selectedStudentDetail?.phone_number || '')
    setPhoneError(null)
    setEditingPhone(true)
  }

  const handleSavePhone = async () => {
    if (!selectedStudentDetail) return
    const cleaned = editPhoneValue.trim()
    if (!cleaned) {
      setPhoneError('Telefon raqam kiritilishi shart')
      return
    }
    try {
      await api.updateStudent(selectedStudentDetail.id, { phone_number: cleaned })
      setSelectedStudentDetail(prev => prev ? { ...prev, phone_number: cleaned } : null)
      setGroupStudents(prev => prev.map(s =>
        s.id === selectedStudentDetail.id ? { ...s, phone_number: cleaned } : s
      ))
      setEditingPhone(false)
      setPhoneError(null)
    } catch (err: any) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('allaqachon') || msg.toLowerCase().includes('mavjud')) {
        setPhoneError('Bu telefon raqam allaqachon mavjud. Administrator bilan bog\'laning.')
      } else {
        setPhoneError(msg || 'Xatolik yuz berdi')
      }
    }
  }

  const handleCancelEditPhone = () => {
    setEditingPhone(false)
    setPhoneError(null)
  }

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1))
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1))
  const formatMonthYear = (date: Date) => format(date, "MMMM yyyy")

  if (isLoading) return <MarksSkeleton />

  if (error) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-sm mb-2 font-bold">Error occurred</div>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button size="sm" onClick={() => window.location.reload()} className="rounded-full px-6">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dates = generateDates()
  const mainTeacher = group?.mainTeacher || studentData?.group_students[0]?.group?.mainTeacher
  const supportTeacher = group?.supportTeacher || studentData?.group_students[0]?.group?.supportTeacher
  const totalStudents = groupStudents.length

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Attendance Selector Popover - positioned at clicked cell */}
      <AttendanceSelector
        open={selectorOpen}
        anchorEl={selectorAnchor}
        onOpenChange={setSelectorOpen}
        onSelect={handleAttendanceChoice}
      />

      {/* Reason Dialog */}
      <ReasonDialog
        open={reasonDialogOpen}
        onOpenChange={setReasonDialogOpen}
        onSubmit={handleReasonSubmit}
        studentName={pendingAttendance?.studentName || ''}
      />

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {formatMonthYear(currentDate)}
              </h2>
              <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {isTeacher && teacherGroups.length > 0 && (
                <Select value={selectedGroupId || undefined} onValueChange={handleGroupChange}>
                  <SelectTrigger className="w-[200px] bg-white/80 backdrop-blur-sm border-gray-200/50">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200/50">
                <Users className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">{totalStudents} students</span>
              </div>


            </div>
          </div>

          {/* Teachers */}
          <div className="flex flex-wrap gap-2">
            {mainTeacher && <TeacherInfo teacher={mainTeacher} role="Main teacher" />}
            {supportTeacher && <TeacherInfo teacher={supportTeacher} role="Support teacher" />}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-20 px-3 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Students</span>
                  </div>
                </th>
                {dates.map((dateObj, index) => (
                  <th key={index} className="px-1 py-2 text-center">
                    <DateHeader date={dateObj.date} unitNumber={mode === "homework" ? dateObj.unitNumber : undefined} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupStudents.map((student, idx) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    rank={idx + 1}
                    dates={dates}
                    unitResults={unitResults}
                    attendanceData={attendanceData}
                    isLoadingResults={isResultsLoading}
                    isLoadingAttendance={isAttendanceLoading}
                    mode={mode}
                    teacherRole={teacherRole}
                    onAttendanceClick={handleAttendanceClick}
                    onAttendanceSelect={handleAttendanceSelect}
                    onStudentClick={openStudentDetail}
                    debt={groupDebts[student.id]}
                    isLoadingDebt={isLoadingDebts}
                  />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      <Dialog open={!!selectedStudentDetail} onOpenChange={(open) => { if (!open) { setSelectedStudentDetail(null); setStudentPayments(null); setStudentDebts(null); setEditingPhone(false); setPhoneError(null); }}}>
        <DialogContent className="bg-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedStudentDetail ? `${selectedStudentDetail.first_name} ${selectedStudentDetail.last_name}` : ''}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              O'quvchi ma'lumotlari
            </DialogDescription>
          </DialogHeader>
          {selectedStudentDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-xs">
                <div>
                  <span className="text-gray-500">Telefon:</span>
                  {editingPhone ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editPhoneValue}
                        onChange={(e) => { setEditPhoneValue(e.target.value); setPhoneError(null) }}
                        className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSavePhone(); if (e.key === 'Escape') handleCancelEditPhone() }}
                      />
                      <button type="button" onClick={handleSavePhone} className="p-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors flex-shrink-0" title="Saqlash">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={handleCancelEditPhone} className="p-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors flex-shrink-0" title="Bekor qilish">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{selectedStudentDetail.phone_number || '-'}</span>
                      {teacherRole && (
                        <button type="button" onClick={startEditingPhone} className="p-0.5 rounded hover:bg-gray-200 transition-colors" title="Telefon raqamni o'zgartirish">
                          <Pencil className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  )}
                  {phoneError && (
                    <div className="mt-1 text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200">
                      {phoneError}
                    </div>
                  )}
                </div>
                <div><span className="text-gray-500">Parol:</span> <span className="font-medium">{selectedStudentDetail.password || '-'}</span></div>
              </div>
              {loadingPayments ? (
                <div className="text-center py-4 text-xs text-gray-400">Yuklanmoqda...</div>
              ) : (
                <>
                  {studentDebts && studentDebts.debts?.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-red-700 font-semibold text-xs mb-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Qarzdorlik
                      </div>
                      {studentDebts.debts.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-red-600 mt-1">
                          <span>{monthNames[d.month - 1]} {d.year} - {d.group_name}</span>
                          <span className="font-medium">{Math.floor(d.amount).toLocaleString()} so'm</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {studentPayments && studentPayments.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">To'lov tarixi</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {studentPayments.map((p: any) => (
                          <div key={p.id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-100 text-xs">
                            <div>
                              <span className="font-medium text-gray-800">{monthNames[(p.month || 1) - 1]} {p.year}</span>
                              <span className="text-gray-400 ml-2">{p.group?.name || ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-700">{Math.floor(p.amount).toLocaleString()} so'm</span>
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px]">
                                {p.payment_type === 'naqt' ? 'Naqt' : p.payment_type === 'karta' ? 'Karta' : p.payment_type === 'click' ? 'Click' : p.payment_type || 'Naqt'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}