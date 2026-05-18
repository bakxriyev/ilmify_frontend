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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MessageSquare,
  Send,
  Paperclip,
  Image,
  FileText,
  X,
  ChevronLeft,
  Users,
  CheckCheck,
  Clock,
  Download,
} from "lucide-react"
import { ChatProvider, useChat } from "@/contexts/ChatContext"
import { useAuth } from "@/contexts/AuthContext"
import {
  formatTime,
  formatDate,
  getFileUrl,
  formatFileSize,
  getFileIcon,
  ChatRoom,
  ChatMessage,
  ChatMember,
} from "@/lib/chat"

function ChatRoomList() {
  const { rooms, roomsLoading, selectRoom, onlineUsers } = useChat()
  const { user, role } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chat</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {rooms.length} ta guruh | {onlineUsers.size} online
        </p>
      </div>
      <ScrollArea className="flex-1">
        {roomsLoading && rooms.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
            Yuklanmoqda...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Siz uchun chatlar mavjud emas</p>
            <p className="text-gray-400 text-xs mt-1">
              Siz biriktirilgan guruhlar avtomatik chatga aylantiriladi
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {rooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                onClick={() => selectRoom(room)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function ChatRoomItem({ room, onClick }: { room: ChatRoom; onClick: () => void }) {
  const { onlineUsers, unreadCounts } = useChat()
  const group = room.group
  const mainTeacherOnline = group.mainTeacher
    ? onlineUsers.has(`teacher-${group.mainTeacher.id}`)
    : false
  const supportTeacherOnline = group.supportTeacher
    ? onlineUsers.has(`teacher-${group.supportTeacher.id}`)
    : false
  const onlineInGroup = mainTeacherOnline || supportTeacherOnline
  const unread = unreadCounts[room.id] || 0

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 rounded-full">
          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
            {group.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {onlineInGroup && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate">{group.name}</h3>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {unread > 0 && (
              <Badge className="h-5 min-w-[20px] px-1.5 bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center rounded-full">
                {unread > 99 ? '99+' : unread}
              </Badge>
            )}
            {room.last_message && (
              <span className="text-xs text-gray-400">
                {formatTime(room.last_message.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500 truncate">
            {room.last_message
              ? `${room.last_message.sender_name}: ${room.last_message.text || room.last_message.message_type}`
              : "Xabarlar yoq"}
          </span>
        </div>
      </div>
    </button>
  )
}

function ChatRoomView() {
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
    selectRoom,
    socket,
  } = useChat()
  const { user } = useAuth()
  const [inputText, setInputText] = useState("")
  const [showMembers, setShowMembers] = useState(false)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value)
    if (socket?.connected && selectedRoom) {
      socket.emit("typing", { roomId: selectedRoom.id, isTyping: e.target.value.length > 0 })
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

  const getMemberInitial = (name: string) => name.charAt(0).toUpperCase()

  if (!selectedRoom) return null

  const group = selectedRoom.group
  const back = () => selectRoom(null)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 bg-white">
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={back}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate flex items-center gap-1.5">
            {group.name}
            {onlineUsers.size > 0 && (
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block shrink-0" />
            )}
          </h3>
          <p className="text-[11px] text-gray-400">
            {members.length} azo
            {onlineUsers.size > 0 && ` · ${onlineUsers.size} online`}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setShowMembers(!showMembers)}>
          <Users className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 px-3 py-2 bg-[#e8ecef]"
          >
            {messagesLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Yuklanmoqda...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Hali xabarlar yoq</p>
                <p className="text-gray-300 text-xs mt-1">Birinch bolib xabar yozing!</p>
              </div>
            ) : (
              <>
                {hasMoreMessages && (
                  <div className="text-center py-2">
                    <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={loadMoreMessages}>
                      Koproq yuklash
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
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
                </div>
                <div ref={messagesEndRef} />
              </>
            )}
          </ScrollArea>

          {showMembers && (
            <div className="border-t bg-white">
              <div className="px-4 py-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Azolar ({members.length})
                </h4>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y">
                {members.map((m) => (
                  <div key={`${m.userType}-${m.userId}`} className="flex items-center gap-2 px-4 py-1.5">
                    <div className="relative">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{getMemberInitial(m.userName)}</AvatarFallback>
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
                      <p className="text-xs font-medium truncate">{m.userName}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{m.role.replace("_", " ")}</p>
                    </div>
                    <span
                      className={`text-[10px] ${
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

          <div className="flex items-center gap-1.5 px-3 py-2 border-t bg-white">
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
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-400 h-8 w-8"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-400 h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Xabar yozing..."
              className="flex-1 h-9 min-h-0 border-gray-200 bg-gray-50 focus:bg-white text-sm px-3 py-1.5"
            />
            <Button
              size="icon"
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8"
              disabled={!inputText.trim()}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
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
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-1`}>
      <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && !isOwn && (
          <div className="flex items-center gap-2 mb-0.5 ml-1">
            <span className="text-[11px] font-semibold text-gray-600">{message.sender_name}</span>
          </div>
        )}
        <div
          className={`${
            isOwn
              ? "bg-[#effdde] text-gray-900 rounded-[18px] rounded-br-[6px]"
              : "bg-white text-gray-900 rounded-[18px] rounded-bl-[6px] shadow-sm"
          } px-3 py-1.5`}
        >
          {isImage && message.file_url && (
            <div className="mb-1 -mx-1 -mt-1">
              <img
                src={getFileUrl(message.file_url)}
                alt={message.file_name || "Rasm"}
                className="max-w-full rounded-xl max-h-60 object-cover cursor-pointer"
                onClick={() => window.open(getFileUrl(message.file_url), "_blank")}
              />
            </div>
          )}
          {isFile && message.file_url && (
            <a
              href={getFileUrl(message.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 p-1.5 rounded-lg mb-0.5 ${
                isOwn ? "bg-[#daf5b5]" : "bg-gray-50"
              }`}
            >
              <FileText className={`h-7 w-7 ${isOwn ? "text-gray-600" : "text-blue-500"}`} />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-gray-800">
                  {message.file_name || "Fayl"}
                </p>
                {message.file_size && (
                  <p className="text-[10px] text-gray-400">
                    {formatFileSize(message.file_size)}
                  </p>
                )}
              </div>
              <Download className={`h-3.5 w-3.5 shrink-0 ${isOwn ? "text-gray-500" : "text-blue-500"}`} />
            </a>
          )}
          {message.text && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
          )}
          <div className={`flex items-center gap-1 ${message.text || message.file_url ? "mt-0.5" : ""} ${isOwn ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isOwn ? "text-gray-400" : "text-gray-400"}`}>
              {formatDate(message.created_at)}
            </span>
            {isOwn && <CheckCheck className="h-3 w-3 text-gray-400" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ChatPanel({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <ChatPanelInner>{children}</ChatPanelInner>
    </ChatProvider>
  )
}

function ChatPanelInner({ children }: { children: React.ReactNode }) {
  const { selectedRoom, rooms } = useChat()
  const [open, setOpen] = useState(false)
  const totalUnread = rooms.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        {selectedRoom ? <ChatRoomView /> : <ChatRoomList />}
      </SheetContent>
    </Sheet>
  )
}
