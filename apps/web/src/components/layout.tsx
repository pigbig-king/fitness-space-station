import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '@/contexts/auth-context'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm ${
    isActive ? 'bg-indigo-50 font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
  }`

const LINKS = [
  { to: '/', label: '首页', end: true },
  { to: '/articles', label: '社区', end: false },
  { to: '/log', label: '记录', end: false },
  { to: '/videos', label: '视频', end: false },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2.5">
          <Link to="/" className="mr-2 font-semibold">
            健身空间站
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted text-sm">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      (user.nickname?.[0] ?? user.email[0] ?? '用').toUpperCase()
                    )}
                  </span>
                  <span className="hidden text-sm sm:inline">{user.nickname ?? user.email}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-40 rounded-md border bg-background p-1 shadow-md">
                    <Link
                      to={`/users/${user.id}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      我的主页
                    </Link>
                    <Link
                      to="/me/favorites"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      我的收藏
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        管理后台
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                    >
                      退出
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-primary hover:bg-muted">
                登录
              </Link>
            )}

            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-muted md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="菜单"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t px-4 py-2 md:hidden">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className="block rounded px-2 py-2 text-sm hover:bg-muted"
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
      <Outlet />
    </>
  )
}
