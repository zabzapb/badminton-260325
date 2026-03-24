import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// ── Static Imports (Direct) ────────────────────────
// Critical for auth flows to avoid black screen and improve speed
import HomePage from '@/pages/HomePage'
import MasterPage from '@/pages/MasterPage'
import NaverAuthCallback from '@/pages/auth/callback'

// ── Lazy-loaded Pages (Secondary) ──────────────────
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const DashboardEditPage = lazy(() => import('@/pages/DashboardEditPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const RegisterTournamentPage = lazy(() => import('@/pages/RegisterTournamentPage'))
const TournamentApplyPage = lazy(() => import('@/pages/TournamentApplyPage'))
const TournamentEditPage = lazy(() => import('@/pages/TournamentEditPage'))
const AdminCleanupPage = lazy(() => import('@/pages/admin/AdminCleanupPage'))
const AdminSeedPage = lazy(() => import('@/pages/admin/AdminSeedPage'))
const AdminPlayersPage = lazy(() => import('@/pages/admin/AdminPlayersPage'))
const AdminPlayerNewPage = lazy(() => import('@/pages/admin/AdminPlayerNewPage'))
const AdminPlayerEditPage = lazy(() => import('@/pages/admin/AdminPlayerEditPage'))
const IdentityResolvePage = lazy(() => import('@/pages/admin/identity-resolve'))

// ── Loading Spinner ────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000', // Matches app background
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid rgba(226, 251, 78, 0.1)',
        borderTopColor: '#E2FB4E', // HCTC Primary
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
      }} />
      <span style={{ fontSize: '14px', color: '#A0A0A5', fontWeight: 500 }}>정보를 불러오고 있습니다</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── App Shell ──────────────────────────────────────
export default function App() {
  return (
    <div className="app-shell">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/naver/callback" element={<NaverAuthCallback />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/edit/:id" element={<DashboardEditPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/tournament" element={<RegisterTournamentPage />} />
          <Route path="/tournament/:id/apply" element={<TournamentApplyPage />} />
          <Route path="/tournament/:id/edit" element={<TournamentEditPage />} />
          <Route path="/master" element={<MasterPage />} />

          {/* Admin */}
          <Route path="/admin/cleanup" element={<AdminCleanupPage />} />
          <Route path="/admin/seed" element={<AdminSeedPage />} />
          <Route path="/admin/players" element={<AdminPlayersPage />} />
          <Route path="/admin/players/new" element={<AdminPlayerNewPage />} />
          <Route path="/admin/players/:id/edit" element={<AdminPlayerEditPage />} />
          <Route path="/admin/identity-resolve" element={<IdentityResolvePage />} />
        </Routes>
      </Suspense>
    </div>
  )
}
