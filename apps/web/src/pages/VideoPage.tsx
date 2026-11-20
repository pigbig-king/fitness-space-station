import { useState } from 'react'

type VideoItem = {
  url: string
  title: string
  html: string
}

// 纯前端暂时无法直接搜索 B 站，先用写死的链接跑通 iframe 展示闭环。
const MOCK_URLS = [
  'https://www.bilibili.com/video/BV1xx411c7mu',
  'https://www.bilibili.com/video/BV1GJ411x7h7',
  'https://www.bilibili.com/video/BV1W7411V7CZ',
]

function mockSearch(_keyword: string): string[] {
  return MOCK_URLS
}

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]+|av\d+)/i,
  )
  return match ? match[1] : null
}

function bilibiliUrlToIframe(url: string): string | null {
  const id = extractVideoId(url)
  if (!id) return null

  const isBv = id.startsWith('BV')
  const params = new URLSearchParams({
    [isBv ? 'bvid' : 'aid']: id,
    high_quality: '1',
    danmaku: '0',
    as_wide: '1',
    autoplay: '0',
  })
  const src = `https://player.bilibili.com/player.html?${params.toString()}`
  return `<iframe src="${src}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>`
}

export default function VideoPage() {
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<VideoItem[]>([])
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)

  function handleSearch() {
    const results = mockSearch(keyword)
      .map((url) => {
        const html = bilibiliUrlToIframe(url)
        console.log('iframe 生成结果:', { url, html })
        return {
          url,
          title: extractVideoId(url) ?? url,
          html: html ?? '',
        }
      })
      .filter((item) => item.html !== '')

    setItems(results)
    setExpandedUrl(null)
  }

  function toggle(url: string) {
    setExpandedUrl((prev) => (prev === url ? null : url))
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 1rem' }}>动作视频</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch()
        }}
        style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入关键词，如 深蹲 教学"
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          搜索
        </button>
      </form>

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {items.map((item) => {
          const expanded = expandedUrl === item.url
          return (
            <li
              key={item.url}
              style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => toggle(item.url)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.8rem 1rem',
                  cursor: 'pointer',
                  background: '#fff',
                  border: 'none',
                  fontSize: '1rem',
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ color: '#888', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {item.url} · {expanded ? '点击收起' : '点击展开播放'}
                </div>
              </button>
              {expanded && item.html && (
                <div
                  className="video-embed"
                  style={{ width: '100%', aspectRatio: '16 / 9', background: '#000' }}
                  dangerouslySetInnerHTML={{ __html: item.html }}
                />
              )}
            </li>
          )
        })}
      </ul>

      {items.length === 0 && (
        <p style={{ color: '#888' }}>暂无结果，输入关键词开始搜索（当前为 mock 数据）。</p>
      )}

      <style>{`.video-embed iframe { width: 100% !important; height: 100% !important; border: 0; display: block; }`}</style>
    </main>
  )
}
