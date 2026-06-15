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
import { LogOut, User, Lock, Moon, Sun, ChevronRight, Check } from 'lucide-react'
import styles from './SettingsPage.module.css'

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Keep displayName input in sync if user object updates
  useEffect(() => {
    if (user?.displayName) setDisplayName(user.displayName)
  }, [user?.displayName])

  async function handleSignOut() {
    await signOut(auth)
    navigate('/auth')
  }

  async function saveName(e) {
    e.preventDefault()
    setNameError(''); setNameSuccess('')
    if (!displayName.trim()) { setNameError('Name cannot be empty.'); return }
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      // Force re-render by reloading the user object
      await auth.currentUser.reload()
      if (refreshUser) refreshUser()
      setNameSuccess('Name updated!')
      setTimeout(() => setNameSuccess(''), 3000)
    } catch (err) {
      setNameError('Failed to update name. Try again.')
    }
    setSaving(false)
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwError(''); setPwSuccess('')
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(auth.currentUser, cred)
      await updatePassword(auth.currentUser, newPw)
      setPwSuccess('Password updated!')
      setCurrentPw(''); setNewPw('')
    } catch (err) {
      setPwError(err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : 'Something went wrong. Try again.')
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
        <p className={styles.sub}>Manage your account and preferences</p>
      </div>

      {/* Avatar picker */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={16} color="var(--accent)" />
          <h2 className={styles.sectionTitle}>Choose your avatar</h2>
          {avatarSaving && <span className={styles.savingBadge}>Saving…</span>}
        </div>

        <div className={styles.avatarGrid}>
          {AVATARS.map(a => (
            <button
              key={a.id}
              className={`${styles.avatarOption} ${avatarId === a.id ? styles.avatarSelected : ''}`}
              onClick={() => handleAvatarSelect(a.id)}
              title={a.label}
            >
              <img src={a.url} alt={a.label} className={styles.avatarImg} />
              {avatarId === a.id && (
                <div className={styles.avatarCheck}>
                  <Check size={12} color="#fff" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={16} color="var(--accent)" />
          <h2 className={styles.sectionTitle}>Profile</h2>
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>Email</label>
          <input className={styles.input} value={user?.email || ''} disabled />
        </div>
        <form onSubmit={saveName}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Display name</label>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ flexShrink: 0 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {nameSuccess && <p className={styles.success}>{nameSuccess}</p>}
            {nameError && <p className={styles.error}>{nameError}</p>}
          </div>
        </form>
      </div>

      {/* Appearance */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          {dark ? <Moon size={16} color="var(--accent)" /> : <Sun size={16} color="var(--gold)" />}
          <h2 className={styles.sectionTitle}>Appearance</h2>
        </div>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Theme</div>
            <div className={styles.toggleSub}>{dark ? 'Dark mode' : 'Light mode'}</div>
          </div>
          <button className={`${styles.themeToggle} ${dark ? styles.dark : ''}`} onClick={() => setDark(v => !v)}>
            <div className={styles.themeKnob}>
              {dark ? <Moon size={10} color="#fff" /> : <Sun size={10} color="#f0a844" />}
            </div>
          </button>
        </div>
      </div>

      {/* Password */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Lock size={16} color="var(--accent)" />
          <h2 className={styles.sectionTitle}>Change password</h2>
        </div>
        <form onSubmit={savePassword}>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>Current password</label>
            <input className={styles.input} type="password" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" />
          </div>
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>New password</label>
            <input className={styles.input} type="password" value={newPw}
              onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" />
          </div>
          {pwError && <p className={styles.error}>{pwError}</p>}
          {pwSuccess && <p className={styles.success}>{pwSuccess}</p>}
          <button className="btn btn-primary" type="submit" disabled={saving || !currentPw || !newPw}>
            Update password
          </button>
        </form>
      </div>

      {/* Account */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <LogOut size={16} color="var(--danger)" />
          <h2 className={styles.sectionTitle}>Account</h2>
        </div>
        <button className={styles.signOutBtn} onClick={handleSignOut}>
          <LogOut size={15} /> Sign out
          <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
        </button>
      </div>
    </div>
  )
}
