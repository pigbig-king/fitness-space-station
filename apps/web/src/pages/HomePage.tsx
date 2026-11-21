import { Link } from 'react-router'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-3xl font-bold">健身空间站 Fitness Space Station</h1>
      <p className="mb-8 text-muted-foreground">训练记录 · 计划自适应 · 社区</p>

      <h2 className="mb-4 text-lg font-semibold">核心功能</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/videos" className="no-underline">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>动作视频库</CardTitle>
              <CardDescription>分类筛选 · 关键词搜索 · B站视频播放</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/articles" className="no-underline">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>社区</CardTitle>
              <CardDescription>原创科普文章 · 文献聚合 · 证据等级</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">训练助手</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link to="/log" className="no-underline">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>训练记录</CardTitle>
              <CardDescription>记录训练，获取负荷建议</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/plan" className="no-underline">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>计划自适应</CardTitle>
              <CardDescription>规则生成个性化周计划</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  )
}
