"use client"

import type { ChatStatus } from "ai"
import { BookOpen, FolderTree } from "lucide-react"
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { ChatModelSelector } from "@/components/chat-model-selector"
import { useT } from "@/lib/i18n"

function AttachmentPreviewList() {
  const { files, remove } = usePromptInputAttachments()

  if (files.length === 0) {
    return null
  }

  return (
    <PromptInputHeader>
      <Attachments>
        {files.map((file) => (
          <Attachment data={file} key={file.id} onRemove={() => remove(file.id)}>
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        ))}
      </Attachments>
    </PromptInputHeader>
  )
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  status,
  stop,
  selectedModelId,
  onModelChange,
  useKnowledgeBase,
  onKnowledgeBaseChange,
  useFolderTools,
  onFolderToolsChange,
}: {
  input: string
  setInput: (value: string) => void
  onSubmit: (message: PromptInputMessage) => void
  status: ChatStatus
  stop: () => void
  selectedModelId: string
  onModelChange: (modelId: string) => void
  useKnowledgeBase: boolean
  onKnowledgeBaseChange: (value: boolean) => void
  useFolderTools: boolean
  onFolderToolsChange: (value: boolean) => void
}) {
  const t = useT()
  return (
    <div className="w-full px-4 pb-4">
      <PromptInput accept="image/*" multiple onSubmit={onSubmit}>
        <AttachmentPreviewList />
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatInput.placeholder}
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label={t.chatInput.addImage} />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <ChatModelSelector onModelChange={onModelChange} selectedModelId={selectedModelId} />
            <PromptInputButton
              className={useFolderTools ? "bg-primary/10 text-primary" : ""}
              onClick={() => onFolderToolsChange(!useFolderTools)}
              size="sm"
              tooltip={t.chatInput.folderTools}
            >
              <FolderTree className="size-4" />
              <span className="text-xs">{t.chatInput.folderTools}</span>
            </PromptInputButton>
            <PromptInputButton
              className={useKnowledgeBase ? "bg-primary/10 text-primary" : ""}
              onClick={() => onKnowledgeBaseChange(!useKnowledgeBase)}
              size="sm"
              tooltip={t.chatInput.knowledgeBase}
            >
              <BookOpen className="size-4" />
              <span className="text-xs">{t.chatInput.knowledgeBase}</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit onStop={stop} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
