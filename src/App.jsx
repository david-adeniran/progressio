import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import GoalDetailPage from './pages/GoalDetailPage'
import GoalsPage from './pages/GoalsPage'
import CategoriesPage from './pages/CategoriesPage'
import AchievementsPage from './pages/AchievementsPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function SplashScreen() {
  // Apply theme before Layout mounts
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)', gap: '1.5rem'
    }}>
      <style>{`
        @keyframes dance {
          0%   { transform: translateY(0px) rotate(0deg) scale(1); }
          15%  { transform: translateY(-18px) rotate(-4deg) scale(1.05); }
          30%  { transform: translateY(-8px) rotate(3deg) scale(1.02); }
          45%  { transform: translateY(-20px) rotate(-3deg) scale(1.06); }
          60%  { transform: translateY(-6px) rotate(2deg) scale(1.01); }
          75%  { transform: translateY(-14px) rotate(-2deg) scale(1.04); }
          90%  { transform: translateY(-4px) rotate(1deg) scale(1.01); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,106,247,0.4); }
          50%       { box-shadow: 0 0 40px rgba(124,106,247,0.8), 0 0 60px rgba(62,207,142,0.3); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Dancing logo */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, #7c6af7, #3ecf8e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: '2rem', color: '#fff',
        animation: 'dance 1.2s ease-in-out infinite, glow 1.2s ease-in-out infinite',
      }}>
        P
      </div>

      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '1.5rem',
        fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em',
        animation: 'fadeInUp 0.5s ease both',
      }}>
        Progressio
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            animation: `dotPulse 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <SplashScreen />
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="goal/:goalId" element={<GoalDetailPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
