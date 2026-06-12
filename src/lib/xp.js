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
  { level: 20, xpRequired: 12000, title: 'Immortal' },
  { level: 50, xpRequired: 40000, title: 'Ascended' },
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
    const logXP = logs.length * 5
    const completionBonus = g.progress >= 100 ? 100 : 0
    const progressXP = Math.floor((g.progress || 0) / 5) * 5
    return total + logXP + completionBonus + progressXP
  }, 0)
}

// Helper: total logs across all goals
function totalLogs(goals) {
  return goals.reduce((s, g) => s + (g.logs || []).length, 0)
}

// Helper: completed goals count
function completedCount(goals) {
  return goals.filter(g => (g.progress || 0) >= 100).length
}

// Helper: unique categories with at least one goal
function activeCategories(goals) {
  return new Set(goals.map(g => g.category))
}

// Helper: unique categories with at least one COMPLETED goal
function completedCategories(goals) {
  return new Set(goals.filter(g => g.progress >= 100).map(g => g.category))
}

// Helper: longest log streak in days across all goals
function longestStreak(goals) {
  const allDates = new Set()
  for (const g of goals) {
    for (const log of (g.logs || [])) {
      allDates.add(new Date(log.date).toISOString().split('T')[0])
    }
  }
  if (allDates.size === 0) return 0
  const sorted = [...allDates].sort()
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (curr - prev) / 86400000
    if (diff === 1) { cur++; best = Math.max(best, cur) }
    else cur = 1
  }
  return best
}

// Helper: XP earned in the last 7 days
function xpLastWeek(goals) {
  const cutoff = Date.now() - 7 * 86400000
  return goals.reduce((total, g) => {
    const logs = (g.logs || []).filter(l => new Date(l.date).getTime() >= cutoff)
    return total + logs.length * 5
  }, 0)
}

// Helper: avg progress in a category
function avgCategoryProgress(goals, category) {
  const cats = goals.filter(g => g.category === category)
  if (!cats.length) return 0
  return cats.reduce((s, g) => s + (g.progress || 0), 0) / cats.length
}

// Helper: goals completed in same calendar day
function maxGoalsInOneDay(goals) {
  const byDay = {}
  for (const g of goals) {
    if ((g.progress || 0) < 100) continue
    const logs = g.logs || []
    const last = logs[logs.length - 1]
    if (!last) continue
    const day = new Date(last.date).toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  }
  return Math.max(0, ...Object.values(byDay))
}

// Helper: check if any log was made at 23:11 (11:11 PM)
function hasElevenElevenLog(goals) {
  for (const g of goals) {
    for (const log of (g.logs || [])) {
      const d = new Date(log.date)
      if (d.getHours() === 23 && d.getMinutes() === 11) return true
    }
  }
  return false
}

// ─── ACHIEVEMENTS ────────────────────────────────────────────────────────────
// Tiers: common | rare | epic | legendary | hidden

export const ACHIEVEMENTS = [

  // ── GOAL ACHIEVEMENTS (6) ──────────────────────────────────────────────────
  {
    id: 'first_goal', tier: 'common',
    label: 'First Step', desc: 'Created your first goal',
    icon: 'target',
    condition: (goals) => goals.length >= 1,
  },
  {
    id: 'five_goals', tier: 'common',
    label: 'Ambitious', desc: 'Created 5 goals',
    icon: 'target',
    condition: (goals) => goals.length >= 5,
  },
  {
    id: 'goal_complete', tier: 'common',
    label: 'Finisher', desc: 'Completed your first goal',
    icon: 'check',
    condition: (goals) => completedCount(goals) >= 1,
  },
  {
    id: 'five_complete', tier: 'rare',
    label: 'On a Roll', desc: 'Completed 5 goals',
    icon: 'check',
    condition: (goals) => completedCount(goals) >= 5,
  },
  {
    id: 'ten_complete', tier: 'epic',
    label: 'Unstoppable', desc: 'Completed 10 goals',
    icon: 'trophy',
    condition: (goals) => completedCount(goals) >= 10,
  },
  {
    id: 'twentyfive_complete', tier: 'legendary',
    label: 'Goal Machine', desc: 'Completed 25 goals',
    icon: 'trophy',
    condition: (goals) => completedCount(goals) >= 25,
  },

  // ── STREAK ACHIEVEMENTS (7) ────────────────────────────────────────────────
  {
    id: 'streak_3', tier: 'common',
    label: 'Getting Warm', desc: 'Logged progress 3 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 3,
  },
  {
    id: 'streak_7', tier: 'common',
    label: 'Week Warrior', desc: 'Logged progress 7 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 7,
  },
  {
    id: 'streak_14', tier: 'rare',
    label: 'Two Week Grind', desc: 'Logged progress 14 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 14,
  },
  {
    id: 'streak_30', tier: 'rare',
    label: 'Monthly Grind', desc: 'Logged progress 30 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 30,
  },
  {
    id: 'streak_60', tier: 'epic',
    label: 'Iron Will', desc: 'Logged progress 60 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 60,
  },
  {
    id: 'streak_100', tier: 'epic',
    label: 'Centurion', desc: 'Logged progress 100 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 100,
  },
  {
    id: 'streak_365', tier: 'legendary',
    label: 'Year of Discipline', desc: 'Logged progress 365 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 365,
  },

  // ── XP ACHIEVEMENTS (5) ───────────────────────────────────────────────────
  {
    id: 'xp_100', tier: 'common',
    label: 'XP Earner', desc: 'Earned 100 XP',
    icon: 'zap',
    condition: (_, xp) => xp >= 100,
  },
  {
    id: 'xp_500', tier: 'common',
    label: 'XP Grinder', desc: 'Earned 500 XP',
    icon: 'zap',
    condition: (_, xp) => xp >= 500,
  },
  {
    id: 'xp_1000', tier: 'rare',
    label: 'Power User', desc: 'Earned 1,000 XP',
    icon: 'zap',
    condition: (_, xp) => xp >= 1000,
  },
  {
    id: 'xp_5000', tier: 'epic',
    label: 'XP Lord', desc: 'Earned 5,000 XP',
    icon: 'zap',
    condition: (_, xp) => xp >= 5000,
  },
  {
    id: 'xp_10000', tier: 'legendary',
    label: 'Transcendent', desc: 'Earned 10,000 XP',
    icon: 'zap',
    condition: (_, xp) => xp >= 10000,
  },

  // ── LEVEL ACHIEVEMENTS (5) ────────────────────────────────────────────────
  {
    id: 'level_2', tier: 'common',
    label: 'Rising Up', desc: 'Reached Level 2',
    icon: 'star',
    condition: (_, xp) => getLevelInfo(xp).level >= 2,
  },
  {
    id: 'level_5', tier: 'common',
    label: 'Level Up', desc: 'Reached Level 5',
    icon: 'star',
    condition: (_, xp) => getLevelInfo(xp).level >= 5,
  },
  {
    id: 'level_10', tier: 'rare',
    label: 'Double Digits', desc: 'Reached Level 10',
    icon: 'star',
    condition: (_, xp) => getLevelInfo(xp).level >= 10,
  },
  {
    id: 'level_20', tier: 'epic',
    label: 'Veteran', desc: 'Reached Level 20',
    icon: 'star',
    condition: (_, xp) => getLevelInfo(xp).level >= 20,
  },
  {
    id: 'level_50', tier: 'legendary',
    label: 'Ascended', desc: 'Reached Level 50',
    icon: 'star',
    condition: (_, xp) => getLevelInfo(xp).level >= 50,
  },

  // ── LOG ACHIEVEMENTS (5) ──────────────────────────────────────────────────
  {
    id: 'first_log', tier: 'common',
    label: 'In Motion', desc: 'Logged your first entry',
    icon: 'pencil',
    condition: (goals) => totalLogs(goals) >= 1,
  },
  {
    id: 'ten_logs', tier: 'common',
    label: 'Consistent', desc: 'Logged 10 entries total',
    icon: 'pencil',
    condition: (goals) => totalLogs(goals) >= 10,
  },
  {
    id: 'fifty_logs', tier: 'rare',
    label: 'Dedicated', desc: 'Logged 50 entries total',
    icon: 'pencil',
    condition: (goals) => totalLogs(goals) >= 50,
  },
  {
    id: 'hundred_logs', tier: 'epic',
    label: 'Obsessed', desc: 'Logged 100 entries total',
    icon: 'pencil',
    condition: (goals) => totalLogs(goals) >= 100,
  },
  {
    id: 'fivehundred_logs', tier: 'legendary',
    label: 'Chronicler', desc: 'Logged 500 entries total',
    icon: 'pencil',
    condition: (goals) => totalLogs(goals) >= 500,
  },

  // ── CATEGORY ACHIEVEMENTS (7) ─────────────────────────────────────────────
  {
    id: 'cat_learning', tier: 'common',
    label: 'Scholar', desc: 'Completed a Learning goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Learning' && g.progress >= 100),
  },
  {
    id: 'cat_finance', tier: 'common',
    label: 'Money Maker', desc: 'Completed a Finance goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Finance' && g.progress >= 100),
  },
  {
    id: 'cat_fitness', tier: 'common',
    label: 'Athlete', desc: 'Completed a Fitness goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Fitness' && g.progress >= 100),
  },
  {
    id: 'cat_health', tier: 'common',
    label: 'Healthy', desc: 'Completed a Health goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Health' && g.progress >= 100),
  },
  {
    id: 'cat_travel', tier: 'common',
    label: 'Wanderer', desc: 'Completed a Travel goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Travel' && g.progress >= 100),
  },
  {
    id: 'three_cats', tier: 'rare',
    label: 'Well-Rounded', desc: 'Have goals in 3+ categories',
    icon: 'globe',
    condition: (goals) => activeCategories(goals).size >= 3,
  },
  {
    id: 'all_cats', tier: 'epic',
    label: 'Renaissance', desc: 'Have goals in every category',
    icon: 'globe',
    condition: (goals) => activeCategories(goals).size >= 7,
  },

  // ── MASTERY ACHIEVEMENTS (6) ──────────────────────────────────────────────
  {
    id: 'halfway', tier: 'common',
    label: 'Halfway There', desc: 'A goal reached 50%',
    icon: 'zap',
    condition: (goals) => goals.some(g => (g.progress || 0) >= 50),
  },
  {
    id: 'three_done', tier: 'rare',
    label: 'Hat Trick', desc: 'Completed 3 goals',
    icon: 'trophy',
    condition: (goals) => completedCount(goals) >= 3,
  },
  {
    id: 'cat_sweep', tier: 'epic',
    label: 'Category Sweep', desc: 'Completed goals in every category',
    icon: 'trophy',
    condition: (goals) => completedCategories(goals).size >= 7,
  },
  {
    id: 'cat_ninety', tier: 'rare',
    label: 'Almost There', desc: 'Reached 90% avg in any category',
    icon: 'trophy',
    condition: (goals) => ['Finance','Fitness','Learning','Health','Career','Travel','Personal','Custom']
      .some(cat => avgCategoryProgress(goals, cat) >= 90),
  },
  {
    id: 'cat_hundred', tier: 'epic',
    label: 'Category Master', desc: 'Reached 100% avg completion in a category',
    icon: 'trophy',
    condition: (goals) => ['Finance','Fitness','Learning','Health','Career','Travel','Personal','Custom']
      .some(cat => {
        const cats = goals.filter(g => g.category === cat)
        return cats.length >= 2 && cats.every(g => g.progress >= 100)
      }),
  },
  {
    id: 'perfect_run', tier: 'legendary',
    label: 'Perfect Run', desc: 'Completed 10 goals with no deletions',
    icon: 'trophy',
    condition: (goals) => completedCount(goals) >= 10,
  },

  // ── CONSISTENCY ACHIEVEMENTS (5) ──────────────────────────────────────────
  {
    id: 'log_7days', tier: 'common',
    label: 'Week Logged', desc: 'Logged progress 7 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 7,
  },
  {
    id: 'log_30days', tier: 'rare',
    label: 'Monthly Logger', desc: 'Logged progress 30 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 30,
  },
  {
    id: 'log_100days', tier: 'epic',
    label: '100 Day Club', desc: 'Logged progress 100 days in a row',
    icon: 'flame',
    condition: (goals) => longestStreak(goals) >= 100,
  },
  {
    id: 'ten_goals_created', tier: 'rare',
    label: 'Dreamer', desc: 'Created 10 goals',
    icon: 'target',
    condition: (goals) => goals.length >= 10,
  },
  {
    id: 'twenty_goals_created', tier: 'epic',
    label: 'Vision Board', desc: 'Created 20 goals',
    icon: 'target',
    condition: (goals) => goals.length >= 20,
  },

  // ── PROGRESS ACHIEVEMENTS (4) ─────────────────────────────────────────────
  {
    id: 'progress_25', tier: 'common',
    label: 'Quarter Way', desc: 'A goal reached 25%',
    icon: 'zap',
    condition: (goals) => goals.some(g => (g.progress || 0) >= 25),
  },
  {
    id: 'progress_75', tier: 'common',
    label: 'Almost Done', desc: 'A goal reached 75%',
    icon: 'zap',
    condition: (goals) => goals.some(g => (g.progress || 0) >= 75),
  },
  {
    id: 'all_active_halfway', tier: 'rare',
    label: 'All In', desc: 'All active goals above 50%',
    icon: 'zap',
    condition: (goals) => {
      const active = goals.filter(g => g.progress < 100)
      return active.length >= 2 && active.every(g => (g.progress || 0) >= 50)
    },
  },
  {
    id: 'speed_complete', tier: 'epic',
    label: 'Speed Runner', desc: 'Completed a goal within 7 days of creating it',
    icon: 'rocket',
    condition: (goals) => goals.some(g => {
      if (g.progress < 100 || !g.createdAt) return false
      const created = g.createdAt?.toDate ? g.createdAt.toDate() : new Date(g.createdAt)
      const lastLog = (g.logs || []).slice(-1)[0]
      if (!lastLog) return false
      const completed = new Date(lastLog.date)
      return (completed - created) / 86400000 <= 7
    }),
  },

  // ── EXPLORER ACHIEVEMENTS (4) ─────────────────────────────────────────────
  {
    id: 'first_finance', tier: 'common',
    label: 'Money Conscious', desc: 'Created a Finance goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Finance'),
  },
  {
    id: 'first_fitness', tier: 'common',
    label: 'Get Moving', desc: 'Created a Fitness goal',
    icon: 'globe',
    condition: (goals) => goals.some(g => g.category === 'Fitness'),
  },
  {
    id: 'five_cats', tier: 'rare',
    label: 'Diversified', desc: 'Have goals in 5 different categories',
    icon: 'globe',
    condition: (goals) => activeCategories(goals).size >= 5,
  },
  {
    id: 'complete_five_cats', tier: 'legendary',
    label: 'Polymath', desc: 'Completed goals in 5 different categories',
    icon: 'trophy',
    condition: (goals) => completedCategories(goals).size >= 5,
  },

  // ── HIDDEN ACHIEVEMENTS (8) ───────────────────────────────────────────────
  {
    id: 'hidden_1111', tier: 'hidden',
    label: '11:11', desc: '🔒 Secret achievement',
    revealedDesc: 'Logged an entry at 11:11 PM',
    icon: 'star',
    condition: (goals) => hasElevenElevenLog(goals),
  },
  {
    id: 'hidden_triple', tier: 'hidden',
    label: 'Triple Threat', desc: '🔒 Secret achievement',
    revealedDesc: 'Completed 3 goals in a single day',
    icon: 'rocket',
    condition: (goals) => maxGoalsInOneDay(goals) >= 3,
  },
  {
    id: 'hidden_xpweek', tier: 'hidden',
    label: 'Weekly Grinder', desc: '🔒 Secret achievement',
    revealedDesc: 'Earned 1,000 XP in a single week',
    icon: 'zap',
    condition: (goals) => xpLastWeek(goals) >= 1000,
  },
  {
    id: 'hidden_night_owl', tier: 'hidden',
    label: 'Night Owl', desc: '🔒 Secret achievement',
    revealedDesc: 'Logged an entry after midnight',
    icon: 'star',
    condition: (goals) => goals.some(g =>
      (g.logs || []).some(l => new Date(l.date).getHours() < 4)
    ),
  },
  {
    id: 'hidden_early_bird', tier: 'hidden',
    label: 'Early Bird', desc: '🔒 Secret achievement',
    revealedDesc: 'Logged an entry before 6 AM',
    icon: 'star',
    condition: (goals) => goals.some(g =>
      (g.logs || []).some(l => {
        const h = new Date(l.date).getHours()
        return h >= 4 && h < 6
      })
    ),
  },
  {
    id: 'hidden_comeback', tier: 'hidden',
    label: 'Comeback Kid', desc: '🔒 Secret achievement',
    revealedDesc: 'Resumed logging after a 14-day gap',
    icon: 'flame',
    condition: (goals) => {
      const allDates = []
      for (const g of goals) {
        for (const log of (g.logs || [])) {
          allDates.push(new Date(log.date).toISOString().split('T')[0])
        }
      }
      const sorted = [...new Set(allDates)].sort()
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
        if (diff >= 14) return true
      }
      return false
    },
  },
  {
    id: 'hidden_all_same_day', tier: 'hidden',
    label: 'Blitz Day', desc: '🔒 Secret achievement',
    revealedDesc: 'Logged entries for 5 different goals on the same day',
    icon: 'rocket',
    condition: (goals) => {
      const byDay = {}
      for (const g of goals) {
        for (const log of (g.logs || [])) {
          const day = new Date(log.date).toISOString().split('T')[0]
          if (!byDay[day]) byDay[day] = new Set()
          byDay[day].add(g.id)
        }
      }
      return Object.values(byDay).some(s => s.size >= 5)
    },
  },
  {
    id: 'hidden_overachiever', tier: 'hidden',
    label: 'Overachiever', desc: '🔒 Secret achievement',
    revealedDesc: 'Had 10 goals active at the same time',
    icon: 'trophy',
    condition: (goals) => goals.filter(g => g.progress < 100).length >= 10,
  },
]

export function getUnlockedAchievements(goals, xp) {
  return ACHIEVEMENTS.filter(a => a.condition(goals, xp))
}
