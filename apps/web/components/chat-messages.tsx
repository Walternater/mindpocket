"use client"

import type { ChatStatus, UIMessage } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { ChatMessage } from "@/components/chat-message"
import { useT } from "@/lib/i18n"

export function ChatMessages({ messages, status }: { messages: UIMessage[]; status: ChatStatus }) {
  const t = useT()
  const isStreaming = status === "streaming" || status === "submitted"

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1
          return (
            <ChatMessage
              isStreaming={isStreaming && isLastMessage}
              key={message.id}
              message={message}
            />
          )
        })}
        {status === "submitted" && messages.at(-1)?.role !== "assistant" && (
          <div className="text-muted-foreground text-sm">
            <Shimmer duration={1}>{t.chatMessages.thinking}</Shimmer>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
