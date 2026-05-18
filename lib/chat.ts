import { io, Socket } from "socket.io-client"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface ChatRoom {
  id: number
  group_id: number
  created_at: string
  updated_at: string
  group: {
    id: number
    name: string
    teacher_id: number
    support_teacher_id: number
    level_id: number
    mainTeacher?: { id: number; first_name: string; last_name: string; photo: string | null }
    supportTeacher?: { id: number; first_name: string; last_name: string; photo: string | null }
  }
  last_message?: ChatMessage | null
}

export interface ChatMessage {
  id: number
  room_id: number
  sender_id: number
  sender_type: "teacher" | "student" | "admin"
  sender_name: string
  sender_photo: string
  message_type: "text" | "image" | "file"
  text: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  created_at: string
}

export interface ChatMember {
  userId: number
  userType: "teacher" | "student" | "admin"
  userName: string
  userPhoto: string
  role: "main_teacher" | "support_teacher" | "student"
  isOnline?: boolean
  lastSeen?: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const chatApi = {
  async getRooms(): Promise<PaginatedResponse<ChatRoom>> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch rooms")
    return res.json()
  },

  async getRoom(roomId: number): Promise<ChatRoom> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch room")
    return res.json()
  },

  async getMessages(
    roomId: number,
    page = 1,
    limit = 50,
    beforeMessageId?: number
  ): Promise<PaginatedResponse<ChatMessage>> {
    const token = localStorage.getItem("token")
    let url = `${API_URL}/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`
    if (beforeMessageId) url += `&before_message_id=${beforeMessageId}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch messages")
    return res.json()
  },

  async getMembers(roomId: number): Promise<ChatMember[]> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch members")
    return res.json()
  },

  async sendMessage(roomId: number, text: string, messageType = "text") {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, message_type: messageType }),
    })
    if (!res.ok) throw new Error("Failed to send message")
    return res.json()
  },

  async uploadFile(roomId: number, file: File, text?: string) {
    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("file", file)
    if (text) formData.append("text", text)
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error("Failed to upload file")
    return res.json()
  },

  async markAsRead(roomId: number, lastMessageId: number) {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}/read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ last_message_id: lastMessageId }),
    })
    if (!res.ok) throw new Error("Failed to mark as read")
    return res.json()
  },

  async getUnreadCount(roomId: number): Promise<{ unread_count: number }> {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_URL}/chat/rooms/${roomId}/unread`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to fetch unread count")
    return res.json()
  },

  createSocket(token: string): Socket {
    return io(`${API_URL}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
    })
  },
}

export function getFileUrl(path: string | null | undefined): string {
  if (!path) return ""
  if (path.startsWith("http")) return path
  if (path.startsWith("/")) return `${API_URL}${path}`
  return `${API_URL}/${path}`
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Hozir"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}k`
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image"
  if (["pdf"].includes(ext)) return "pdf"
  if (["doc", "docx"].includes(ext)) return "word"
  if (["mp4", "webm", "mov"].includes(ext)) return "video"
  if (["mp3", "wav", "ogg"].includes(ext)) return "audio"
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel"
  if (["zip", "rar", "7z"].includes(ext)) return "archive"
  return "file"
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
