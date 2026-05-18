"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Coins, Star, Trophy } from "lucide-react"
import type { DashboardStats } from "@/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.coins}</p>
              <p className="text-sm text-blue-600">Coins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.scores}</p>
              <p className="text-sm text-blue-600">Scores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-blue-900">{stats.ranking.position}nd place</p>
              <p className="text-sm text-blue-600">{stats.ranking.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">My homework</p>
              <p className="text-sm opacity-90">{stats.homework.unit}</p>
              <p className="text-2xl font-bold">{stats.homework.progress}%</p>
            </div>
            <div className="text-3xl opacity-80">📚</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
