import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAvatar(userId) {
  const [avatarId, setAvatarId] = useState(null)
  const [realName, setRealName] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setAvatarId(null); setRealName(null); setLoading(false); return }
    const ref = doc(db, 'users', userId, 'meta', 'profile')
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data()
        setAvatarId(data.avatarId || null)
        setRealName(data.realName || null)
      } else {
        setAvatarId(null)
        setRealName(null)
      }
      setLoading(false)
    })
    return unsub
  }, [userId])

  async function saveAvatar(id) {
    if (!userId) return
    const ref = doc(db, 'users', userId, 'meta', 'profile')
    const snap = await getDoc(ref)
    const current = snap.exists() ? snap.data() : {}
    await setDoc(ref, { ...current, avatarId: id }, { merge: true })
    setAvatarId(id)
  }

  // Intended to be called exactly once, at signup (or as a one-time backfill
  // for older accounts). If realName is already set, this is a no-op — the
  // account's real name stays immutable even if this gets called again.
  async function setRealNameOnce(name) {
    if (!userId || !name) return
    const ref = doc(db, 'users', userId, 'meta', 'profile')
    const snap = await getDoc(ref)
    const current = snap.exists() ? snap.data() : {}
    if (current.realName) return
    await setDoc(ref, { ...current, realName: name }, { merge: true })
    setRealName(name)
  }

  return { avatarId, realName, loading, saveAvatar, setRealNameOnce }
}