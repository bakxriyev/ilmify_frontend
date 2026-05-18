"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SkillsProgressProps {
  skills: {
    grammar: number
    vocabulary: number
    listening: number
    pronunciation: number
  }
}

export function SkillsProgress({ skills }: SkillsProgressProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600">Grammar</p>
            <p className="text-sm font-bold text-blue-900">{skills.grammar}%</p>
          </div>
          <Progress value={skills.grammar} className="h-2" />
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600">Vocabulary</p>
            <p className="text-sm font-bold text-blue-900">{skills.vocabulary}%</p>
          </div>
          <Progress value={skills.vocabulary} className="h-2" />
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600">Listening</p>
            <p className="text-sm font-bold text-blue-900">{skills.listening}%</p>
          </div>
          <Progress value={skills.listening} className="h-2" />
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-600">Pronunciation</p>
            <p className="text-sm font-bold text-blue-900">{skills.pronunciation}%</p>
          </div>
          <Progress value={skills.pronunciation} className="h-2" />
        </CardContent>
      </Card>
    </div>
  )
}
