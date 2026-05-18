"use client"

import { ChatProvider } from "@/contexts/ChatContext"
import { ChatPageContent } from "./ChatPageContent"

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  )
}
