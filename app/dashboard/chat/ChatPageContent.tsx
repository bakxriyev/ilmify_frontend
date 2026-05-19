"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  MoreVertical,
} from "lucide-react"
import { useChat } from "@/contexts/ChatContext"
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

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","😢","😡","👍","👎","❤️","🔥","🎉","🙏","💯","✅","😊","🤣","😭","😤","👏","🫶","💪","🎊","✨","😇","🥳","😏","🤩","💀","🫠","🤗","😋","🤯","😴","🥱","😅","😬","🫡","🤝"]

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-80 z-50">
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

// ─── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    main_teacher: { label: "Asosiy o'qituvchi", className: "bg-blue-100 text-blue-700 border border-blue-200" },
    support_teacher: { label: "Yordamchi o'qituvchi", className: "bg-purple-100 text-purple-700 border border-purple-200" },
    student: { label: "O'quvchi", className: "bg-green-100 text-green-700 border border-green-200" },
  }
  const c = config[role] ?? { label: role, className: "bg-gray-100 text-gray-600 border border-gray-200" }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.className}`}>
      {c.label}
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
  const avatarGradients: Record<string, string> = {
    main_teacher: "from-blue-400 to-blue-600",
    support_teacher: "from-purple-400 to-purple-600",
    student: "from-emerald-400 to-emerald-600",
  }
  const nameColor = senderColors[message.sender_type ?? "student"] ?? "text-gray-600"
  const gradient = avatarGradients[message.sender_type ?? "student"] ?? "from-gray-400 to-gray-600"

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"} group`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="shrink-0 mb-0.5">
          {showHeader ? (
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
            >
              {message.sender_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          ) : (
            <div className="w-9" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[65%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && !isOwn && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className={`text-xs font-semibold ${nameColor}`}>{message.sender_name}</span>
            {message.sender_type === "teacher" && (
              <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
                👨‍🏫 Asosiy
              </span>
            )}
            
          </div>
        )}

        <div
          className={`relative rounded-2xl overflow-hidden shadow-sm transition-all ${
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
                className="max-w-full max-h-80 object-cover cursor-pointer block hover:opacity-95 transition-opacity"
                onClick={() => window.open(getFileUrl(message.file_url!), "_blank")}
              />
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 bg-black/30 rounded-full px-1.5 py-0.5">
                <span className="text-[10px] text-white font-medium">{formatDate(message.created_at)}</span>
                {isOwn && <CheckCheck className="h-3 w-3 text-white" />}
              </div>
            </div>
          )}

          {/* File */}
          {isFile && message.file_url && (
            <a
              href={getFileUrl(message.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 px-3 py-2.5 hover:opacity-90 transition-opacity ${
                isOwn ? "bg-[#d9f7b5]" : "bg-gray-50"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? "bg-[#b5e87a]" : "bg-blue-100"}`}>
                <FileText className={`h-5 w-5 ${isOwn ? "text-green-700" : "text-blue-500"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold truncate text-gray-800">
                  {message.file_name || "Fayl"}
                </p>
                {message.file_size && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatFileSize(message.file_size)}</p>
                )}
              </div>
              <Download className={`h-4 w-4 shrink-0 ${isOwn ? "text-green-600" : "text-blue-400"}`} />
            </a>
          )}

          {/* Text */}
          {message.text && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
            </div>
          )}

          {/* Time */}
          {!(isImage && !message.text) && (
            <div className="flex items-center gap-1 pb-1.5 pr-2.5 justify-end">
              <span className="text-[10px] text-gray-400">{formatDate(message.created_at)}</span>
              {isOwn && <CheckCheck className="h-3 w-3 text-[#4dcd5e]" />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Members Sidebar ───────────────────────────────────────────────────────────
function MembersSidebar({
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

  const gradients: Record<string, string> = {
    main_teacher: "from-blue-400 to-blue-600",
    support_teacher: "from-purple-400 to-purple-600",
    student: "from-emerald-400 to-emerald-600",
  }

  const MemberRow = ({ m }: { m: ChatMember }) => {
    const isOnline = onlineUsers.has(`${m.userType}-${m.userId}`)
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradients[m.role] ?? "from-gray-400 to-gray-600"} flex items-center justify-center text-white text-sm font-bold`}
          >
            {m.userName.charAt(0).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-300"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{m.userName}</p>
          <RoleBadge role={m.role} />
        </div>
        <span className={`text-[11px] font-medium ${isOnline ? "text-green-600" : "text-gray-400"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    )
  }

  const Section = ({ title, emoji, items }: { title: string; emoji: string; items: ChatMember[] }) =>
    items.length > 0 ? (
      <div>
        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/80 sticky top-0">
          {emoji} {title} ({items.length})
        </p>
        {items.map((m) => (
          <MemberRow key={`${m.userType}-${m.userId}`} m={m} />
        ))}
      </div>
    ) : null

  return (
    <div className="w-72 border-l border-gray-100 flex flex-col bg-white shrink-0">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-gray-900">Guruh a'zolari</h3>
          <p className="text-xs text-gray-400">{members.length} ta a'zo</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        <Section title="Asosiy o'qituvchilar" emoji="👨‍🏫" items={mainTeachers} />
        <Section title="Yordamchi o'qituvchilar" emoji="🧑‍💻" items={supportTeachers} />
        <Section title="O'quvchilar" emoji="👦" items={students} />
      </div>
    </div>
  )
}

// ─── Room List Panel ───────────────────────────────────────────────────────────
function RoomListPanel({
  rooms,
  roomsLoading,
  onSelectRoom,
}: {
  rooms: ChatRoom[]
  roomsLoading: boolean
  onSelectRoom: (r: ChatRoom) => void
}) {
  const { onlineUsers, unreadCounts } = useChat()
  const [search, setSearch] = useState("")

  const filtered = rooms.filter((r) =>
    r.group.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div
        className="px-4 pt-5 pb-3 shrink-0"
        style={{ background: "linear-gradient(135deg, #1d6fb3 0%, #2481cc 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-white">Chatlar</h2>
          {totalUnread > 0 && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="w-full pl-8 pr-3 py-2 text-[13px] bg-white/15 rounded-xl border-0 outline-none text-white placeholder:text-white/60 focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {roomsLoading && rooms.length === 0 ? (
          <div className="p-4 space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-3 animate-pulse">
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
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {search ? "Topilmadi" : "Chatlar mavjud emas"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {search ? "Boshqa so'z kiriting" : "Guruhga biriktirilganda avtomatik chiqadi"}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((room) => {
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
                        <span className="text-[11px] text-gray-400">{formatTime(room.last_message.created_at)}</span>
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
          })
        )}
      </div>
    </div>
  )
}

// ─── Chat Area ─────────────────────────────────────────────────────────────────
function ChatArea() {
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
    selectRoom,
  } = useChat()
  const { user } = useAuth()

  const [inputText, setInputText] = useState("")
  const [showMembers, setShowMembers] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
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

  // Empty state
  if (!selectedRoom) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#dae5f0]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d8e8' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="text-center max-w-sm px-6">
          <div className="w-24 h-24 rounded-full bg-white/70 backdrop-blur flex items-center justify-center mx-auto mb-5 shadow-sm">
            <MessageSquare className="h-12 w-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Chatni tanlang</h3>
          <p className="text-sm text-gray-500">
            Chap paneldan guruh chatini tanlang va muloqotni boshlang
          </p>
        </div>
      </div>
    )
  }

  const group = selectedRoom.group
  const onlineCount = onlineUsers.size

  // Group messages by date
  const groupedMessages: { date: string; msgs: typeof messages }[] = []
  messages.forEach((msg) => {
    const d = new Date(msg.created_at).toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })
    const last = groupedMessages[groupedMessages.length - 1]
    if (!last || last.date !== d) {
      groupedMessages.push({ date: d, msgs: [msg] })
    } else {
      last.msgs.push(msg)
    }
  })

  return (
    <div className="flex-1 flex min-w-0">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #1d6fb3 0%, #2481cc 100%)" }}
        >
          {/* Mobile back */}
          <button
            onClick={() => selectRoom(null)}
            className="md:hidden w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>

          <div
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base shrink-0 cursor-pointer hover:bg-white/30 transition-colors"
            onClick={() => setShowMembers(!showMembers)}
          >
            {group.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowMembers(!showMembers)}>
            <h3 className="font-semibold text-[15px] text-white truncate leading-tight">{group.name}</h3>
            <p className="text-[12px] text-blue-100 leading-tight">
              {members.length} a'zo
              {onlineCount > 0 && ` • ${onlineCount} online`}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {connected ? (
              <div className="flex items-center gap-1 text-green-300">
                <Wifi className="h-4 w-4" />
              </div>
            ) : (
              <WifiOff className="h-4 w-4 text-red-300" />
            )}
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                showMembers ? "bg-white/30" : "hover:bg-white/20"
              }`}
            >
              <Users className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8d8e8' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: "#dae5f0",
          }}
        >
          {messagesLoading && messages.length === 0 ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`flex items-end gap-2 animate-pulse ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
                  <div className="w-9 h-9 rounded-full bg-white/60 shrink-0" />
                  <div className={`rounded-2xl h-12 bg-white/60 ${i % 2 === 0 ? "w-64" : "w-48"}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/70 backdrop-blur flex items-center justify-center shadow-sm">
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">Hali xabarlar yo'q</p>
                <p className="text-xs text-gray-500 mt-1">Birinchi bo'lib xabar yozing!</p>
              </div>
            </div>
          ) : (
            <>
              {hasMoreMessages && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={loadMoreMessages}
                    className="bg-white/80 backdrop-blur text-xs text-blue-600 font-semibold px-5 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors border border-blue-100"
                  >
                    Ko'proq yuklash
                  </button>
                </div>
              )}

              {groupedMessages.map(({ date, msgs }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-300/40" />
                    <span className="text-[11px] text-gray-500 bg-white/70 backdrop-blur px-3 py-1 rounded-full font-medium shadow-sm">
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

        {/* Input Bar */}
        <div className="shrink-0 px-3 py-2.5 bg-[#f0f2f5] border-t border-gray-200">
          <div className="relative flex items-center gap-2">
            {showEmoji && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            )}

            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "image")} />
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, "file")} />

            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                showEmoji ? "bg-blue-100 text-blue-500" : "hover:bg-gray-200 text-gray-500"
              }`}
            >
              <Smile className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <input
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Xabar yozing..."
                className="flex-1 px-3.5 py-2.5 text-[13.5px] outline-none bg-transparent text-gray-800 placeholder:text-gray-400"
              />
              <div className="flex items-center gap-0.5 pr-2">
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
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all duration-150 ${
                inputText.trim()
                  ? "bg-[#2481cc] hover:bg-[#1d6fb3] text-white scale-100 shadow-blue-200"
                  : "bg-gray-200 text-gray-400 scale-95"
              }`}
            >
              <Send className="h-4 w-4" style={{ transform: "translateX(1px)" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Members Sidebar - desktop */}
      {showMembers && (
        <MembersSidebar
          members={members}
          onlineUsers={onlineUsers}
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  )
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export function ChatPageContent() {
  const { rooms, roomsLoading, selectedRoom, selectRoom } = useChat()

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar - always visible on md+, hidden on mobile when room selected */}
      <div
        className={`${
          selectedRoom ? "hidden md:flex" : "flex"
        } w-full md:w-[320px] lg:w-[360px] flex-col border-r border-gray-100 shrink-0`}
      >
        <RoomListPanel
          rooms={rooms}
          roomsLoading={roomsLoading}
          onSelectRoom={selectRoom}
        />
      </div>

      {/* Chat Area - always visible on md+, shown on mobile when room selected */}
      <div className={`${selectedRoom ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
        <ChatArea />
      </div>
    </div>
  )
}