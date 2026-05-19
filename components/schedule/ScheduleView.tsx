"use client"

import { useState, useMemo } from "react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isToday } from "date-fns"
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GroupLesson } from "@/lib/api"

interface ScheduleViewProps {
  lessons: GroupLesson[]
  groupName?: string
  roomName?: string
}

export function ScheduleView({ lessons, groupName, roomName }: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily")
  const [currentDate, setCurrentDate] = useState(new Date())

  const filteredLessons = useMemo(() => {
    if (!lessons || lessons.length === 0) return []

    if (viewMode === "daily") {
      const dateStr = format(currentDate, "yyyy-MM-dd")
      return lessons.filter((l) => {
        const lessonDate = l.date.split('T')[0] || l.date
        return lessonDate === dateStr
      })
    }

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    return lessons.filter((l) => {
      const dateStr = (l.date.split('T')[0] || l.date)
      const lessonDate = parseISO(dateStr)
      return lessonDate >= weekStart && lessonDate <= weekEnd
    })
  }, [lessons, viewMode, currentDate])

  const weekDays = useMemo(() => {
    if (viewMode !== "weekly") return []
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [viewMode, currentDate])

  const groupedByDay = useMemo(() => {
    if (viewMode !== "weekly") return new Map<string, GroupLesson[]>()
    const map = new Map<string, GroupLesson[]>()
    for (const lesson of filteredLessons) {
      const key = lesson.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(lesson)
    }
    return map
  }, [filteredLessons, viewMode])

  const navigate = (direction: "prev" | "next") => {
    const delta = direction === "prev" ? -1 : 1
    if (viewMode === "daily") {
      setCurrentDate((d) => addDays(d, delta))
    } else {
      setCurrentDate((d) => addDays(d, delta * 7))
    }
  }

  const dateLabel = useMemo(() => {
    if (viewMode === "daily") {
      if (isToday(currentDate)) return "Bugun"
      return format(currentDate, "d MMMM, EEEE")
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    return `${format(weekStart, "d MMM")} - ${format(weekEnd, "d MMM, yyyy")}`
  }, [viewMode, currentDate])

  if (!lessons || lessons.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <CalendarDays className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          Dars jadvali mavjud emas
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">
            {dateLabel}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">
            Bugun
          </Button>
        </div>
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as "daily" | "weekly")}>
          <ToggleGroupItem value="daily" aria-label="Kunlik">
            <CalendarDays className="h-4 w-4 mr-1" />
            Kunlik
          </ToggleGroupItem>
          <ToggleGroupItem value="weekly" aria-label="Haftalik">
            <CalendarRange className="h-4 w-4 mr-1" />
            Haftalik
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewMode === "daily" ? (
        <div className="space-y-2">
          {filteredLessons.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Bu kunda darslar yoq
              </CardContent>
            </Card>
          ) : (
            filteredLessons
              .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"))
              .map((lesson) => {
                const lessonDateStr = lesson.date.split('T')[0] || lesson.date
                const isPast = parseISO(lessonDateStr) < new Date(new Date().toDateString())
                return (
                  <Card key={lesson.id} className={`${isPast ? "opacity-60" : ""} hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-bold text-blue-700 leading-none">
                          {format(parseISO(lessonDateStr), "dd")}
                        </span>
                        <span className="text-[10px] text-blue-500 font-medium uppercase">
                          {format(parseISO(lessonDateStr), "MMM")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lesson.unit && (
                            <Badge variant="secondary" className="text-xs">
                              {lesson.unit.name || lesson.unit.title}
                            </Badge>
                          )}
                          {isPast && <Badge variant="outline" className="text-[10px] text-gray-400">Otgan</Badge>}
                          {isToday(parseISO(lessonDateStr)) && !isPast && (
                            <Badge className="text-[10px] bg-green-100 text-green-700 border-0">Bugun</Badge>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm mt-1">
                          {groupName || "Guruh"} {lesson.parity === "odd" ? "(T/R)" : "(J/U)"}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.time || "00:00"}
                          </span>
                          {roomName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {roomName}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            const dayLessons = groupedByDay.get(dateStr) || []
            const isCurrent = isToday(day)
            const isPast = new Date(format(day, 'yyyy-MM-dd')) < new Date(new Date().toDateString())
            return (
              <Card key={dateStr} className={`${isCurrent ? "ring-2 ring-blue-400" : ""} ${isPast && dayLessons.length === 0 ? "opacity-40" : ""}`}>
                <CardContent className="p-2 text-center">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase">{format(day, "EEE")}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isCurrent ? "text-blue-600" : "text-gray-900"}`}>
                    {format(day, "d")}
                  </p>
                  {dayLessons.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {dayLessons.sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00")).map((l) => (
                        <div key={l.id} className="text-[9px] bg-blue-50 text-blue-700 rounded px-1 py-0.5 font-medium truncate">
                          {l.time || "00:00"}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-300 mt-1">-</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
