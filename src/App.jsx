import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from './lib/firebase'
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

function VerificationPending() {
  const { user } = useAuth()
  const [resent, setResent] = useState(false)
  const [checking, setChecking] = useState(false)

  async function resendEmail() {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    }
  }

  async function checkVerification() {
    setChecking(true)
    await auth.currentUser?.reload()
    if (auth.currentUser?.emailVerified) {
      window.location.reload()
    } else {
      setChecking(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', padding: '2rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #7c6af7, #3ecf8e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#fff', margin: '0 auto 1.5rem' }}>P</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.75rem' }}>Verify your email</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          We sent a verification link to <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>. Click it to access Progressio.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }} onClick={checkVerification} disabled={checking}>
            {checking ? 'Checking…' : "I've verified my email"}
          </button>
          <button className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }} onClick={resendEmail} disabled={resent}>
            {resent ? '✓ Email sent!' : 'Resend verification email'}
          </button>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Wrong email? <button onClick={() => { auth.signOut() }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>Sign out</button>
        </p>
      </div>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <SplashScreen />
  if (!user) return <Navigate to="/auth" replace />
  if (!user.emailVerified) return <VerificationPending />
  return children
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
