"use client"

import { X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Student } from "@/types"

interface StudentModalProps {
  student: Student
  onClose: () => void
}

export function StudentModal({ student, onClose }: StudentModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-blue-900">Student Details</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={student.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">{student.name}</h3>
              <p className="text-sm text-blue-600">{student.group}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600">Davomat</span>
                <span className="font-medium text-blue-900">{student.attendance}%</span>
              </div>
              <Progress value={student.attendance} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-600">Uy ishi</span>
                <span className="font-medium text-blue-900">{student.homeworkCompletion}%</span>
              </div>
              <Progress value={student.homeworkCompletion} className="h-2" />
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">O'qituvchi:</span>
              <span className="text-sm font-medium text-blue-900">{student.teacher}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">Oy:</span>
              <span className="text-sm font-medium text-blue-900">{student.month}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
