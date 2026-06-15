import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { ACHIEVEMENTS, calcTotalXP } from "../lib/xp";

export function useGoals(userId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [persistedAchievements, setPersistedAchievements] = useState(new Set())
  const persistedRef = useRef(new Set())
  const [isResetting, setIsResetting] = useState(false)

  // Load persisted achievements from Firestore
  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, "users", userId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.unlockedAchievements) {
          const s = new Set(data.unlockedAchievements)
          setPersistedAchievements(s)
          persistedRef.current = s
        }
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", userId, "goals"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  async function addGoal(data) {
    await addDoc(collection(db, "users", userId, "goals"), {
      ...data,
      currentAmount: 0,
      progress: 0,
      xp: 0,
      logs: [],
      createdAt: serverTimestamp(),
    });
    // Save achievements immediately after adding a goal
    const updatedGoals = [...goals, { ...data, progress: 0, logs: [] }]
    const totalXP = calcTotalXP(updatedGoals)
    const current = new Set(persistedRef.current)
    for (const a of ACHIEVEMENTS) {
      try { if (a.condition(updatedGoals, totalXP)) current.add(a.id) } catch (e) {}
    }
    persistedRef.current = current
    setPersistedAchievements(current)
    await saveAchievements(current)
  }

  async function updateGoal(goalId, data) {
    await updateDoc(doc(db, "users", userId, "goals", goalId), data);
  }

  async function deleteGoal(goalId) {
    await deleteDoc(doc(db, "users", userId, "goals", goalId));
  }

  async function logEntry(goalId, { amount, note, date }) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    if (goal.progress >= 100) return; // No XP for completed goals

    const entryAmount = Number(amount) || 0;
    const newTotal = (goal.currentAmount || 0) + entryAmount;
    const target = Number(goal.targetAmount) || 0;
    const newProgress =
      target > 0 ? Math.min(100, Math.round((newTotal / target) * 100)) : 0;
    const pctContribution = target > 0 ? (entryAmount / target) * 100 : 0;
    const earnedXp =
      Math.max(10, Math.round(pctContribution)) + (newProgress >= 100 ? 50 : 0);

    const entry = {
      amount: entryAmount,
      runningTotal: newTotal,
      progress: newProgress,
      xpEarned: earnedXp,
      note: note || "",
      date: date || new Date().toISOString(),
    };

    await updateDoc(doc(db, "users", userId, "goals", goalId), {
      logs: [...(goal.logs || []), entry],
      currentAmount: newTotal,
      progress: newProgress,
      xp: (goal.xp || 0) + earnedXp,
    });

    // Save achievements immediately after logging
    const updatedGoals = goals.map(g => g.id === goalId
      ? { ...g, logs: [...(g.logs || []), entry], currentAmount: newTotal, progress: newProgress }
      : g)
    const totalXP = calcTotalXP(updatedGoals)
    const current = new Set(persistedRef.current)
    for (const a of ACHIEVEMENTS) {
      try { if (a.condition(updatedGoals, totalXP)) current.add(a.id) } catch (e) {}
    }
    persistedRef.current = current
    setPersistedAchievements(current)
    await saveAchievements(current)

    return { xpEarned: earnedXp, newProgress };
  }

  async function logMilestone(goalId, { progress, note }) {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const p = Math.min(100, Math.max(0, Number(progress)));
    const earnedXp = 20;
    const entry = {
      progress: p,
      xpEarned: earnedXp,
      note: note || "",
      date: new Date().toISOString(),
    };
    await updateDoc(doc(db, "users", userId, "goals", goalId), {
      logs: [...(goal.logs || []), entry],
      progress: p,
      xp: (goal.xp || 0) + earnedXp,
    });
  }

  // Compute total XP and achievements from goals data
  function getTotalXp() {
    return goals.reduce((s, g) => s + (g.xp || 0), 0);
  }

  async function saveAchievements(ids) {
    if (!userId) return;
    await setDoc(doc(db, "users", userId), { unlockedAchievements: [...ids] }, { merge: true });
  }

  function getUnlockedAchievements() {
    if (isResetting) return new Set()

    const current = new Set(persistedRef.current)
    const totalXP = calcTotalXP(goals)

    for (const a of ACHIEVEMENTS) {
      try {
        if (a.condition(goals, totalXP)) current.add(a.id)
      } catch (e) {}
    }

    const hasNew = [...current].some(id => !persistedRef.current.has(id))
    if (hasNew) {
      persistedRef.current = current
      setPersistedAchievements(current)
      saveAchievements(current)
    }

    return current
  }

  async function resetAchievements() {
    if (!userId) return
    setIsResetting(true)
    persistedRef.current = new Set()
    setPersistedAchievements(new Set())
    await setDoc(doc(db, "users", userId), { unlockedAchievements: [] }, { merge: true })
    setIsResetting(false)
  }

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    logEntry,
    logMilestone,
    getTotalXp,
    getUnlockedAchievements,
    resetAchievements,
    persistedAchievements,
  };
}