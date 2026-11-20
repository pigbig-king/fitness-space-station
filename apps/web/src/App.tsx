import { useState, type CSSProperties } from 'react'
import { Link, Route, Routes } from 'react-router'
import ProtectedRoute from './components/protected-route'
import { useAuth } from './contexts/auth-context'
import ArticleCreatePage from './pages/ArticleCreatePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import ArticlesPage from './pages/ArticlesPage'
import FavoritesPage from './pages/FavoritesPage'
import LogPage from './pages/LogPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResearchPage from './pages/ResearchPage'
import VideoDetailPage from './pages/VideoDetailPage'
import VideosPage from './pages/VideosPage'

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

type Page = 'home' | 'log'

function MainApp() {
  const [page, setPage] = useState<Page>('home')
  const { user, logout } = useAuth()

  function renderPage() {
    if (page === 'log') return <LogPage />
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
        <Link to="/articles" style={navStyle(false)}>
          科研
        </Link>
        <button type="button" onClick={() => setPage('log')} style={navStyle(page === 'log')}>
          记录
        </button>
        <Link to="/videos" style={navStyle(false)}>
          视频
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <>
              <Link to="/me/favorites" style={navStyle(false)}>
                我的收藏
              </Link>
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
      <Route path="/videos" element={<VideosPage />} />
      <Route path="/videos/:id" element={<VideoDetailPage />} />
      <Route path="/articles" element={<ArticlesPage />} />
      <Route
        path="/articles/new"
        element={
          <ProtectedRoute>
            <ArticleCreatePage />
          </ProtectedRoute>
        }
      />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/research" element={<ResearchPage />} />
      <Route
        path="/me/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route path="/*" element={<MainApp />} />
    </Routes>
  )
}

export default App
