import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvatar } from '../hooks/useAvatar'
import { AVATARS } from '../lib/avatars'
import {
  signOut, updateProfile,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { LogOut, User, Lock, Moon, Sun, Check, Shield, Info, Bell, ChevronRight } from 'lucide-react'
import styles from './SettingsPage.module.css'

function Section({ title, icon: Icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <Icon size={13} color="var(--text-dim)" strokeWidth={2} />
        <span className={styles.sectionTitle}>{title}</span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function Row({ label, sub, right, onClick, danger }) {
  return (
    <div className={`${styles.row} ${onClick ? styles.rowClickable : ''} ${danger ? styles.rowDanger : ''}`} onClick={onClick}>
      <div className={styles.rowLeft}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </div>
      <div className={styles.rowRight}>{right}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { avatarId, saveAvatar } = useAvatar(user?.uid)
  const navigate = useNavigate()

  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [nameSuccess, setNameSuccess] = useState('')
  const [nameError, setNameError] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Apply theme on mount and on change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName)
  }, [user?.displayName])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut(auth)
      navigate('/auth')
    } catch {
      setSigningOut(false)
    }
  }

  async function saveName(e) {
    e.preventDefault()
    setNameError(''); setNameSuccess('')
    if (!displayName.trim()) { setNameError('Name cannot be empty.'); return }
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await auth.currentUser.reload()
      if (refreshUser) refreshUser()
      setNameSuccess('Saved.')
      setTimeout(() => setNameSuccess(''), 3000)
    } catch {
      setNameError('Failed to update. Try again.')
    }
    setSaving(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (newPw.length < 8) { setPwError('Must be at least 8 characters.'); return }
    setSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPw)
      setPwSuccess('Password updated.')
      setCurrentPw(''); setNewPw('')
    } catch (err) {
      setPwError(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : 'Something went wrong.')
    }
    setSaving(false)
  }

  async function handleAvatarSelect(id) {
    setAvatarSaving(true)
    await saveAvatar(id)
    setAvatarSaving(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Account */}
      <Section title="Account" icon={User}>
        <div className={styles.avatarRow}>
          <span className={styles.fieldLabel}>Avatar {avatarSaving && <span className={styles.saving}>saving…</span>}</span>
          <div className={styles.avatarGrid}>
            {AVATARS.map(a => (
              <button key={a.id}
                className={`${styles.avatarBtn} ${avatarId === a.id ? styles.avatarBtnActive : ''}`}
                onClick={() => handleAvatarSelect(a.id)} title={a.label}>
                <img src={a.url} alt={a.label} className={styles.avatarImg} />
                {avatarId === a.id && (
                  <div className={styles.avatarCheck}><Check size={10} color="#fff" strokeWidth={3} /></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <form onSubmit={saveName}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Email</label>
            <input className={styles.input} value={user?.email || ''} disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Display name</label>
            <div className={styles.inputRow}>
              <input className={styles.input} value={displayName}
                onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
              <button className={styles.saveBtn} type="submit" disabled={saving}>
                {saving ? '…' : 'Save'}
              </button>
            </div>
            {nameSuccess && <p className={styles.ok}>{nameSuccess}</p>}
            {nameError && <p className={styles.err}>{nameError}</p>}
          </div>
        </form>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={dark ? Moon : Sun}>
        <Row
          label="Theme"
          sub={dark ? 'Dark' : 'Light'}
          right={
            <button className={`${styles.toggle} ${dark ? styles.toggleOn : ''}`} onClick={toggleTheme}>
              <div className={styles.toggleKnob} />
            </button>
          }
        />
      </Section>

      {/* Security */}
      <Section title="Security" icon={Lock}>
        <form onSubmit={savePassword}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Current password</label>
            <input className={styles.input} type="password" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>New password</label>
            <input className={styles.input} type="password" value={newPw}
              onChange={e => setNewPw(e.target.value)} placeholder="8+ characters" />
          </div>
          {pwError && <p className={styles.err}>{pwError}</p>}
          {pwSuccess && <p className={styles.ok}>{pwSuccess}</p>}
          <button className={styles.saveBtn} type="submit" disabled={saving || !currentPw || !newPw}>
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <div className={styles.divider} />

        <Row
          label="Verified email"
          sub={user?.emailVerified ? user.email : 'Not verified'}
          right={
            <span className={styles.badge} style={{ color: user?.emailVerified ? 'var(--success)' : 'var(--danger)', background: user?.emailVerified ? 'var(--success-dim)' : 'var(--danger-dim)' }}>
              {user?.emailVerified ? 'Verified' : 'Unverified'}
            </span>
          }
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Row label="Check-in reminders" sub="Remind you to log progress daily" right={<span className={styles.comingSoon}>Soon</span>} />
        <Row label="Streak alerts" sub="Alert when your streak is at risk" right={<span className={styles.comingSoon}>Soon</span>} />
        <Row label="Goal completions" sub="Celebrate when you hit 100%" right={<span className={styles.comingSoon}>Soon</span>} />
      </Section>

      {/* Privacy */}
      <Section title="Privacy" icon={Shield}>
        <Row label="Data storage" sub="Goals and progress stored in Firebase (Google)" right={null} />
        <Row label="Analytics" sub="No third-party tracking" right={null} />
      </Section>

      {/* About */}
      <Section title="About" icon={Info}>
        <Row label="Progressio" sub="Version 1.0.0" right={null} />
        <Row label="Built by" sub="David Adeniran" right={null} />
      </Section>

      {/* Sign out */}
      <button className={styles.signOutBtn} onClick={handleSignOut} disabled={signingOut}>
        <LogOut size={15} />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
