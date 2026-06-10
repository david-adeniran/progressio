import { Outlet, Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

export default function Layout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/auth')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Progressio</Link>
        <div className={styles.headerRight}>
          <span className={styles.email}>{user?.email}</span>
          <button className="btn btn-ghost" onClick={handleSignOut} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Sign out</button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
