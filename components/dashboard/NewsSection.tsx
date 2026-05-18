"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { NewsItem } from "@/types"

export function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch("/api/dashboard/news")
        const data = await response.json()
        if (data.success) {
          setNews(data.data)
        }
      } catch (error) {
        console.error("Error fetching news:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {news.map((item) => (
          <Card key={item.id} className="overflow-hidden border-blue-200">
            <CardContent className="p-0">
              <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
                <div className="absolute inset-0 flex items-center justify-between p-6 text-white">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">NEWS SECTION</h2>
                    <p className="text-lg mb-2">NEWS TITLE</p>
                    <p className="text-xl font-bold">NEWS TIME</p>
                  </div>
                  <div className="relative w-24 h-24">
                    <Image
                      src={"/placeholder.svg"}
                      alt={item.title}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
