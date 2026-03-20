import { Ionicons } from "@expo/vector-icons"
import {
  hasPlatformIcon,
  PLATFORM_CONFIG,
  PlatformIcon as PlatformBrandIcon,
} from "@repo/icons/native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useMarkdown } from "react-native-marked"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ApiError, requestJson } from "@/lib/api-client"
import { deleteBookmark } from "@/lib/bookmark-api"

interface BookmarkDetail {
  id: string
  type: string
  title: string
  description: string | null
  url: string | null
  content: string | null
  coverImage: string | null
  platform: string | null
  author: string | null
  createdAt: string
  tags: Array<{ id: string; name: string; color: string | null }>
}

function getBookmarkLoadError(err: unknown): { redirectToLogin: boolean; message: string } {
  if (err instanceof ApiError && err.status === 401) {
    return { redirectToLogin: true, message: "" }
  }
  if (err instanceof ApiError && err.status === 404) {
    return { redirectToLogin: false, message: "收藏不存在" }
  }
  return { redirectToLogin: false, message: "加载失败" }
}

export default function BookmarkDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [bookmark, setBookmark] = useState<BookmarkDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false

    async function load() {
      try {
        const data = await requestJson<BookmarkDetail>(`/api/bookmarks/${encodeURIComponent(id)}`)
        if (!cancelled) {
          setBookmark(data)
        }
      } catch (err) {
        if (cancelled) {
          return
        }
        const handled = getBookmarkLoadError(err)
        if (handled.redirectToLogin) {
          router.replace("/login")
          return
        }
        setError(handled.message)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const handleOpenUrl = () => {
    if (bookmark?.url) {
      Linking.openURL(bookmark.url)
    }
  }

  const handleDelete = () => {
    if (!id) {
      return
    }
    Alert.alert("删除收藏", "确定要删除这条收藏吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBookmark(id)
            router.back()
          } catch {
            Alert.alert("删除失败", "请稍后重试")
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#737373" size="small" />
      </View>
    )
  }

  if (error || !bookmark) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || "加载失败"}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>返回</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
        <Text style={styles.title}>{bookmark.title}</Text>

        <MetaRow bookmark={bookmark} />

        {bookmark.tags.length > 0 && <TagList tags={bookmark.tags} />}

        {bookmark.description && <Text style={styles.description}>{bookmark.description}</Text>}

        {bookmark.content && <MarkdownContent content={bookmark.content} />}
      </ScrollView>

      <View style={styles.bottomBar}>
        {bookmark.url && (
          <Pressable onPress={handleOpenUrl} style={styles.actionButton}>
            <Ionicons color="#525252" name="open-outline" size={18} />
            <Text style={styles.actionText}>打开链接</Text>
          </Pressable>
        )}
        <Pressable onPress={handleDelete} style={styles.actionButton}>
          <Ionicons color="#ef4444" name="trash-outline" size={18} />
          <Text style={[styles.actionText, { color: "#ef4444" }]}>删除</Text>
        </Pressable>
      </View>
    </View>
  )
}

function MetaRow({ bookmark }: { bookmark: BookmarkDetail }) {
  const date = new Date(bookmark.createdAt).toLocaleDateString("zh-CN")
  const platformLabel = hasPlatformIcon(bookmark.platform)
    ? PLATFORM_CONFIG[bookmark.platform].label
    : bookmark.platform

  return (
    <View style={styles.metaRow}>
      {platformLabel && (
        <View style={styles.metaItem}>
          {hasPlatformIcon(bookmark.platform) && (
            <PlatformBrandIcon color="#737373" platform={bookmark.platform} size={14} />
          )}
          <Text style={styles.metaText}>{platformLabel}</Text>
        </View>
      )}
      {bookmark.author && <Text style={styles.metaText}>{bookmark.author}</Text>}
      <Text style={styles.metaText}>{date}</Text>
    </View>
  )
}

function TagList({ tags }: { tags: BookmarkDetail["tags"] }) {
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={tag.id} style={styles.tag}>
          <Text style={styles.tagText}>{tag.name}</Text>
        </View>
      ))}
    </View>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const elements = useMarkdown(content)
  return <View style={{ marginTop: 16 }}>{elements}</View>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 14,
    color: "#a3a3a3",
  },
  backLink: {
    marginTop: 12,
  },
  backLinkText: {
    fontSize: 14,
    color: "#2563eb",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#262626",
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#a3a3a3",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "#f5f5f5",
  },
  tagText: {
    fontSize: 12,
    color: "#525252",
  },
  description: {
    marginTop: 16,
    fontSize: 15,
    color: "#525252",
    lineHeight: 22,
  },
  content: {
    marginTop: 16,
    fontSize: 15,
    color: "#262626",
    lineHeight: 24,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e5e5",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  actionText: {
    fontSize: 14,
    color: "#525252",
  },
})
