import type { CSSProperties } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useAuth } from '@/contexts/auth-context'

const navItemStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  padding: '0.4rem 0.9rem',
  fontSize: '1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  background: isActive ? '#eef2ff' : '#fff',
  fontWeight: isActive ? 700 : 400,
  textDecoration: 'none',
  color: '#000',
})

export default function Layout() {
  const { user, logout } = useAuth()

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
        <NavLink to="/" end style={navItemStyle}>
          首页
        </NavLink>
        <NavLink to="/articles" style={navItemStyle}>
          社区
        </NavLink>
        <NavLink to="/log" style={navItemStyle}>
          记录
        </NavLink>
        <NavLink to="/videos" style={navItemStyle}>
          视频
        </NavLink>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <>
              <NavLink to="/me/favorites" style={navItemStyle}>
                我的收藏
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/admin" style={navItemStyle}>
                  管理后台
                </NavLink>
              )}
              <span style={{ fontSize: '0.9rem', color: '#555' }}>{user.email}</span>
              <button type="button" onClick={logout} style={navItemStyle({ isActive: false })}>
                退出
              </button>
            </>
          ) : (
            <NavLink to="/login" style={navItemStyle}>
              登录
            </NavLink>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  )
}
