import { createOpenAICompatible } from "@ai-sdk/openai-compatible"

export function getChatModel(config: {
  name: string
  baseUrl: string
  apiKey: string
  modelId: string
}) {
  const provider = createOpenAICompatible({
    name: config.name,
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })
  return provider.chatModel(config.modelId)
}

export function getEmbeddingModel(config: {
  name: string
  baseUrl: string
  apiKey: string
  modelId: string
}) {
  const provider = createOpenAICompatible({
    name: config.name,
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })
  return provider.embeddingModel(config.modelId)
}
