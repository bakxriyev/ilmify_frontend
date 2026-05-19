"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { Student } from "@/types"
import { StudentModal } from "./StudentModal"

export function StudentList() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch("/api/students")
        const data = await response.json()
        if (data.success) {
          setStudents(data.data)
        }
      } catch (error) {
        console.error("Error fetching students:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (isLoading) return <LoadingSpinner />

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score > 0) return "bg-orange-500"
    return "bg-red-500"
  }

  const dates = ["01 Aug", "04 Aug", "06 Aug", "08 Aug", "11 Aug", "13 Aug", "15 Aug"]

  return (
    <>
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>👥</span>
            Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-9 gap-2 mb-4 text-center text-sm font-medium text-blue-700">
            <div className="col-span-2">Students</div>
            {dates.map((date) => (
              <div key={date} className="text-xs">
                {date}
              </div>
            ))}
          </div>

          {/* Students List */}
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="grid grid-cols-9 gap-2 items-center p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-blue-900">{student.name}</p>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs px-1">
                        A: {student.attendance}%
                      </Badge>
                    </div>
                  </div>
                </div>

                {dates.map((date, index) => (
                  <div key={date} className="text-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getScoreColor(
                        index < 2 ? student.scores.test : 0,
                      )}`}
                    >
                      {index < 2 ? student.scores.test || "0" : "-"}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedStudent && <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
    </>
  )
}