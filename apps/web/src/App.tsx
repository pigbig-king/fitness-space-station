import { useState, type CSSProperties } from 'react'
import { Link, Route, Routes } from 'react-router'
import { useAuth } from './contexts/auth-context'
import LogPage from './pages/LogPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResearchPage from './pages/ResearchPage'
import VideoPage from './pages/VideoPage'

const navStyle = (active: boolean): CSSProperties => ({
  padding: '0.4rem 0.9rem',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: active ? '#eef2ff' : '#fff',
  fontWeight: active ? 700 : 400,
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#000',
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

type Page = 'home' | 'research' | 'log' | 'video'

function MainApp() {
  const [page, setPage] = useState<Page>('home')
  const { user, logout } = useAuth()

  function renderPage() {
    if (page === 'research') return <ResearchPage />
    if (page === 'log') return <LogPage />
    if (page === 'video') return <VideoPage />
    return <Home />
  }

  return (
    <>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
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
        <button type="button" onClick={() => setPage('research')} style={navStyle(page === 'research')}>
          科研
        </button>
        <button type="button" onClick={() => setPage('log')} style={navStyle(page === 'log')}>
          记录
        </button>
        <button type="button" onClick={() => setPage('video')} style={navStyle(page === 'video')}>
          视频
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>{user.email}</span>
              <button type="button" onClick={logout} style={navStyle(false)}>
                退出
              </button>
            </>
          ) : (
            <Link to="/login" style={navStyle(false)}>
              登录
            </Link>
          )}
        </div>
      </nav>
      {renderPage()}
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  )
}

export default App
