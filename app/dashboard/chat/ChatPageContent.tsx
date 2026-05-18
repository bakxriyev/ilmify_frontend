"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageSquare,
  Send,
  Paperclip,
  Image,
  FileText,
  ChevronLeft,
  Users,
  CheckCheck,
  Download,
  Search,
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
} from "@/lib/chat"

export function ChatPageContent() {
  const {
    rooms,
    roomsLoading,
    selectedRoom,
    messages,
    messagesLoading,
    members,
    sendMessage,
    sendFile,
    loadMoreMessages,
    hasMoreMessages,
    onlineUsers,
    selectRoom,
    socket,
  } = useChat()
  const { user } = useAuth()
  const [inputText, setInputText] = useState("")
  const [showMembers, setShowMembers] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0]
    if (!file || !selectedRoom) return
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      alert(type === "image" ? "Rasm 5 MB dan kichik bolishi kerak" : "Fayl 20 MB dan kichik bolishi kerak")
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

  const filteredRooms = rooms.filter((r) =>
    r.group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedRoom) {
    const group = selectedRoom.group
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-white">
        <div className="hidden md:flex w-80 flex-col border-r shrink-0">
          <ChatRoomListPanel
            rooms={filteredRooms}
            roomsLoading={roomsLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectRoom={selectRoom}
          />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-white">
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => selectRoom(null)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{group.name}</h3>
              <p className="text-xs text-gray-400">{members.length} azo</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowMembers(!showMembers)}>
              <Users className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <ScrollArea ref={scrollRef} onScroll={handleScroll} className="flex-1 px-4 py-2 bg-gray-50/50">
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
                    Yuklanmoqda...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Hali xabarlar yoq</p>
                    <p className="text-gray-400 text-xs mt-1">Birinch bolib xabar yozing!</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-2">
                    {hasMoreMessages && (
                      <div className="text-center py-2">
                        <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={loadMoreMessages}>
                          Koproq yuklash
                        </Button>
                      </div>
                    )}
                    {messages.map((msg, idx) => {
                      const prevMsg = idx > 0 ? messages[idx - 1] : null
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
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {showMembers && (
                <div className="border-t bg-white max-h-48 overflow-y-auto">
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Azolar ({members.length})
                    </h4>
                  </div>
                  <div className="divide-y">
                    {members.map((m) => (
                      <div key={`${m.userType}-${m.userId}`} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{m.userName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              onlineUsers.has(`${m.userType}-${m.userId}`)
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.userName}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {m.role === "main_teacher"
                              ? "Asosiy oqituvchi"
                              : m.role === "support_teacher"
                              ? "Support oqituvchi"
                              : "Student"}
                          </p>
                        </div>
                        <span
                          className={`text-xs ${
                            onlineUsers.has(`${m.userType}-${m.userId}`)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {onlineUsers.has(`${m.userType}-${m.userId}`) ? "Online" : "Offline"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-3 border-t bg-white">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "image")}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "file")}
                />
                <Button variant="ghost" size="icon" className="shrink-0 text-gray-400" onClick={() => imageInputRef.current?.click()}>
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0 text-gray-400" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Xabar yozing..."
                  className="flex-1 border-gray-200 bg-gray-50 focus:bg-white text-sm"
                />
                <Button
                  size="icon"
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 w-9"
                  disabled={!inputText.trim()}
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      <div className="hidden md:flex w-80 flex-col border-r shrink-0">
        <ChatRoomListPanel
          rooms={filteredRooms}
          roomsLoading={roomsLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectRoom={selectRoom}
        />
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Chatni tanlang</h3>
          <p className="text-sm text-gray-400 mt-1">Chapdagi guruh chatlaridan birini tanlang</p>
        </div>
      </div>
    </div>
  )
}

function ChatRoomListPanel({
  rooms,
  roomsLoading,
  searchQuery,
  onSearchChange,
  onSelectRoom,
}: {
  rooms: ChatRoom[]
  roomsLoading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelectRoom: (room: ChatRoom) => void
}) {
  const { onlineUsers } = useChat()
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chatlar</h2>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Guruh qidirish..."
            className="pl-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {roomsLoading && rooms.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Yuklanmoqda...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">Chatlar mavjud emas</p>
            <p className="text-gray-400 text-xs mt-1">Siz biriktirilgan guruhlar avtomatik chatga aylantiriladi</p>
          </div>
        ) : (
          <div className="divide-y">
            {rooms.map((room) => {
              const group = room.group
              const teacherOnline = group.mainTeacher
                ? onlineUsers.has(`teacher-${group.mainTeacher.id}`)
                : false
              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 rounded-full">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                      {room.last_message && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {formatTime(room.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {room.last_message
                        ? `${room.last_message.sender_name}: ${
                            room.last_message.text || room.last_message.message_type
                          }`
                        : "Hali xabarlar yoq"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

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

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && !isOwn && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {message.sender_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-gray-600">{message.sender_name}</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isOwn
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-sm"
          }`}
        >
          {isImage && message.file_url && (
            <div className="mb-1.5 -mx-1 -mt-1">
              <img
                src={getFileUrl(message.file_url)}
                alt={message.file_name || "Rasm"}
                className="max-w-full rounded-lg max-h-72 object-cover cursor-pointer"
                onClick={() => window.open(getFileUrl(message.file_url), "_blank")}
              />
            </div>
          )}
          {isFile && message.file_url && (
            <a
              href={getFileUrl(message.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${
                isOwn ? "bg-blue-700" : "bg-gray-50"
              }`}
            >
              <FileText className={`h-8 w-8 ${isOwn ? "text-blue-200" : "text-blue-500"}`} />
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${isOwn ? "text-white" : "text-gray-800"}`}>
                  {message.file_name || "Fayl"}
                </p>
                {message.file_size && (
                  <p className={`text-[10px] ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
                    {formatFileSize(message.file_size)}
                  </p>
                )}
              </div>
              <Download className={`h-4 w-4 shrink-0 ${isOwn ? "text-blue-200" : "text-blue-500"}`} />
            </a>
          )}
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          )}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
              {formatDate(message.created_at)}
            </span>
            {isOwn && <CheckCheck className="h-3 w-3 text-blue-200" />}
          </div>
        </div>
      </div>
    </div>
  )
}
