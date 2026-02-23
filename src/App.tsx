import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppHeader } from './components/layout/AppHeader'
import { AppFooter } from './components/layout/AppFooter'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicSearchPage } from './pages/PublicSearchPage'
import { FacilityDetailPage } from './pages/FacilityDetailPage'
import { LoginPage } from './pages/LoginPage'
import { ProviderDashboardPage } from './pages/ProviderDashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-4">🏥</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-blue-600 hover:underline font-medium">← Back to search</a>
    </div>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<PublicSearchPage />} />
            <Route path="/facility/:id" element={<FacilityDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/provider"
              element={
                <ProtectedRoute requiredRole={['provider', 'admin']}>
                  <ProviderDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
