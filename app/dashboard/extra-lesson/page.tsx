"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, BookOpen, Video } from "lucide-react"

export default function ExtraLessonPage() {
  const extraLessons = [
    {
      id: 1,
      title: "Speaking Club",
      description: "Practice your speaking skills with other students",
      time: "18:00 - 19:00",
      date: "Every Tuesday",
      participants: 12,
      maxParticipants: 15,
      type: "speaking",
      available: true,
    },
    {
      id: 2,
      title: "Grammar Workshop",
      description: "Deep dive into advanced grammar topics",
      time: "19:00 - 20:00",
      date: "Every Thursday",
      participants: 8,
      maxParticipants: 10,
      type: "grammar",
      available: true,
    },
    {
      id: 3,
      title: "IELTS Preparation",
      description: "Prepare for IELTS exam with expert guidance",
      time: "17:00 - 18:30",
      date: "Monday & Friday",
      participants: 15,
      maxParticipants: 15,
      type: "exam",
      available: false,
    },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "speaking":
        return <Users className="h-5 w-5" />
      case "grammar":
        return <BookOpen className="h-5 w-5" />
      case "exam":
        return <Video className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "speaking":
        return "bg-green-100 text-green-800"
      case "grammar":
        return "bg-blue-100 text-blue-800"
      case "exam":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Extra Lessons</h1>
        <p className="text-blue-600">Join additional classes to boost your skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extraLessons.map((lesson) => (
          <Card key={lesson.id} className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-blue-900">{lesson.title}</CardTitle>
                <Badge className={getTypeColor(lesson.type)}>
                  {getTypeIcon(lesson.type)}
                  <span className="ml-1 capitalize">{lesson.type}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-blue-600">{lesson.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{lesson.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>
                    {lesson.participants}/{lesson.maxParticipants} participants
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-900">{lesson.date}</p>
              </div>

              <Button
                className="w-full"
                disabled={!lesson.available}
                variant={lesson.available ? "default" : "secondary"}
              >
                {lesson.available ? "Join Lesson" : "Full"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
