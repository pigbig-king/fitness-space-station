import { useState, type CSSProperties } from 'react'
import VideoPage from './pages/VideoPage'

const navStyle = (active: boolean): CSSProperties => ({
  padding: '0.4rem 0.9rem',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: active ? '#eef2ff' : '#fff',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
})

function Home() {
  return (
    <main
      style={{
        minHeight: 'calc(100vh - 53px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        textAlign: 'center',
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '1rem',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '2rem' }}>健身空间站 Fitness Space Station</h1>
      <p style={{ margin: 0, color: '#555' }}>
        训练记录 · 计划自适应 · 科研证据 · 动作检查
      </p>
    </main>
  )
}

function App() {
  const [page, setPage] = useState<'home' | 'video'>('home')

  return (
    <>
      <nav
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          background: '#fff',
        }}
      >
        <button type="button" onClick={() => setPage('home')} style={navStyle(page === 'home')}>
          首页
        </button>
        <button type="button" onClick={() => setPage('video')} style={navStyle(page === 'video')}>
          视频
        </button>
      </nav>
      {page === 'home' ? <Home /> : <VideoPage />}
    </>
  )
}

export default App
