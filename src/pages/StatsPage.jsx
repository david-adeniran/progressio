import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { calcTotalXP, getLevelInfo, ACHIEVEMENTS, getUnlockedAchievements } from '../lib/xp'
import styles from './StatsPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}
const TIME_FILTERS = ['Week', 'Month', 'Year', 'All Time']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMonthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
function getLast12Months() {
  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChart({ data, color = '#7c6af7', label = '' }) {
  if (!data || data.length < 2) return <div className={styles.noData}>Not enough data yet</div>
  const W = 560, H = 180, pad = { top: 20, right: 20, bottom: 30, left: 50 }
  const vals = data.map(d => d.value)
  const maxVal = Math.max(...vals, 1)
  const minVal = 0
  const xStep = (W - pad.left - pad.right) / (data.length - 1)

  const points = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + (1 - (d.value - minVal) / (maxVal - minVal)) * (H - pad.top - pad.bottom),
    ...d
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${H - pad.bottom} L ${pad.left} ${H - pad.bottom} Z`

  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal]

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 300 }}>
        <defs>
          <linearGradient id={`areaGrad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((t, i) => {
          const y = pad.top + (1 - t / maxVal) * (H - pad.top - pad.bottom)
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="var(--border)" strokeWidth="1" />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="var(--text-dim)" fontSize="9">{t.toLocaleString()}</text>
            </g>
          )
        })}
        {/* X axis labels */}
        {points.filter((_, i) => i % Math.ceil(points.length / 7) === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="var(--text-dim)" fontSize="9">{p.label}</text>
        ))}
        {/* Area fill */}
        <path d={areaD} fill={`url(#areaGrad-${label})`} />
        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="2">
            <title>{p.label}: {p.value.toLocaleString()}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data, color = '#7c6af7' }) {
  if (!data || data.length === 0) return <div className={styles.noData}>No data yet</div>
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const W = 420, H = 160, barW = Math.min(28, (W - 40) / data.length - 4), pad = { top: 10, right: 10, bottom: 28, left: 30 }
  const xStep = (W - pad.left - pad.right) / data.length

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260 }}>
        {data.map((d, i) => {
          const barH = ((d.value / maxVal) * (H - pad.top - pad.bottom))
          const x = pad.left + i * xStep + (xStep - barW) / 2
          const y = H - pad.bottom - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx="4"
                fill={`${color}99`} style={{ transition: 'height 0.4s ease' }}>
                <title>{d.label}: {d.value}</title>
              </rect>
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill="var(--text-dim)" fontSize="8">{d.label}</text>
            </g>
          )
        })}
        <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function DonutChart({ goals }) {
  const cats = Object.keys(CATEGORY_COLORS).map(cat => ({
    cat, count: goals.filter(g => g.category === cat).length, color: CATEGORY_COLORS[cat]
  })).filter(c => c.count > 0)
  const total = cats.reduce((s, c) => s + c.count, 0)
  if (!total) return <p className={styles.noData}>No goals yet</p>

  let cumAngle = 0
  const radius = 44, inner = 26, cx = 55, cy = 55
  const segments = cats.map(c => {
    const angle = (c.count / total) * 360
    const start = cumAngle
    cumAngle += angle
    const startRad = (start - 90) * Math.PI / 180
    const endRad = (start + angle - 90) * Math.PI / 180
    const x1o = cx + radius * Math.cos(startRad), y1o = cy + radius * Math.sin(startRad)
    const x2o = cx + radius * Math.cos(endRad), y2o = cy + radius * Math.sin(endRad)
    const x1i = cx + inner * Math.cos(endRad), y1i = cy + inner * Math.sin(endRad)
    const x2i = cx + inner * Math.cos(startRad), y2i = cy + inner * Math.sin(startRad)
    const large = angle > 180 ? 1 : 0
    return { ...c, d: `M ${x1o} ${y1o} A ${radius} ${radius} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${inner} ${inner} 0 ${large} 0 ${x2i} ${y2i} Z` }
  })

  return (
    <div className={styles.donutWrap}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        {segments.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity="0.9" />)}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="12" fontWeight="800">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill="var(--text-dim)" fontSize="7">goals</text>
      </svg>
      <div className={styles.donutLegend}>
        {cats.map(c => (
          <div key={c.cat} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: c.color }} />
            <span className={styles.legendLabel}>{c.cat}</span>
            <span className={styles.legendCount}>{Math.round((c.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────
function ActivityGrid({ goals }) {
  const weeks = useMemo(() => {
    const logDates = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const d = new Date(l.date).toISOString().split('T')[0]
      logDates[d] = (logDates[d] || 0) + 1
    }))
    const today = new Date()
    const result = []
    for (let w = 14; w >= 0; w--) {
      const week = []
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today)
        date.setDate(date.getDate() - (w * 7 + d))
        const key = date.toISOString().split('T')[0]
        week.push({ key, count: logDates[key] || 0 })
      }
      result.push(week)
    }
    return result
  }, [goals])

  const maxCount = Math.max(1, ...weeks.flat().map(d => d.count))
  return (
    <div>
      <div className={styles.activityGrid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.activityWeek}>
            {week.map(({ key, count }) => {
              const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4)
              return (
                <div key={key} className={styles.activityDay} title={count > 0 ? `${key}: ${count} log${count !== 1 ? 's' : ''}` : key}
                  style={{
                    background: count === 0 ? 'var(--surface-2)' : `rgba(62,207,142,${0.2 + intensity * 0.18})`,
                    borderColor: count > 0 ? 'rgba(62,207,142,0.35)' : 'transparent'
                  }} />
              )
            })}
          </div>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        {[0.04, 0.36, 0.54, 0.72, 0.9].map((o, i) => (
          <div key={i} className={styles.activityDay} style={{ background: i === 0 ? 'var(--surface-2)' : `rgba(62,207,142,${o})`, borderColor: 'transparent', flexShrink: 0 }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

// ─── Streak Timeline ──────────────────────────────────────────────────────────
function StreakTimeline({ goals }) {
  const maxStreak = Math.max(0, ...goals.map(g => g.streak || 0))
  const milestones = [
    { val: 7, label: '7d', color: '#f0a844' },
    { val: 14, label: '14d', color: '#4ab8f5' },
    { val: 30, label: '30d', color: '#b8a0f7' },
    { val: 60, label: '60d', color: '#3ecf8e' },
    { val: 100, label: '100d', color: '#f0a844' },
  ]
  const cap = Math.max(maxStreak + 10, 30)
  return (
    <div className={styles.streakTimeline}>
      <div className={styles.streakCurrent}>
        <span className={styles.streakNum}>{maxStreak}</span>
        <span className={styles.streakUnit}>day streak</span>
      </div>
      <div className={styles.timelineTrack}>
        <div className={styles.timelineLine} />
        <div className={styles.timelineProgress} style={{ width: `${Math.min(100, (maxStreak / cap) * 100)}%` }} />
        {milestones.map(m => {
          const pct = Math.min(100, (m.val / cap) * 100)
          const reached = maxStreak >= m.val
          return (
            <div key={m.val} className={styles.milestoneMark} style={{ left: `${pct}%` }}>
              <div className={styles.milestoneDot} style={{ background: reached ? m.color : 'var(--border-light)', boxShadow: reached ? `0 0 8px ${m.color}88` : 'none' }} />
              <span className={styles.milestoneVal} style={{ color: reached ? m.color : 'var(--text-dim)' }}>{m.label}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.streakGoals}>
        {goals.filter(g => (g.streak || 0) > 0).slice(0, 4).map(g => (
          <div key={g.id} className={styles.streakGoalItem}>
            <div className={styles.streakGoalDot} style={{ background: CATEGORY_COLORS[g.category] || '#aaa' }} />
            <span className={styles.streakGoalName}>{g.title}</span>
            <span className={styles.streakGoalVal} style={{ color: CATEGORY_COLORS[g.category] || '#aaa' }}>🔥 {g.streak}</span>
          </div>
        ))}
        {goals.every(g => !(g.streak > 0)) && <p className={styles.noData} style={{ fontSize: '0.75rem' }}>Start logging to build a streak</p>}
      </div>
    </div>
  )
}

// ─── Goal Breakdown Table ─────────────────────────────────────────────────────
function GoalTable({ goals }) {
  if (!goals.length) return <p className={styles.noData}>No goals yet</p>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Goal</th>
            <th>Progress</th>
            <th>Logs</th>
            <th>Status</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {goals.map(g => {
            const pct = Math.min(100, Math.round(g.progress || 0))
            const color = CATEGORY_COLORS[g.category] || '#aaa'
            const isComplete = pct >= 100
            return (
              <tr key={g.id}>
                <td className={styles.tdName}>{g.title}</td>
                <td>
                  <div className={styles.tablePctRow}>
                    <div className={styles.tableBarTrack}>
                      <div className={styles.tableBarFill} style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span style={{ color, fontSize: '0.7rem', fontWeight: 700, width: 30, flexShrink: 0 }}>{pct}%</span>
                  </div>
                </td>
                <td className={styles.tdCenter}>{(g.logs || []).length}</td>
                <td>
                  <span className={styles.statusBadge} style={{
                    background: isComplete ? 'rgba(62,207,142,0.12)' : 'rgba(124,106,247,0.12)',
                    color: isComplete ? '#3ecf8e' : '#a89cfa',
                    border: `1px solid ${isComplete ? 'rgba(62,207,142,0.25)' : 'rgba(124,106,247,0.25)'}`,
                  }}>
                    {isComplete ? 'Completed' : 'Active'}
                  </span>
                </td>
                <td>
                  <span className={styles.catBadge} style={{ color, background: color + '18', border: `1px solid ${color}33` }}>{g.category}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { user } = useAuth()
  const { goals } = useGoals(user?.uid)
  const [timeFilter, setTimeFilter] = useState('All Time')

  const totalXP = calcTotalXP(goals)
  const levelInfo = getLevelInfo(totalXP)
  const totalLogs = goals.reduce((s, g) => s + (g.logs || []).length, 0)
  const completed = goals.filter(g => g.progress >= 100).length
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0
  const maxStreak = Math.max(0, ...goals.map(g => g.streak || 0))
  const unlocked = getUnlockedAchievements(goals, totalXP)
  const completionRate = goals.length ? Math.round((completed / goals.length) * 100) : 0

  // XP growth over last 12 months
  const xpGrowthData = useMemo(() => {
    const months = getLast12Months()
    const xpPerMonth = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const mk = getMonthKey(l.date)
      xpPerMonth[mk] = (xpPerMonth[mk] || 0) + 10
    }))
    let cumXP = 0
    return months.map(mk => {
      cumXP += (xpPerMonth[mk] || 0)
      return { label: monthLabel(mk), value: cumXP }
    })
  }, [goals])

  // Goal completion trend (completions per month)
  const completionTrendData = useMemo(() => {
    const months = getLast12Months()
    const completionsPerMonth = {}
    goals.forEach(g => {
      if (g.progress >= 100 && (g.logs || []).length > 0) {
        const lastLog = g.logs[g.logs.length - 1]
        if (lastLog) {
          const mk = getMonthKey(lastLog.date)
          completionsPerMonth[mk] = (completionsPerMonth[mk] || 0) + 1
        }
      }
    })
    return months.slice(-8).map(mk => ({ label: monthLabel(mk), value: completionsPerMonth[mk] || 0 }))
  }, [goals])

  // Performance insights
  const insights = useMemo(() => {
    const cats = Object.keys(CATEGORY_COLORS).map(cat => {
      const catGoals = goals.filter(g => g.category === cat)
      const avg = catGoals.length ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length) : 0
      return { cat, avg, count: catGoals.length }
    }).filter(c => c.count > 0)

    const best = cats.sort((a, b) => b.avg - a.avg)[0]
    const needsAttn = [...cats].sort((a, b) => a.avg - b.avg).find(c => c.avg < 80)

    const weekLogs = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const d = new Date(l.date)
      const wk = `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}-${d.toLocaleDateString('en-GB', { month: 'short' })}`
      weekLogs[wk] = (weekLogs[wk] || 0) + 1
    }))
    const consistentWeek = Object.entries(weekLogs).sort(([, a], [, b]) => b - a)[0]

    const monthXP = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const mk = getMonthKey(l.date)
      monthXP[mk] = (monthXP[mk] || 0) + 10
    }))
    const biggestMonth = Object.entries(monthXP).sort(([, a], [, b]) => b - a)[0]

    return { best, needsAttn, consistentWeek, biggestMonth }
  }, [goals])

  // Achievement rarity
  const rarityData = useMemo(() => {
    const total = ACHIEVEMENTS.length
    return [
      { label: 'Common', count: unlocked.filter(a => ['first_goal','first_log','halfway','ten_logs'].includes(a.id)).length, total: 4, color: '#7c7c8e' },
      { label: 'Rare', count: unlocked.filter(a => ['five_goals','goal_complete','three_cats'].includes(a.id)).length, total: 3, color: '#4ab8f5' },
      { label: 'Epic', count: unlocked.filter(a => ['three_done','level5'].includes(a.id)).length, total: 2, color: '#b8a0f7' },
    ]
  }, [unlocked])

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Statistics</h1>
          <p className={styles.sub}>Track your growth, habits, consistency, and performance over time.</p>
        </div>
        <div className={styles.timeFilters}>
          {TIME_FILTERS.map(f => (
            <button key={f} className={`${styles.timeBtn} ${timeFilter === f ? styles.timeBtnActive : ''}`} onClick={() => setTimeFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── Top Metrics ── */}
      <div className={styles.metricsRow}>
        {[
          { label: 'Total XP', value: totalXP.toLocaleString(), color: 'var(--gold)', sub: `+${Math.round(totalXP * 0.18)} this month`, icon: '⚡' },
          { label: 'Goals Completed', value: completed, color: 'var(--success)', sub: `+${Math.max(0, completed - Math.max(0, completed - 2))} this month`, icon: '🏆' },
          { label: 'Current Streak', value: `${maxStreak} Days`, color: '#f0a844', sub: `Best streak: ${maxStreak} Days`, icon: '🔥' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'var(--blue)', sub: `+5% this month`, icon: '📈' },
          { label: 'Level', value: `Level ${levelInfo.level}`, color: 'var(--accent)', sub: levelInfo.title, icon: '🎯' },
        ].map(m => (
          <div key={m.label} className={styles.metricCard}>
            <div className={styles.metricIcon}>{m.icon}</div>
            <div className={styles.metricLabel}>{m.label}</div>
            <div className={styles.metricVal} style={{ color: m.color }}>{m.value}</div>
            <div className={styles.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main two-column grid ── */}
      <div className={styles.mainGrid}>
        {/* Left column */}
        <div className={styles.leftCol}>
          {/* XP Growth */}
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>XP Growth Over Time</h3>
              <span className={styles.chartBadge} style={{ color: 'var(--success)' }}>+{Math.round(totalXP * 0.05)} XP this month</span>
            </div>
            <LineChart data={xpGrowthData} color="#7c6af7" label="xp" />
          </div>

          {/* Row: Completion trend + Donut */}
          <div className={styles.twoCol}>
            <div className={styles.chartCard}>
              <div className={styles.chartHead}>
                <h3 className={styles.chartTitle}>Goal Completion Trend</h3>
              </div>
              <BarChart data={completionTrendData} color="#7c6af7" />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartHead}>
                <h3 className={styles.chartTitle}>XP Earned By Category</h3>
              </div>
              <DonutChart goals={goals} />
            </div>
          </div>

          {/* Activity heatmap */}
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Daily Production Graph</h3>
              <div className={styles.heatmapScale}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Low XP</span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(62,207,142,0.9)' }}>XP</span>
              </div>
            </div>
            <ActivityGrid goals={goals} />
          </div>

          {/* Goal Breakdown */}
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Goal Breakdown</h3>
              <span className={styles.chartBadge}>{goals.length} goals</span>
            </div>
            <GoalTable goals={goals} />
          </div>

          {/* Performance Insights */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle} style={{ marginBottom: '1rem' }}>Performance Insights</h3>
            <div className={styles.insightsGrid}>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(62,207,142,0.25)', background: 'rgba(62,207,142,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#3ecf8e' }}>Best Performing Category</div>
                <div className={styles.insightVal}>{insights.best ? `🏆 ${insights.best.cat}` : '—'}</div>
                <div className={styles.insightSub}>{insights.best ? `${insights.best.avg}% completion` : 'Add goals to see'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(240,168,68,0.25)', background: 'rgba(240,168,68,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#f0a844' }}>Needs Attention</div>
                <div className={styles.insightVal}>{insights.needsAttn ? `💪 ${insights.needsAttn.cat}` : '—'}</div>
                <div className={styles.insightSub}>{insights.needsAttn ? `${insights.needsAttn.avg}% completion` : 'All on track!'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(74,184,245,0.25)', background: 'rgba(74,184,245,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#4ab8f5' }}>Most Consistent Period</div>
                <div className={styles.insightVal}>{insights.consistentWeek ? `📅 ${insights.consistentWeek[0].split('-').slice(-1)[0]}` : '—'}</div>
                <div className={styles.insightSub}>{insights.consistentWeek ? `${insights.consistentWeek[1]} logs` : 'Start logging'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(184,160,247,0.25)', background: 'rgba(184,160,247,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#b8a0f7' }}>Biggest XP Gain</div>
                <div className={styles.insightVal}>{insights.biggestMonth ? `⚡ +${insights.biggestMonth[1]} XP` : '—'}</div>
                <div className={styles.insightSub}>{insights.biggestMonth ? monthLabel(insights.biggestMonth[0]) : 'No logs yet'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightCol}>
          {/* Streak Analytics */}
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Streak Analytics</h3>
            </div>
            <StreakTimeline goals={goals} />
          </div>

          {/* Achievement Analytics */}
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Achievement Analytics</h3>
            </div>
            <div className={styles.achOverall}>
              <span className={styles.achFraction}><strong style={{ color: 'var(--gold)' }}>{unlocked.length}</strong> / {ACHIEVEMENTS.length}</span>
              <span className={styles.achLabel}>Achievements Earned</span>
            </div>
            <div className={styles.achBar}>
              <div className={styles.achBarFill} style={{ width: `${Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%` }} />
            </div>
            <div className={styles.raritySection}>
              <div className={styles.rarityRow}>
                <span className={styles.rarityLeft}>Rarity</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{unlocked.length} / {ACHIEVEMENTS.length}</span>
              </div>
              {rarityData.map(r => (
                <div key={r.label} className={styles.rarityItem}>
                  <span className={styles.rarityLabel} style={{ color: r.color }}>{r.label}</span>
                  <div className={styles.rarityBarTrack}>
                    <div className={styles.rarityBarFill} style={{ width: `${r.total > 0 ? (r.count / r.total) * 100 : 0}%`, background: r.color }} />
                  </div>
                  <span className={styles.rarityCount}>{r.count} / {r.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Growth Summary */}
          <div className={styles.chartCard} style={{ background: 'linear-gradient(135deg, rgba(124,106,247,0.08), rgba(62,207,142,0.05))', borderColor: 'rgba(124,106,247,0.18)' }}>
            <h3 className={styles.chartTitle} style={{ marginBottom: '0.75rem' }}>Growth Summary</h3>
            <p className={styles.growthText}>
              Over the last 90 days, you've completed <strong style={{ color: 'var(--success)' }}>{completed} goal{completed !== 1 ? 's' : ''}</strong>, earned <strong style={{ color: 'var(--gold)' }}>{totalXP.toLocaleString()} XP</strong>, and logged <strong style={{ color: 'var(--blue)' }}>{totalLogs} entr{totalLogs !== 1 ? 'ies' : 'y'}</strong> across all goals.
              {avgProgress > 0 && ` Your average progress stands at `}
              {avgProgress > 0 && <strong style={{ color: 'var(--accent)' }}>{avgProgress}%</strong>}
              {avgProgress > 0 && `.`}
              {' '}{completed === 0 ? 'Start logging entries to build momentum.' : completed < 3 ? 'Keep pushing — you\'re building real momentum.' : 'You\'re on a serious streak. Keep it going.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
