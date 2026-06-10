import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useGoals(userId) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setGoals([]); setLoading(false); return }
    const q = query(
      collection(db, 'users', userId, 'goals'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [userId])

  async function addGoal(data) {
    await addDoc(collection(db, 'users', userId, 'goals'), {
      ...data,
      currentAmount: 0,
      progress: 0,
      logs: [],
      createdAt: serverTimestamp(),
    })
  }

  async function updateGoal(goalId, data) {
    await updateDoc(doc(db, 'users', userId, 'goals', goalId), data)
  }

  async function deleteGoal(goalId) {
    await deleteDoc(doc(db, 'users', userId, 'goals', goalId))
  }

  async function logEntry(goalId, { amount, note, date }) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const entryAmount = Number(amount) || 0
    const newTotal = (goal.currentAmount || 0) + entryAmount
    const target = Number(goal.targetAmount) || 0
    const newProgress = target > 0 ? Math.min(100, Math.round((newTotal / target) * 100)) : 0

    const entry = {
      amount: entryAmount,
      runningTotal: newTotal,
      progress: newProgress,
      note: note || '',
      date: date || new Date().toISOString(),
    }

    const logs = [...(goal.logs || []), entry]

    await updateDoc(doc(db, 'users', userId, 'goals', goalId), {
      logs,
      currentAmount: newTotal,
      progress: newProgress,
    })
  }

  // For milestone goals — manual % update
  async function logMilestone(goalId, { progress, note }) {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const entry = {
      progress: Math.min(100, Math.max(0, Number(progress))),
      note: note || '',
      date: new Date().toISOString(),
    }
    const logs = [...(goal.logs || []), entry]
    await updateDoc(doc(db, 'users', userId, 'goals', goalId), {
      logs,
      progress: entry.progress,
    })
  }

  return { goals, loading, addGoal, updateGoal, deleteGoal, logEntry, logMilestone }
}
