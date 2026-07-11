// AI 聊天 API，处理流式对话请求
import { createAgentUIStreamResponse, generateId, type UIMessage } from "ai"
import { Hono } from "hono"
import { getDefaultProvider, getProviderWithDecryptedKey } from "../../db/queries/ai-provider"
import {
  clearActiveStreamId,
  deleteChatById,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitle,
} from "../../db/queries/chat"
import { requestContext } from "../context"
import type { HonoEnv } from "../env"
import { createChatAgent } from "../lib/ai/agents/chat-agent"
import { generateTitleFromUserMessage, systemPrompt } from "../lib/ai/prompts"
import { getChatModel } from "../lib/ai/provider"

export const chatRoute = new Hono<HonoEnv>()

chatRoute.get("/", async (c) => {
  const userId = c.get("session").user.id

  const id = c.req.query("id")
  if (!id) {
    return c.text("Missing id", 400)
  }

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== userId) {
    return c.text("Not found", 404)
  }

  const dbMessages = await getMessagesByChatId({ id })

  return c.json({
    chat: {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
    },
    messages: dbMessages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts,
      createdAt: msg.createdAt.toISOString(),
    })),
  })
})

chatRoute.post("/", async (c) => {
  const userId = c.get("session").user.id
  // 流式响应期间的回调可能在 handler 返回后执行，显式携带 ALS 上下文
  const store = requestContext.getStore()

  const {
    id,
    messages,
    selectedChatModel,
    useKnowledgeBase = true,
    useFolderTools = true,
  }: {
    id: string
    messages: UIMessage[]
    selectedChatModel?: string
    useKnowledgeBase?: boolean
    useFolderTools?: boolean
  } = await c.req.json()

  // Resolve chat model config
  let config: Awaited<ReturnType<typeof getProviderWithDecryptedKey>> = null
  if (selectedChatModel) {
    config = await getProviderWithDecryptedKey(selectedChatModel, userId)
  }
  if (!config) {
    config = await getDefaultProvider(userId, "chat")
  }
  if (!config) {
    return c.json({ error: "no_chat_model" }, 400)
  }

  const userMessage = messages.at(-1)
  if (userMessage?.role !== "user") {
    return c.text("Invalid message", 400)
  }

  const existingChat = await getChatById({ id })
  const isNewChat = !existingChat

  if (isNewChat) {
    await saveChat({ id, userId, title: "新对话" })
  }

  await saveMessages({
    messages: [
      {
        id: userMessage.id,
        chatId: id,
        role: userMessage.role,
        parts: userMessage.parts,
        createdAt: new Date(),
      },
    ],
  })

  const model = getChatModel(config)
  const agent = createChatAgent({
    model,
    systemPrompt,
    userId,
    useKnowledgeBase,
    useFolderTools,
    onFinish: ({ response }) =>
      requestContext.run(store!, async () => {
        try {
          const assistantMessages = response.messages.filter(
            (message) => message.role === "assistant"
          )
          if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages.at(-1)!
            await saveMessages({
              messages: [
                {
                  id: generateId(),
                  chatId: id,
                  role: "assistant",
                  parts: lastMessage.content,
                  createdAt: new Date(),
                },
              ],
            })
          }

          if (isNewChat) {
            const textPart = userMessage.parts.find((part) => part.type === "text")
            if (textPart && "text" in textPart) {
              const title = await generateTitleFromUserMessage({ message: textPart.text, model })
              await updateChatTitle({ chatId: id, title })
            }
          }
        } finally {
          await clearActiveStreamId({ chatId: id })
        }
      }),
    onStepFinish: (step) => {
      if (step.toolCalls.length > 0) {
        const toolNames = step.toolCalls.map((call) => call.toolName).join(",")
        console.info("[chat-agent] tools", {
          chatId: id,
          toolNames,
          stepUsage: step.usage.totalTokens,
        })
      }
    },
  })

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    sendReasoning: true,
  })
})

chatRoute.delete("/", async (c) => {
  const userId = c.get("session").user.id

  const { id }: { id: string } = await c.req.json()

  const chat = await getChatById({ id })
  if (!chat || chat.userId !== userId) {
    return c.text("Not found", 404)
  }

  await deleteChatById({ id })
  return c.text("OK", 200)
})
