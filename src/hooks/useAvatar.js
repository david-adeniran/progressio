import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useAvatar(userId) {
  const [avatarId, setAvatarId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setAvatarId(null); setLoading(false); return }
    const ref = doc(db, 'users', userId, 'meta', 'profile')
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setAvatarId(snap.data().avatarId || null)
      else setAvatarId(null)
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

  return { avatarId, loading, saveAvatar }
}
