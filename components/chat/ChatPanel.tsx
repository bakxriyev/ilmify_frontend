"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Paperclip,
  ImageIcon,
  FileText,
  ChevronLeft,
  Users,
  CheckCheck,
  Download,
  Search,
  Smile,
  X,
  Wifi,
  WifiOff,
} from "lucide-react"
import { ChatProvider, useChat } from "@/contexts/ChatContext"
import { useAuth } from "@/contexts/AuthContext"
import {
  formatTime,
  formatDate,
  getFileUrl,
  formatFileSize,
  ChatRoom,
  ChatMessage,
  ChatMember,
} from "@/lib/chat"

// ─── Emoji Picker ────────────────────────────────────────────────────────────
const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","🎉","🙏","💯","✅","😊","🤣","😭","😤","👏","🫶","💪","🎊","✨","😇","🥳","😏","🤩","💀","🫠","🤗","😋","🤯","😴","🥱","😅","😬","🫡","🤝"]

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-72 z-50">
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map((em) => (
          <button
            key={em}
            onClick={() => onSelect(em)}
            className="text-xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    main_teacher: {
      label: "Asosiy o'qituvchi",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    support_teacher: {
      label: "Yordamchi o'qituvchi",
      className: "bg-purple-100 text-purple-700 border border-purple-200",
    },
    student: {
      label: "O'quvchi",
      className: "bg-green-100 text-green-700 border border-green-200",
    },
  }
  const c = config[role] ?? { label: role, className: "bg-gray-100 text-gray-600 border border-gray-200" }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.className}`}>
      {c.label}
    </span>
  )
}

// ─── Sender Tag (inside bubble) ───────────────────────────────────────────────
function SenderTag({ role }: { role?: string }) {
  if (!role || role === "student") return null
  const isMain = role === "main_teacher"
  return (
    <span
      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1 ${
        isMain ? "bg-blue-500/20 text-blue-700" : "bg-purple-500/20 text-purple-700"
      }`}
    >
      {isMain ? "👨‍🏫 Asosiy" : "🧑‍💻 Yordamchi"}
    </span>
  )
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  message,
  showHeader,
  isOwn,
}: {
  message: ChatMessage
  showHeader: boolean
  isOwn: boolean
}) {
  const isImage = message.message_type === "image"
  const isFile = message.message_type === "file"

  const senderColors: Record<string, string> = {
    main_teacher: "text-blue-600",
    support_teacher: "text-purple-600",
    student: "text-emerald-600",
  }
  const nameColor = senderColors[message.sender_type ?? "student"] ?? "text-gray-600"

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} group`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="shrink-0 mb-0.5">
          {showHeader ? (
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                message.sender_type === "teacher"
                  ? "bg-gradient-to-br from-blue-400 to-blue-600"
                  : message.sender_type === "admin"
                  ? "bg-gradient-to-br from-purple-400 to-purple-600"
                  : "bg-gradient-to-br from-emerald-400 to-emerald-600"
              }`}
            >
              {message.sender_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[72%] md:max-w-[60%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && !isOwn && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className={`text-xs font-semibold ${nameColor}`}>
              {message.sender_name}
            </span>
            {message.sender_type && message.sender_type !== "student" && (
              <SenderTag role={message.sender_type} />
            )}
          </div>
        )}

        <div
          className={`relative rounded-2xl overflow-hidden shadow-sm ${
            isOwn
              ? "bg-[#effdde] text-gray-900 rounded-br-[4px]"
              : "bg-white text-gray-900 rounded-bl-[4px]"
          }`}
        >
          {/* Image */}
          {isImage && message.file_url && (
            <div className="relative">
              <img
                src={getFileUrl(message.file_url)}
                alt={message.file_name || "Rasm"}
                className="max-w-full max-h-72 object-cover cursor-pointer block"
                onClick={() => window.open(getFileUrl(message.file_url!), "_blank")}
              />
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
                <span className="text-[10px] text-white drop-shadow font-medium">
                  {formatDate(message.created_at)}
                </span>
                {isOwn && <CheckCheck className="h-3 w-3 text-white drop-shadow" />}
              </div>
            </div>
          )}

          {/* File */}
          {isFile && message.file_url && (
            <a
              href={getFileUrl(message.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 px-3 py-2.5 ${
                isOwn ? "bg-[#d9f7b5]" : "bg-gray-50"
              } hover:opacity-90 transition-opacity`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isOwn ? "bg-[#b5e87a]" : "bg-blue-100"
                }`}
              >
                <FileText className={`h-5 w-5 ${isOwn ? "text-green-700" : "text-blue-500"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-gray-800">
                  {message.file_name || "Fayl"}
                </p>
                {message.file_size && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatFileSize(message.file_size)}
                  </p>
                )}
              </div>
              <Download className={`h-4 w-4 shrink-0 ${isOwn ? "text-green-600" : "text-blue-400"}`} />
            </a>
          )}

          {/* Text */}
          {message.text && (
            <div className="px-3 py-2">
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                {message.text}
              </p>
            </div>
          )}

          {/* Time (only if not image) */}
          {!(isImage && !message.text) && (
            <div className={`flex items-center gap-1 pb-1.5 pr-2 ${message.text ? "-mt-1" : ""} justify-end`}>
              <span className="text-[10px] text-gray-400">{formatDate(message.created_at)}</span>
              {isOwn && <CheckCheck className="h-3 w-3 text-[#4dcd5e]" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Members Panel ─────────────────────────────────────────────────────────────
function MembersPanel({
  members,
  onlineUsers,
  onClose,
}: {
  members: ChatMember[]
  onlineUsers: Map<string, any>
  onClose: () => void
}) {
  const mainTeachers = members.filter((m) => m.role === "main_teacher")
  const supportTeachers = members.filter((m) => m.role === "support_teacher")
  const students = members.filter((m) => m.role === "student")

  const MemberRow = ({ m }: { m: ChatMember }) => {
    const isOnline = onlineUsers.has(`${m.userType}-${m.userId}`)
    const colors: Record<string, string> = {
      main_teacher: "from-blue-400 to-blue-600",
      support_teacher: "from-purple-400 to-purple-600",
      student: "from-emerald-400 to-emerald-600",
    }
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${
              colors[m.role] ?? "from-gray-400 to-gray-600"
            } flex items-center justify-center text-white text-sm font-bold`}
          >
            {m.userName.charAt(0).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{m.userName}</p>
          <RoleBadge role={m.role} />
        </div>
        <span className={`text-xs font-medium ${isOnline ? "text-green-600" : "text-gray-400"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    )
  }

  const Section = ({ title, items }: { title: string; items: ChatMember[] }) =>
    items.length > 0 ? (
      <div>
        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/80">
          {title} ({items.length})
        </p>
        {items.map((m) => (
          <MemberRow key={`${m.userType}-${m.userId}`} m={m} />
        ))}
      </div>
    ) : null

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-white">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
        <div>
          <h3 className="font-semibold text-sm text-gray-900">Guruh a'zolari</h3>
          <p className="text-xs text-gray-400">{members.length} ta a'zo</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        <Section title="Asosiy o'qituvchilar" items={mainTeachers} />
        <Section title="Yordamchi o'qituvchilar" items={supportTeachers} />
        <Section title="O'quvchilar" items={students} />
      </div>
    </div>
  )
}

// ─── Room List ─────────────────────────────────────────────────────────────────
function ChatRoomList({ onSelectRoom }: { onSelectRoom: (r: ChatRoom) => void }) {
  const { rooms, roomsLoading, onlineUsers, unreadCounts } = useChat()
  const [search, setSearch] = useState("")

  const filtered = rooms.filter((r) =>
    r.group.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalOnline = onlineUsers.size
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold text-gray-900">Chatlar</h2>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {totalOnline} online
            </span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guruh qidirish..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 rounded-xl border-0 outline-none focus:bg-gray-200 transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {roomsLoading && rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 w-full px-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Chatlar topilmadi</p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? "Boshqa kalit so'z bilan qidiring" : "Siz biriktirilgan guruhlar bu yerda chiqadi"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {filtered.map((room) => {
              const group = room.group
              const unread = unreadCounts[room.id] || 0
              const hasOnline =
                (group.mainTeacher && onlineUsers.has(`teacher-${group.mainTeacher.id}`)) ||
                (group.supportTeacher && onlineUsers.has(`teacher-${group.supportTeacher.id}`))

              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    {hasOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-[13.5px] text-gray-900 truncate">{group.name}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                        {room.last_message && (
                          <span className="text-[11px] text-gray-400">
                            {formatTime(room.last_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate mt-0.5">
                      {room.last_message
                        ? `${room.last_message.sender_name}: ${room.last_message.text || room.last_message.message_type}`
                        : "Hali xabar yo'q"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Room View ─────────────────────────────────────────────────────────────────
function ChatRoomView({ onBack }: { onBack: () => void }) {
  const {
    selectedRoom,
    messages,
    messagesLoading,
    members,
    sendMessage,
    sendFile,
    loadMoreMessages,
    hasMoreMessages,
    onlineUsers,
    socket,
    connected,
  } = useChat()
  const { user } = useAuth()
  const [inputText, setInputText] = useState("")
  const [showMembers, setShowMembers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSend = () => {
    if (!inputText.trim()) return
    sendMessage(inputText)
    setInputText("")
    if (socket?.connected && selectedRoom) {
      socket.emit("typing", { roomId: selectedRoom.id, isTyping: false })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (socket?.connected && selectedRoom) {
      socket.emit("typing", { roomId: selectedRoom.id, isTyping: e.target.value.length > 0 })
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { roomId: selectedRoom.id, isTyping: false })
      }, 2000)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      alert(type === "image" ? "Rasm 5 MB dan kichik bo'lishi kerak" : "Fayl 20 MB dan kichik bo'lishi kerak")
      e.target.value = ""
      return
    }
    await sendFile(file)
    e.target.value = ""
  }

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (el && el.scrollTop === 0 && hasMoreMessages && !messagesLoading) {
      loadMoreMessages()
    }
  }, [hasMoreMessages, messagesLoading, loadMoreMessages])

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  if (!selectedRoom) return null

  const group = selectedRoom.group
  const onlineCount = onlineUsers.size
  const isTeacherOnline =
    (group.mainTeacher && onlineUsers.has(`teacher-${group.mainTeacher.id}`)) ||
    (group.supportTeacher && onlineUsers.has(`teacher-${group.supportTeacher.id}`))

  // Group messages by date
  const groupedMessages: { date: string; msgs: typeof messages }[] = []
  messages.forEach((msg) => {
    const d = new Date(msg.created_at).toLocaleDateString("uz-UZ", {
      day: "numeric",
      month: "long",
    })
    const last = groupedMessages[groupedMessages.length - 1]
    if (!last || last.date !== d) {
      groupedMessages.push({ date: d, msgs: [msg] })
    } else {
      last.msgs.push(msg)
    }
  })

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 shrink-0 z-10"
        style={{
          background: "linear-gradient(135deg, #1d6fb3 0%, #2481cc 50%, #1a5fa0 100%)",
        }}
      >
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <div
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base shrink-0 cursor-pointer"
          onClick={() => setShowMembers(true)}
        >
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowMembers(true)}>
          <h3 className="font-semibold text-[14px] text-white truncate leading-tight">{group.name}</h3>
          <p className="text-[11px] text-blue-100 leading-tight">
            {members.length} a'zo
            {onlineCount > 0 && ` • ${onlineCount} online`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {connected ? (
            <Wifi className="h-4 w-4 text-green-300" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-300" />
          )}
          <button
            onClick={() => setShowMembers(true)}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <Users className="h-4.5 w-4.5 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 py-3 space-y-1"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d8e8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "#dae5f0",
        }}
      >
        {messagesLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex items-end gap-2 w-full animate-pulse ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                <div className="w-8 h-8 rounded-full bg-white/60 shrink-0" />
                <div className={`rounded-2xl h-10 bg-white/60 ${i % 2 === 0 ? "w-48" : "w-36"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur flex items-center justify-center shadow-sm">
              <MessageSquare className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Hali xabarlar yo'q</p>
              <p className="text-xs text-gray-500 mt-1">Birinchi bo'lib xabar yozing!</p>
            </div>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="flex justify-center py-2">
                <button
                  onClick={loadMoreMessages}
                  className="bg-white/80 backdrop-blur text-xs text-blue-600 font-medium px-4 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors border border-blue-100"
                >
                  Ko'proq yuklash
                </button>
              </div>
            )}

            {groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-300/40" />
                  <span className="text-[11px] text-gray-500 bg-white/70 backdrop-blur px-3 py-0.5 rounded-full font-medium shadow-sm">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-gray-300/40" />
                </div>

                <div className="space-y-0.5">
                  {msgs.map((msg, idx) => {
                    const prevMsg = idx > 0 ? msgs[idx - 1] : null
                    const showHeader =
                      !prevMsg ||
                      prevMsg.sender_id !== msg.sender_id ||
                      prevMsg.sender_type !== msg.sender_type
                    return (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        showHeader={showHeader}
                        isOwn={
                          msg.sender_type === "student"
                            ? msg.sender_id === Number(user?.id)
                            : false
                        }
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-2 py-2 bg-[#f0f2f5] border-t border-gray-200">
        <div className="relative flex items-center gap-2">
          {showEmoji && (
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
          )}

          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, "file")} />

          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="shrink-0 w-9 h-9 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-500"
          >
            <Smile className="h-5 w-5" />
          </button>

          <div className="flex-1 relative flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <input
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className="flex-1 px-3 py-2.5 text-[13.5px] outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
            />
            <div className="flex items-center gap-0.5 pr-1.5">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all ${
              inputText.trim()
                ? "bg-[#2481cc] hover:bg-[#1d6fb3] text-white scale-100"
                : "bg-gray-300 text-gray-400 scale-95"
            }`}
          >
            <Send className="h-4.5 w-4.5" style={{ transform: "translateX(1px)" }} />
          </button>
        </div>
      </div>

      {/* Members overlay */}
      {showMembers && (
        <MembersPanel
          members={members}
          onlineUsers={onlineUsers}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  )
}

// ─── ChatPanelInner ────────────────────────────────────────────────────────────
function ChatPanelInner({ children }: { children: React.ReactNode }) {
  const { selectedRoom, selectRoom } = useChat()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] p-0 flex flex-col overflow-hidden border-0 shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full overflow-hidden">
          {selectedRoom ? (
            <ChatRoomView onBack={() => selectRoom(null)} />
          ) : (
            <ChatRoomList onSelectRoom={(r) => selectRoom(r)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Export ────────────────────────────────────────────────────────────────────
export function ChatPanel({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <ChatPanelInner>{children}</ChatPanelInner>
    </ChatProvider>
  )
}