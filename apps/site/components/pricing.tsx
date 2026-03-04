import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const GITHUB_REPO = 'https://github.com/jihe520/mindpocket'

export default function Pricing() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">100% 免费开源</h1>
                    <p>MindPocket 是完全开源的项目，你可以免费使用、修改和部署。</p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-1 max-w-2xl mx-auto">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">开源版本</CardTitle>
                            <span className="my-3 block text-2xl font-semibold">$0 / 永久免费</span>
                            <CardDescription className="text-sm">完整功能，无限制使用</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {[
                                    '完整的 Web、Mobile、Extension 三端支持',
                                    'AI 智能摘要与标签生成',
                                    '多端数据同步',
                                    '自托管部署，数据完全可控',
                                    'Vercel + Neon 免费额度部署',
                                    '开源代码，可自由修改',
                                    '社区支持',
                                    '持续更新维护'
                                ].map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="mt-auto flex flex-col gap-3">
                            <Button
                                asChild
                                className="w-full">
                                <Link href={GITHUB_REPO}>
                                    <span>查看 GitHub 项目</span>
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full">
                                <Link href={GITHUB_REPO}>
                                    <span>一键部署</span>
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    )
}
