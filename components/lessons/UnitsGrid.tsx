"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Play, BookOpen, FileText, Film, ChevronLeft, ChevronRight } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { Unit } from "@/types"

export function UnitsGrid() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUnits() {
      try {
        const response = await fetch("/api/units")
        const data = await response.json()
        if (data.success) {
          setUnits(data.data)
        }
      } catch (error) {
        console.error("Error fetching units:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnits()
  }, [])

  if (isLoading) return <LoadingSpinner />

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "current":
        return "bg-blue-100 text-blue-800"
      case "locked":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "passed":
        return "Passed"
      case "current":
        return "Start"
      case "locked":
        return "Locked"
      default:
        return "Available"
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "vocabulary":
        return <BookOpen className="h-4 w-4" />
      case "video":
        return <Play className="h-4 w-4" />
      case "exercise":
        return <FileText className="h-4 w-4" />
      case "film":
        return <Film className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {units.map((unit) => (
          <Card
            key={unit.id}
            className={`min-w-[320px] border-blue-200 ${unit.status === "current" ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="relative h-40 overflow-hidden rounded-t-lg">
              <Image
                src={unit.image || "/placeholder.svg?height=160&width=320"}
                alt={unit.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-lg font-bold">{unit.title}</h3>
                <p className="text-sm opacity-90">{unit.subtitle}</p>
              </div>
              {unit.status === "locked" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                {unit.status === "current" ? (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    {getStatusText(unit.status)}
                  </Button>
                ) : (
                  <Badge className={getStatusColor(unit.status)}>{getStatusText(unit.status)}</Badge>
                )}
                <p className="text-sm text-blue-600">{unit.date}</p>
              </div>

              <div className="space-y-2">
                {unit.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      lesson.locked ? "bg-gray-100" : "bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {getLessonIcon(lesson.type)}
                      <div>
                        <p className={`text-sm font-medium ${lesson.locked ? "text-gray-500" : "text-blue-900"}`}>
                          {lesson.title}
                        </p>
                        <p className={`text-xs ${lesson.locked ? "text-gray-400" : "text-blue-600"}`}>
                          {lesson.count} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {lesson.locked ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <p className="text-sm font-bold text-blue-900">{lesson.progress}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-lg">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-lg">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
