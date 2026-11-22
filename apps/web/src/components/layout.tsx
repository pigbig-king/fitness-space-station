import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm ${
    isActive ? 'bg-indigo-50 font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'
  }`

const LINKS = [
  { to: '/', label: '首页', end: true },
  { to: '/articles', label: '社区', end: false },
  { to: '/discover', label: '发现', end: false },
  { to: '/feed', label: '动态', end: false },
  { to: '/log', label: '记录', end: false },
  { to: '/videos', label: '视频', end: false },
]

export default function Layout() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const data = await apiFetch<{ unreadCount: number }>('/notifications', { token })
      return data.unreadCount
    },
    enabled: Boolean(token),
  })

  const msgUnreadQuery = useQuery({
    queryKey: ['messages-unread'],
    queryFn: () => apiFetch<number>('/conversations/unread-count', { token }),
    enabled: Boolean(token),
    refetchInterval: 15000,
  })

  function handleLogout() {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  function submitSearch() {
    const q = keyword.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setKeyword('')
  }

  return (
    <>
      <nav className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2.5">
          <Link to="/" className="mr-2 shrink-0 font-semibold">
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
            <div className="hidden items-center sm:flex">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                }}
                placeholder="搜索…"
                className="h-8 w-40 rounded-md border border-input bg-transparent px-2 text-sm"
              />
              <button type="button" onClick={submitSearch} className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                搜索
              </button>
            </div>

            {user && (
              <button
                type="button"
                className="relative rounded-md p-1.5 hover:bg-muted"
                onClick={() => navigate('/messages')}
                aria-label="消息"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {(msgUnreadQuery.data ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                    {msgUnreadQuery.data}
                  </span>
                )}
              </button>
            )}

            {user && (
              <button
                type="button"
                className="relative rounded-md p-1.5 hover:bg-muted"
                onClick={() => navigate('/notifications')}
                aria-label="通知"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {(unreadQuery.data ?? 0) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                    {unreadQuery.data}
                  </span>
                )}
              </button>
            )}

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
                    <Link
                      to="/me/body"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      身体数据
                    </Link>
                    <Link
                      to="/me/achievements"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      我的成就
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
            <div className="mb-2 flex gap-1">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitSearch()
                }}
                placeholder="搜索…"
                className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
              />
              <button type="button" onClick={submitSearch} className="rounded-md px-2 text-sm hover:bg-muted">
                搜索
              </button>
            </div>
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
