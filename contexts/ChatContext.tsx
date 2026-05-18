"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { Socket } from "socket.io-client"
import { chatApi, ChatRoom, ChatMessage, ChatMember } from "@/lib/chat"
import { useAuth } from "./AuthContext"

interface OnlineUser {
  userId: number
  userType: string
  userName: string
  userPhoto: string
}

interface ChatContextType {
  socket: Socket | null
  connected: boolean
  rooms: ChatRoom[]
  roomsLoading: boolean
  selectedRoom: ChatRoom | null
  messages: ChatMessage[]
  messagesLoading: boolean
  members: ChatMember[]
  onlineUsers: Map<string, OnlineUser>
  unreadCounts: Record<number, number>

  selectRoom: (room: ChatRoom | null) => void
  sendMessage: (text: string) => Promise<void>
  sendFile: (file: File, text?: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  hasMoreMessages: boolean
  refreshRooms: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { token, user, role } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map())
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({})
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const currentPageRef = useRef(1)
  const socketRef = useRef<Socket | null>(null)

  const connectSocket = useCallback(() => {
    if (!token || socketRef.current?.connected) return

    const s = chatApi.createSocket(token)
    socketRef.current = s

    s.on("connect", () => setConnected(true))
    s.on("disconnect", () => setConnected(false))

    s.on("new_message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      setRooms((prev) =>
        prev.map((r) =>
          r.id === msg.room_id ? { ...r, last_message: msg, updated_at: msg.created_at } : r
        )
      )
    })

    s.on("user_online", (data: OnlineUser) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev)
        next.set(`${data.userType}-${data.userId}`, data)
        return next
      })
    })

    s.on("user_offline", (data: { userId: number; userType: string }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev)
        next.delete(`${data.userType}-${data.userId}`)
        return next
      })
    })

    s.on("message_read", (data: { roomId: number; userId: number }) => {
      console.log("Message read:", data)
    })

    s.on("room_users_online", (data: { roomId: number; members: ChatMember[] }) => {
      const online = new Map<string, OnlineUser>()
      for (const m of data.members) {
        if (m.isOnline) {
          online.set(`${m.userType}-${m.userId}`, {
            userId: m.userId,
            userType: m.userType,
            userName: m.userName,
            userPhoto: m.userPhoto,
          })
        }
      }
      setOnlineUsers(online)
    })

    s.on("error", (err: { message: string }) => {
      console.error("Socket error:", err.message)
    })

    s.connect()
    setSocket(s)
  }, [token])

  useEffect(() => {
    if (token) {
      connectSocket()
    }
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [token, connectSocket])

  const joinRoom = useCallback(
    (roomId: number) => {
      if (socket?.connected) {
        socket.emit("join_room", { roomId })
        socket.emit("get_online_users")
      }
    },
    [socket]
  )

  const leaveRoom = useCallback(
    (roomId: number) => {
      socket?.emit("leave_room", { roomId })
    },
    [socket]
  )

  const refreshRooms = useCallback(async () => {
    if (!token) return
    setRoomsLoading(true)
    try {
      const res = await chatApi.getRooms()
      setRooms(res.data)
      const counts: Record<number, number> = {}
      await Promise.all(
        res.data.map(async (room) => {
          try {
            const result = await chatApi.getUnreadCount(room.id)
            counts[room.id] = result.unread_count
          } catch (e) {}
        })
      )
      setUnreadCounts(counts)
    } catch (err) {
      console.error("Failed to load rooms:", err)
    } finally {
      setRoomsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) refreshRooms()
  }, [token, refreshRooms])

  const selectRoom = useCallback(
    async (room: ChatRoom | null) => {
      if (selectedRoom) leaveRoom(selectedRoom.id)
      setSelectedRoom(room)
      setMessages([])
      currentPageRef.current = 1
      setHasMoreMessages(true)

      if (!room) return

      joinRoom(room.id)
      setMessagesLoading(true)
      try {
        const [msgRes, memberRes] = await Promise.all([
          chatApi.getMessages(room.id),
          chatApi.getMembers(room.id),
        ])
        setMessages(msgRes.data)
        setHasMoreMessages(msgRes.pagination.page < msgRes.pagination.totalPages)
        setMembers(memberRes)
        if (msgRes.data.length > 0) {
          const lastId = msgRes.data[msgRes.data.length - 1].id
          chatApi.markAsRead(room.id, lastId)
        }
      } catch (err) {
        console.error("Failed to load messages:", err)
      } finally {
        setMessagesLoading(false)
      }
    },
    [joinRoom, leaveRoom]
  )

  const loadMoreMessages = useCallback(async () => {
    if (!selectedRoom || !hasMoreMessages || messagesLoading) return
    const nextPage = currentPageRef.current + 1
    setMessagesLoading(true)
    try {
      const res = await chatApi.getMessages(selectedRoom.id, nextPage)
      setMessages((prev) => [...res.data, ...prev])
      currentPageRef.current = nextPage
      setHasMoreMessages(res.pagination.page < res.pagination.totalPages)
    } catch (err) {
      console.error("Failed to load more messages:", err)
    } finally {
      setMessagesLoading(false)
    }
  }, [selectedRoom, hasMoreMessages, messagesLoading])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!selectedRoom || !text.trim()) return
      try {
        const msg = await chatApi.sendMessage(selectedRoom.id, text)
        setMessages((prev) => [...prev, msg])
      } catch (err) {
        console.error("Failed to send message:", err)
      }
    },
    [selectedRoom]
  )

  const sendFile = useCallback(
    async (file: File, text?: string) => {
      if (!selectedRoom) return
      try {
        const msg = await chatApi.uploadFile(selectedRoom.id, file, text)
        setMessages((prev) => [...prev, msg])
      } catch (err) {
        console.error("Failed to upload file:", err)
      }
    },
    [selectedRoom]
  )

  return (
    <ChatContext.Provider
      value={{
        socket,
        connected,
        rooms,
        roomsLoading,
        selectedRoom,
        messages,
        messagesLoading,
        members,
        onlineUsers,
        unreadCounts,
        selectRoom,
        sendMessage,
        sendFile,
        loadMoreMessages,
        hasMoreMessages,
        refreshRooms,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within ChatProvider")
  return context
}
