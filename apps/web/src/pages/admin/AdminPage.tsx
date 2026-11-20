import { useState } from 'react'
import { Link } from 'react-router'
import ArticleManager from './ArticleManager'
import CommentManager from './CommentManager'
import ReportManager from './ReportManager'
import VideoManager from './VideoManager'

const TABS = [
  { key: 'videos', label: '视频管理' },
  { key: 'articles', label: '文章管理' },
  { key: 'comments', label: '评论管理' },
  { key: 'reports', label: '举报管理' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>('videos')

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link to="/" className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回首页
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">管理后台</h1>

      <div className="mb-6 flex gap-4 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-1 pb-2 text-sm font-medium ${
              tab === t.key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'videos' && <VideoManager />}
      {tab === 'articles' && <ArticleManager />}
      {tab === 'comments' && <CommentManager />}
      {tab === 'reports' && <ReportManager />}
    </main>
  )
}
