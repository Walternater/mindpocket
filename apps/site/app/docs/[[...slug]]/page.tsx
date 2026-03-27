import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMdxComponents } from "@/components/mdx"
import { source } from "@/lib/source"

interface DocsPageProps {
  params: Promise<{
    slug?: string[]
  }>
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = source.getPage(slug)

  if (!page) {
    return {
      title: "MindPocket Docs",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${page.data.title} | MindPocket Docs`,
    description: page.data.description ?? "MindPocket public documentation",
    alternates: {
      canonical: page.url,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function Page({ params }: DocsPageProps) {
  const { slug } = await params
  const page = source.getPage(slug)

  if (!page) {
    notFound()
  }

  const MDXContent = page.data.body

  return (
    <DocsPage full={page.data.full} toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent components={getMdxComponents(page)} />
      </DocsBody>
    </DocsPage>
  )
}
