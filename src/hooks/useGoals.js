import { useState, useEffect } from "react";
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
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useGoals(userId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function getUnlockedAchievements() {
    const unlocked = new Set();
    if (goals.length >= 1) unlocked.add("first_goal");
    if (goals.length >= 5) unlocked.add("goals_5");
    if (goals.length >= 10) unlocked.add("goals_10");
    const totalLogs = goals.reduce((s, g) => s + (g.logs || []).length, 0);
    if (totalLogs >= 1) unlocked.add("first_log");
    const completed = goals.filter((g) => g.progress >= 100);
    if (completed.length >= 1) unlocked.add("first_complete");
    if (completed.length >= 3) unlocked.add("complete_3");
    const cats = new Set(goals.map((g) => g.category));
    if (cats.size >= 7) unlocked.add("all_categories");
    return unlocked;
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
  };
}
