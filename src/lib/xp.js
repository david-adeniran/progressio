// XP & Level System

export const LEVELS = [
  { level: 1,  xpRequired: 0,    title: 'Rookie' },
  { level: 2,  xpRequired: 100,  title: 'Rising' },
  { level: 3,  xpRequired: 250,  title: 'Grinder' },
  { level: 4,  xpRequired: 500,  title: 'Focused' },
  { level: 5,  xpRequired: 900,  title: 'Driven' },
  { level: 6,  xpRequired: 1400, title: 'Hustler' },
  { level: 7,  xpRequired: 2000, title: 'Elite' },
  { level: 8,  xpRequired: 2800, title: 'Legend' },
  { level: 9,  xpRequired: 3800, title: 'Apex' },
  { level: 10, xpRequired: 5000, title: 'Transcendent' },
]

export const CATEGORY_TITLES = {
  Finance: ['Saver', 'Money Moves', 'Investor', 'Finance Lord', 'Wealth Architect'],
  Fitness: ['Beginner', 'Active', 'Athlete', 'Beast Mode', 'Unstoppable'],
  Learning: ['Curious', 'Student', 'Scholar', 'Sage', 'Omniscient'],
  Health:   ['Aware', 'Balanced', 'Vital', 'Thriving', 'Optimal'],
  Career:   ['Aspiring', 'Building', 'Professional', 'Executive', 'Visionary'],
  Travel:   ['Explorer', 'Adventurer', 'Wanderer', 'Nomad', 'Pathfinder'],
  Personal: ['Growing', 'Evolving', 'Intentional', 'Enlightened', 'Actualized'],
  Custom:   ['Starter', 'Builder', 'Achiever', 'Master', 'Legend'],
}

export function getLevelInfo(xp) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i]
      next = LEVELS[i + 1] || null
      break
    }
  }
  const xpIntoLevel = xp - current.xpRequired
  const xpNeeded = next ? next.xpRequired - current.xpRequired : 1
  const pct = next ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100
  return { level: current.level, title: current.title, xp, pct, xpIntoLevel, xpNeeded, next }
}

export function getCategoryLevel(goals, category) {
  const catGoals = goals.filter(g => g.category === category)
  const completed = catGoals.filter(g => g.progress >= 100).length
  const totalProgress = catGoals.reduce((s, g) => s + (g.progress || 0), 0)
  const score = completed * 2 + Math.round(totalProgress / 100)
  const titleIdx = Math.min(Math.floor(score / 2), 4)
  const titles = CATEGORY_TITLES[category] || CATEGORY_TITLES.Custom
  return { score, title: titles[titleIdx], goalsCount: catGoals.length, completed }
}

export function calcTotalXP(goals) {
  return goals.reduce((total, g) => {
    const logs = g.logs || []
    const logXP = logs.length * 10
    const completionBonus = g.progress >= 100 ? 100 : 0
    const progressXP = Math.floor((g.progress || 0) / 10) * 5
    return total + logXP + completionBonus + progressXP
  }, 0)
}

export const ACHIEVEMENTS = [
  { id: 'first_goal',    label: 'First Step',      desc: 'Created your first goal',         icon: '🎯', condition: (goals) => goals.length >= 1 },
  { id: 'first_log',     label: 'In Motion',       desc: 'Logged your first entry',          icon: '📝', condition: (goals) => goals.some(g => (g.logs||[]).length >= 1) },
  { id: 'goal_complete', label: 'Finisher',        desc: 'Completed a goal',                 icon: '✅', condition: (goals) => goals.some(g => g.progress >= 100) },
  { id: 'five_goals',    label: 'Ambitious',       desc: 'Created 5 goals',                  icon: '🚀', condition: (goals) => goals.length >= 5 },
  { id: 'three_cats',    label: 'Well-Rounded',    desc: 'Goals in 3+ categories',           icon: '🌐', condition: (goals) => new Set(goals.map(g => g.category)).size >= 3 },
  { id: 'ten_logs',      label: 'Consistent',      desc: 'Logged 10 entries total',          icon: '🔥', condition: (goals) => goals.reduce((s, g) => s + (g.logs||[]).length, 0) >= 10 },
  { id: 'halfway',       label: 'Halfway There',   desc: 'A goal reached 50%',               icon: '⚡', condition: (goals) => goals.some(g => g.progress >= 50) },
  { id: 'level5',        label: 'Level Up',        desc: 'Reached Level 5',                  icon: '⭐', condition: (goals, xp) => getLevelInfo(xp).level >= 5 },
  { id: 'three_done',    label: 'Hat Trick',       desc: 'Completed 3 goals',                icon: '🏆', condition: (goals) => goals.filter(g => g.progress >= 100).length >= 3 },
]

export function getUnlockedAchievements(goals, xp) {
  return ACHIEVEMENTS.filter(a => a.condition(goals, xp))
}
