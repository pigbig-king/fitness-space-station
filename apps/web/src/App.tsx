import { Route, Routes } from 'react-router'
import AdminGuard from './components/admin-guard'
import Layout from './components/layout'
import ProtectedRoute from './components/protected-route'
import AchievementsPage from './pages/AchievementsPage'
import BodyMetricsPage from './pages/BodyMetricsPage'
import AdminPage from './pages/admin/AdminPage'
import ArticleEditPage from './pages/admin/ArticleEditPage'
import ArticleCreatePage from './pages/ArticleCreatePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import ArticlesPage from './pages/ArticlesPage'
import DiscoverPage from './pages/DiscoverPage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import NotificationsPage from './pages/NotificationsPage'
import PlanPage from './pages/PlanPage'
import RegisterPage from './pages/RegisterPage'
import ResearchPage from './pages/ResearchPage'
import SearchPage from './pages/SearchPage'
import TagsPage from './pages/TagsPage'
import UserProfilePage from './pages/UserProfilePage'
import VideoDetailPage from './pages/VideoDetailPage'
import VideosPage from './pages/VideosPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
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
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/log" element={<LogPage />} />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <PlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/favorites"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/body"
          element={
            <ProtectedRoute>
              <BodyMetricsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/achievements"
          element={
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/articles/:id/edit"
          element={
            <AdminGuard>
              <ArticleEditPage />
            </AdminGuard>
          }
        />
        <Route path="/tags/:name" element={<TagsPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
