"use client"

import type { AiProvider } from "@repo/types"
import { Bot, Check, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector"
import { PromptInputButton } from "@/components/ai-elements/prompt-input"
import { useT } from "@/lib/i18n"

export function ChatModelSelector({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string
  onModelChange: (modelId: string) => void
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<AiProvider[]>([])

  useEffect(() => {
    fetch("/api/ai-providers?type=chat")
      .then((res) => res.json())
      .then((data: AiProvider[]) => {
        setModels(data.filter((m) => m.type === "chat"))
      })
      .catch(() => {
        // ignore fetch errors
      })
  }, [])

  const selectedModel = models.find((m) => m.id === selectedModelId)

  if (models.length === 0) {
    return (
      <PromptInputButton
        onClick={() => {
          // Dispatch a custom event to open settings dialog on AI model tab
          window.dispatchEvent(new CustomEvent("open-settings", { detail: "ai-model" }))
        }}
        size="sm"
        tooltip={t.settings.aiModelNoChatModel}
      >
        <Bot className="size-4" />
        <span className="text-xs">{t.settings.aiModelGoSettings}</span>
        <Settings className="size-3" />
      </PromptInputButton>
    )
  }

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton size="sm" tooltip={t.chatModelSelector.tooltip}>
          <Bot className="size-4" />
          <span className="text-xs">
            {selectedModel?.name ?? t.chatModelSelector.selectedFallback}
          </span>
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent title={t.chatModelSelector.title}>
        <ModelSelectorInput placeholder={t.chatModelSelector.searchPlaceholder} />
        <ModelSelectorList>
          <ModelSelectorEmpty>{t.chatModelSelector.empty}</ModelSelectorEmpty>
          <ModelSelectorGroup>
            {models.map((model) => (
              <ModelSelectorItem
                key={model.id}
                onSelect={() => {
                  onModelChange(model.id)
                  setOpen(false)
                }}
                value={model.id}
              >
                <Bot className="size-4 text-muted-foreground" />
                <ModelSelectorName>{model.name}</ModelSelectorName>
                <span className="text-muted-foreground text-xs">{model.modelId}</span>
                {model.id === selectedModelId && <Check className="ml-auto size-4" />}
              </ModelSelectorItem>
            ))}
          </ModelSelectorGroup>
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  )
}
