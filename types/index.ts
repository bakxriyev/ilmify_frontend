export interface User {
  id: number
  name: string
  phone: string
  role: string
  level: string
  avatar: string
}

export interface Student {
  id: number
  name: string
  avatar: string
  scores: {
    test: number
    homework: number
  }
  attendance: number
  homeworkCompletion: number
  group: string
  teacher: string
  month: string
}

export interface Unit {
  id: number
  title: string
  subtitle: string
  status: "available" | "passed" | "current" | "locked"
  date: string
  image: string
  lessons: Lesson[]
}

export interface Lesson {
  id: number
  type: "vocabulary" | "video" | "exercise" | "film"
  title: string
  count: number
  progress: number
  locked: boolean
}

export interface NewsItem {
  id: number
  title: string
  subtitle: string
  time: string
  image: string
  type: string
}

export interface DashboardStats {
  coins: number
  scores: number
  ranking: {
    position: number
    type: string
  }
  homework: {
    unit: string
    progress: number
  }
}
