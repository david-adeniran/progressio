import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { calcTotalXP, getLevelInfo, ACHIEVEMENTS, LEVELS } from '../lib/xp'
import { X, Flame, Zap, Trophy, TrendingUp, Target, BarChart2 } from 'lucide-react'
import styles from './StatsPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}
const TIER_COLORS = { legendary: '#f0a844', epic: '#7c6af7', rare: '#4ab8f5', common: '#7c7c8e', hidden: '#f25a95' }
const TIME_FILTERS = ['Week', 'Month', 'Year', 'All Time']

// ─── Time filter helpers ──────────────────────────────────────────────────────
function getCutoff(filter) {
  const now = new Date()
  if (filter === 'Week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d }
  if (filter === 'Month') { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d }
  if (filter === 'Year') { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d }
  return null
}
function filterLogs(goals, cutoff) {
  if (!cutoff) return goals
  return goals.map(g => ({
    ...g,
    logs: (g.logs || []).filter(l => new Date(l.date) >= cutoff)
  }))
}
function getMonthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
}
function weekLabel(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function getLast12Months() {
  const months = [], now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}
// Week: Monday to Saturday (7 days)
function getWeekDays() {
  const days = []
  const now = new Date()
  // Find last Monday
  const dayOfWeek = now.getDay() // 0=Sun,1=Mon,...6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  for (let i = 0; i < 7; i++) { // Mon to Sat
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}
// Month: weekly intervals (Jan 7, Jan 14, Jan 21, Jan 28)
function getMonthWeekIntervals() {
  const intervals = []
  const now = new Date()
  // Go back 4 weeks and show 7-day intervals
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i * 7)
    intervals.push(d.toISOString().split('T')[0])
  }
  return intervals
}
// Year: months of the year (Jan to Dec of current year)
function getYearMonths() {
  const months = []
  const year = new Date().getFullYear()
  for (let m = 0; m < 12; m++) {
    months.push(`${year}-${String(m + 1).padStart(2, '0')}`)
  }
  return months
}
// All Time: 2025 and 2026
function getAllTimeYears() {
  return ['2025', '2026']
}

// ─── Streak calculator (from log dates across all goals) ─────────────────────
function calcStreak(goals) {
  const allDates = new Set()
  for (const g of goals) for (const l of (g.logs || [])) allDates.add(new Date(l.date).toISOString().split('T')[0])
  const sorted = [...allDates].sort()
  if (!sorted.length) return { current: 0, best: 0 }
  let best = 1, cur = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
    if (diff === 1) { cur++; best = Math.max(best, cur) } else cur = 1
  }
  // current streak — check if last log was today or yesterday
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const last = sorted[sorted.length - 1]
  let current = 0
  if (last === today || last === yesterday) {
    current = 1
    for (let i = sorted.length - 2; i >= 0; i--) {
      const diff = (new Date(sorted[i+1]) - new Date(sorted[i])) / 86400000
      if (diff === 1) {current++} else {break}
    }
  }
  return { current, best }
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChart({ data, color = '#7c6af7', label = '' }) {
  if (!data || data.length < 2) return <div className={styles.noData}>Not enough data yet</div>
  const W = 560, H = 180, pad = { top: 20, right: 20, bottom: 30, left: 50 }
  const vals = data.map(d => d.value)
  const maxVal = Math.max(...vals, 1)
  const xStep = (W - pad.left - pad.right) / (data.length - 1)
  const points = data.map((d, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + (1 - d.value / maxVal) * (H - pad.top - pad.bottom), ...d
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length-1].x} ${H-pad.bottom} L ${pad.left} ${H-pad.bottom} Z`
  const yTicks = [0, Math.round(maxVal*0.5), maxVal]
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 260 }}>
        <defs>
          <linearGradient id={`ag-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => {
          const y = pad.top + (1 - t/maxVal) * (H - pad.top - pad.bottom)
          return <g key={i}>
            <line x1={pad.left} y1={y} x2={W-pad.right} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={pad.left-6} y={y+4} textAnchor="end" fill="var(--text-dim)" fontSize="9">{t.toLocaleString()}</text>
          </g>
        })}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={H-4} textAnchor="middle" fill="var(--text-dim)" fontSize="9">{p.label}</text>
        ))}
        <path d={areaD} fill={`url(#ag-${label})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
          const barH = (d.value / maxVal) * (H - pad.top - pad.bottom)
          const x = pad.left + i * xStep + (xStep - barW) / 2
          const y = H - pad.bottom - barH
          return <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} rx="4" fill={`${color}99`}>
              <title>{d.label}: {d.value}</title>
            </rect>
            <text x={x+barW/2} y={H-6} textAnchor="middle" fill="var(--text-dim)" fontSize="8">{d.label}</text>
          </g>
        })}
        <line x1={pad.left} y1={H-pad.bottom} x2={W-pad.right} y2={H-pad.bottom} stroke="var(--border)" strokeWidth="1" />
      </svg>
    </div>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ goals }) {
  const cats = Object.keys(CATEGORY_COLORS).map(cat => ({
    cat, count: goals.filter(g => g.category === cat).length, color: CATEGORY_COLORS[cat]
  })).filter(c => c.count > 0)
  const total = cats.reduce((s, c) => s + c.count, 0)
  if (!total) return <p className={styles.noData}>No goals yet</p>
  let cum = 0
  const r = 44, inner = 26, cx = 55, cy = 55
  const segments = cats.map(c => {
    const angle = (c.count / total) * 360
    const start = cum; cum += angle
    const s = (start - 90) * Math.PI / 180, e = (start + angle - 90) * Math.PI / 180
    const large = angle > 180 ? 1 : 0
    return { ...c, d: `M ${cx+r*Math.cos(s)} ${cy+r*Math.sin(s)} A ${r} ${r} 0 ${large} 1 ${cx+r*Math.cos(e)} ${cy+r*Math.sin(e)} L ${cx+inner*Math.cos(e)} ${cy+inner*Math.sin(e)} A ${inner} ${inner} 0 ${large} 0 ${cx+inner*Math.cos(s)} ${cy+inner*Math.sin(s)} Z` }
  })
  return (
    <div className={styles.donutWrap}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flexShrink: 0 }}>
        {segments.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity="0.9" />)}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="12" fontWeight="800">{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" dominantBaseline="middle" fill="var(--text-dim)" fontSize="7">goals</text>
      </svg>
      <div className={styles.donutLegend}>
        {cats.map(c => (
          <div key={c.cat} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: c.color }} />
            <span className={styles.legendLabel}>{c.cat}</span>
            <span className={styles.legendCount}>{Math.round((c.count/total)*100)}%</span>
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
    const today = new Date(), result = []
    for (let w = 14; w >= 0; w--) {
      const week = []
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today); date.setDate(date.getDate() - (w * 7 + d))
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
              return <div key={key} className={styles.activityDay} title={count > 0 ? `${key}: ${count} log${count !== 1 ? 's' : ''}` : key}
                style={{ background: count === 0 ? 'var(--surface-2)' : `rgba(62,207,142,${0.2 + intensity * 0.18})`, borderColor: count > 0 ? 'rgba(62,207,142,0.35)' : 'transparent' }} />
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
  const { current, best } = calcStreak(goals)
  const milestones = [
    { val: 0,  label: '0d',  color: 'var(--text-dim)' },
    { val: 7,  label: '7d',  color: '#f0a844' },
    { val: 14, label: '14d', color: '#4ab8f5' },
    { val: 21, label: '21d', color: '#3ecf8e' },
    { val: 28, label: '28d', color: '#b8a0f7' },
  ]
  const cap = 28
  // Build streak history — last 30 days with a dot per day
  const today = new Date()
  const logDates = new Set()
  goals.forEach(g => (g.logs || []).forEach(l => logDates.add(new Date(l.date).toISOString().split('T')[0])))
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (29 - i))
    const key = d.toISOString().split('T')[0]
    return { key, logged: logDates.has(key) }
  })

  return (
    <div className={styles.streakTimeline}>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
        <div>
          <div className={styles.streakNum} style={{ fontSize: '2rem' }}>{current}</div>
          <div className={styles.streakUnit}>current streak</div>
        </div>
        <div>
          <div className={styles.streakNum} style={{ fontSize: '2rem', color: '#4ab8f5' }}>{best}</div>
          <div className={styles.streakUnit}>best streak</div>
        </div>
      </div>
      {/* Last 30 days dots */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {last30.map(({ key, logged }) => (
          <div key={key} title={key}
            style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: logged ? '#f0a844' : 'var(--surface-3)',
              border: `1px solid ${logged ? 'rgba(240,168,68,0.4)' : 'transparent'}` }} />
        ))}
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>Last 30 days</div>
      {/* Milestone bar */}
      <div style={{ position: 'relative', height: 44, marginBottom: 8 }}>
        {/* Track line */}
        <div style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 4, background: 'var(--border)', borderRadius: 99 }} />
        {/* Progress fill */}
        <div style={{ position: 'absolute', top: 10, left: 0, height: 4, width: `${Math.min(100, (current / cap) * 100)}%`, background: 'linear-gradient(90deg, #f0a844, #4ab8f5)', borderRadius: 99, transition: 'width 0.6s ease' }} />
        {/* Milestone dots */}
        {milestones.map(m => {
          const pct = Math.min(100, (m.val / cap) * 100)
          const reached = current >= m.val
          const clampedTransform = pct >= 95 ? 'translateX(-90%)' : pct <= 5 ? 'translateX(-10%)' : 'translateX(-50%)'
          return (
            <div key={m.val} style={{ position: 'absolute', left: `${pct}%`, transform: clampedTransform, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: reached ? m.color : 'var(--surface-3)', border: `2px solid ${reached ? m.color : 'var(--border)'}`, boxShadow: reached ? `0 0 8px ${m.color}88` : 'none', transition: 'all 0.3s', marginTop: 3 }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: reached ? m.color : 'var(--text-dim)', whiteSpace: 'nowrap', marginTop: 2 }}>{m.label}</span>
            </div>
          )
        })}
      </div>
      {current === 0 && <p className={styles.noData} style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Log today to start your streak</p>}
    </div>
  )
}

// ─── Goal Table ───────────────────────────────────────────────────────────────
function GoalTable({ goals }) {
  if (!goals.length) return <p className={styles.noData}>No goals yet</p>
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Goal</th><th>Progress</th><th>Logs</th><th>Status</th><th>Category</th>
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
                    <div className={styles.tableBarTrack}><div className={styles.tableBarFill} style={{ width: `${pct}%`, background: color }} /></div>
                    <span style={{ color, fontSize: '0.7rem', fontWeight: 700, width: 30, flexShrink: 0 }}>{pct}%</span>
                  </div>
                </td>
                <td className={styles.tdCenter}>{(g.logs || []).length}</td>
                <td>
                  <span className={styles.statusBadge} style={{ background: isComplete ? 'rgba(62,207,142,0.12)' : 'rgba(124,106,247,0.12)', color: isComplete ? '#3ecf8e' : '#a89cfa', border: `1px solid ${isComplete ? 'rgba(62,207,142,0.25)' : 'rgba(124,106,247,0.25)'}` }}>
                    {isComplete ? 'Completed' : 'Active'}
                  </span>
                </td>
                <td><span className={styles.catBadge} style={{ color, background: color+'18', border: `1px solid ${color}33` }}>{g.category}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Levels Modal ─────────────────────────────────────────────────────────────
function LevelsModal({ onClose, totalXP, levelInfo }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem', maxWidth: 480, width: '90%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>All Levels</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEVELS.map((lv, i) => {
            const next = LEVELS[i + 1]
            const isCurrentLevel = levelInfo.level === lv.level
            const isDone = totalXP >= lv.xpRequired
            const pct = next ? Math.min(100, Math.round(((totalXP - lv.xpRequired) / (next.xpRequired - lv.xpRequired)) * 100)) : 100
            return (
              <div key={lv.level} style={{ background: isCurrentLevel ? 'var(--accent-dim)' : 'var(--surface-2)', border: `1px solid ${isCurrentLevel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: '0.75rem 1rem', opacity: isDone ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isCurrentLevel ? 6 : 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: isCurrentLevel ? 'var(--accent)' : isDone ? 'var(--text)' : 'var(--text-dim)', fontSize: '0.9rem' }}>Lv.{lv.level}</span>
                    <span style={{ fontSize: '0.78rem', color: isCurrentLevel ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isCurrentLevel ? 700 : 400 }}>{lv.title}</span>
                    {isCurrentLevel && <span style={{ fontSize: '0.6rem', background: 'var(--accent)', color: '#fff', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>CURRENT</span>}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{lv.xpRequired.toLocaleString()} XP</span>
                </div>
                {isCurrentLevel && (
                  <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { user } = useAuth()
  const { goals, getUnlockedAchievements, achievementXP } = useGoals(user?.uid)
  const navigate = useNavigate()
  const [timeFilter, setTimeFilter] = useState('All Time')
  const [showLevels, setShowLevels] = useState(false)

  const totalXP = calcTotalXP(goals, achievementXP)
  const levelInfo = getLevelInfo(totalXP)

  // Filter goals/logs by time
  const cutoff = useMemo(() => getCutoff(timeFilter), [timeFilter])
  const filteredGoals = useMemo(() => filterLogs(goals, cutoff), [goals, cutoff])

  // Metrics — all derived from filteredGoals
  const totalLogs = filteredGoals.reduce((s, g) => s + (g.logs || []).length, 0)
  const completed = goals.filter(g => g.progress >= 100).length // completions are all-time
  const avgProgress = goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0
  const { current: currentStreak, best: bestStreak } = useMemo(() => calcStreak(filteredGoals), [filteredGoals])
  const completionRate = goals.length ? Math.round((completed / goals.length) * 100) : 0

  // XP in this period
  const periodXP = filteredGoals.reduce((s, g) => s + (g.logs || []).reduce((ls, l) => ls + (l.xpEarned || 0), 0), 0)

  // XP growth chart — adapts to time filter
  const xpGrowthData = useMemo(() => {
    if (timeFilter === 'Week') {
      const days = getWeekDays()
      const xpByDay = {}
      filteredGoals.forEach(g => (g.logs || []).forEach(l => {
        const d = new Date(l.date).toISOString().split('T')[0]
        xpByDay[d] = (xpByDay[d] || 0) + (l.xpEarned || 10)
      }))
      let cum = 0
      return days.map(d => {
        cum += (xpByDay[d] || 0)
        return { label: new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }), value: cum }
      })
    }
    if (timeFilter === 'Month') {
      const intervals = getMonthWeekIntervals()
      const xpByDay = {}
      filteredGoals.forEach(g => (g.logs || []).forEach(l => {
        const d = new Date(l.date).toISOString().split('T')[0]
        xpByDay[d] = (xpByDay[d] || 0) + (l.xpEarned || 10)
      }))
      return intervals.map(d => {
        // sum XP for the 7 days ending on this date
        let total = 0
        for (let i = 0; i < 7; i++) {
          const day = new Date(d); day.setDate(day.getDate() - i)
          total += xpByDay[day.toISOString().split('T')[0]] || 0
        }
        return { label: new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: total }
      })
    }
    if (timeFilter === 'Year') {
      const months = getYearMonths()
      const xpByMonth = {}
      filteredGoals.forEach(g => (g.logs || []).forEach(l => {
        const mk = getMonthKey(l.date)
        xpByMonth[mk] = (xpByMonth[mk] || 0) + (l.xpEarned || 10)
      }))
      let cum = 0
      return months.map(mk => {
        cum += (xpByMonth[mk] || 0)
        return { label: new Date(parseInt(mk.split('-')[0]), parseInt(mk.split('-')[1]) - 1, 1).toLocaleDateString('en-GB', { month: 'short' }), value: cum }
      })
    }
    // All Time: by year (2025, 2026, 2027)
    const years = ['2025', '2026', '2027']
    const xpByYear = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const yr = new Date(l.date).getFullYear().toString()
      xpByYear[yr] = (xpByYear[yr] || 0) + (l.xpEarned || 10)
    }))
    let cum = 0
    return years.map(yr => {
      cum += (xpByYear[yr] || 0)
      return { label: yr, value: cum }
    })
  }, [filteredGoals, timeFilter])

  // Completion trend
  const completionTrendData = useMemo(() => {
    if (timeFilter === 'Week') {
      const days = getWeekDays()
      const byDay = {}
      goals.filter(g => g.progress >= 100).forEach(g => {
        const last = (g.logs || []).slice(-1)[0]
        if (last) { const d = new Date(last.date).toISOString().split('T')[0]; byDay[d] = (byDay[d] || 0) + 1 }
      })
      return days.map(d => ({ label: new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }), value: byDay[d] || 0 }))
    }
    if (timeFilter === 'Month') {
      const intervals = getMonthWeekIntervals()
      const byDay = {}
      goals.filter(g => g.progress >= 100).forEach(g => {
        const last = (g.logs || []).slice(-1)[0]
        if (last) { const d = new Date(last.date).toISOString().split('T')[0]; byDay[d] = (byDay[d] || 0) + 1 }
      })
      return intervals.map(d => ({ label: new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: byDay[d] || 0 }))
    }
    if (timeFilter === 'Year') {
      const months = getYearMonths()
      const byMonth = {}
      goals.filter(g => g.progress >= 100).forEach(g => {
        const last = (g.logs || []).slice(-1)[0]
        if (last) { const mk = getMonthKey(last.date); byMonth[mk] = (byMonth[mk] || 0) + 1 }
      })
      return months.map(mk => ({ label: new Date(parseInt(mk.split('-')[0]), parseInt(mk.split('-')[1]) - 1, 1).toLocaleDateString('en-GB', { month: 'short' }), value: byMonth[mk] || 0 }))
    }
    // All Time: by year
    const years = getAllTimeYears()
    const byYear = {}
    goals.filter(g => g.progress >= 100).forEach(g => {
      const last = (g.logs || []).slice(-1)[0]
      if (last) { const yr = new Date(last.date).getFullYear().toString(); byYear[yr] = (byYear[yr] || 0) + 1 }
    })
    return years.map(yr => ({ label: yr, value: byYear[yr] || 0 }))
  }, [goals, timeFilter])

  // Insights
  const insights = useMemo(() => {
    const cats = Object.keys(CATEGORY_COLORS).map(cat => {
      const catGoals = goals.filter(g => g.category === cat)
      const avg = catGoals.length ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length) : 0
      return { cat, avg, count: catGoals.length }
    }).filter(c => c.count > 0)
    const best = [...cats].sort((a, b) => b.avg - a.avg)[0]
    const needsAttn = [...cats].sort((a, b) => a.avg - b.avg).find(c => c.avg < 80)
    const weekLogs = {}
    filteredGoals.forEach(g => (g.logs || []).forEach(l => {
      const d = new Date(l.date), wk = `${d.getFullYear()}-W${Math.ceil(d.getDate()/7)}-${d.toLocaleDateString('en-GB', { month: 'short' })}`
      weekLogs[wk] = (weekLogs[wk] || 0) + 1
    }))
    const consistentWeek = Object.entries(weekLogs).sort(([, a], [, b]) => b - a)[0]
    const monthXP = {}
    filteredGoals.forEach(g => (g.logs || []).forEach(l => {
      const mk = getMonthKey(l.date); monthXP[mk] = (monthXP[mk] || 0) + (l.xpEarned || 10)
    }))
    const biggestMonth = Object.entries(monthXP).sort(([, a], [, b]) => b - a)[0]
    return { best, needsAttn, consistentWeek, biggestMonth }
  }, [goals, filteredGoals])

  // Achievement rarity
  const unlockedSet = getUnlockedAchievements()
  const unlocked = ACHIEVEMENTS.filter(a => unlockedSet.has(a.id))
  const rarityData = useMemo(() => {
    return ['common', 'rare', 'epic', 'legendary', 'hidden'].map(tier => ({
      label: tier.charAt(0).toUpperCase() + tier.slice(1),
      color: TIER_COLORS[tier],
      count: unlocked.filter(a => a.tier === tier).length,
      total: ACHIEVEMENTS.filter(a => a.tier === tier).length,
    }))
  }, [unlocked])

  const periodLabel = timeFilter === 'All Time' ? 'all time' : `this ${timeFilter.toLowerCase()}`

  return (
    <div className={styles.page}>
      {showLevels && <LevelsModal onClose={() => setShowLevels(false)} totalXP={totalXP} levelInfo={levelInfo} />}

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

      {/* Metrics */}
      <div className={styles.metricsRow}>
        {[
          { label: 'Total XP', value: totalXP.toLocaleString(), color: 'var(--gold)', sub: `+${periodXP} XP ${periodLabel}`, icon: <Zap size={18} color='var(--gold)' />, onClick: () => setShowLevels(true) },
          { label: 'Goals Completed', value: completed, color: 'var(--success)', sub: `${completionRate}% completion rate`, icon: <Trophy size={18} color='var(--success)' />, onClick: () => navigate('/goals?filter=completed') },
          { label: 'Current Streak', value: `${currentStreak}d`, color: '#f0a844', sub: `Best: ${bestStreak} days`, icon: <Flame size={18} color='#f0a844' />, onClick: null },
          { label: 'Completion Rate', value: `${completionRate}%`, color: 'var(--blue)', sub: `${goals.length} total goals`, icon: <TrendingUp size={18} color='var(--blue)' />, onClick: null },
          { label: 'Level', value: `Lv.${levelInfo.level}`, color: 'var(--accent)', sub: levelInfo.title, icon: <Target size={18} color='var(--accent)' />, onClick: () => setShowLevels(true) },
        ].map(m => (
          <div key={m.label} className={styles.metricCard} onClick={m.onClick || undefined} style={{ cursor: m.onClick ? 'pointer' : 'default' }}>
            <div className={styles.metricIcon} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: 8 }}>{m.icon}</div>
            <div className={styles.metricLabel}>{m.label}</div>
            <div className={styles.metricVal} style={{ color: m.color }}>{m.value}</div>
            <div className={styles.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>XP Growth — {timeFilter}</h3>
              <span className={styles.chartBadge} style={{ color: 'var(--success)' }}>+{periodXP} XP</span>
            </div>
            <LineChart data={xpGrowthData} color="#7c6af7" label="xp" />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.chartCard}>
              <div className={styles.chartHead}><h3 className={styles.chartTitle}>Goal Completion Trend</h3></div>
              <BarChart data={completionTrendData} color="#7c6af7" />
            </div>
            <div className={styles.chartCard}>
              <div className={styles.chartHead}><h3 className={styles.chartTitle}>Goals by Category</h3></div>
              <DonutChart goals={goals} />
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Daily Activity — Last 15 Weeks</h3>
            </div>
            <ActivityGrid goals={goals} />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHead}>
              <h3 className={styles.chartTitle}>Goal Breakdown</h3>
              <span className={styles.chartBadge}>{goals.length} goals</span>
            </div>
            <GoalTable goals={goals} />
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle} style={{ marginBottom: '1rem' }}>Performance Insights</h3>
            <div className={styles.insightsGrid}>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(62,207,142,0.25)', background: 'rgba(62,207,142,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#3ecf8e' }}>Best Category</div>
                <div className={styles.insightVal}>{insights.best ? insights.best.cat : '—'}</div>
                <div className={styles.insightSub}>{insights.best ? `${insights.best.avg}% avg` : 'Add goals'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(240,168,68,0.25)', background: 'rgba(240,168,68,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#f0a844' }}>Needs Attention</div>
                <div className={styles.insightVal}>{insights.needsAttn ? insights.needsAttn.cat : '—'}</div>
                <div className={styles.insightSub}>{insights.needsAttn ? `${insights.needsAttn.avg}% avg` : 'All on track!'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(74,184,245,0.25)', background: 'rgba(74,184,245,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#4ab8f5' }}>Most Active Week</div>
                <div className={styles.insightVal}>{insights.consistentWeek ? insights.consistentWeek[0].split('-').slice(-1)[0] : '—'}</div>
                <div className={styles.insightSub}>{insights.consistentWeek ? `${insights.consistentWeek[1]} logs` : 'Start logging'}</div>
              </div>
              <div className={styles.insightCard} style={{ borderColor: 'rgba(184,160,247,0.25)', background: 'rgba(184,160,247,0.05)' }}>
                <div className={styles.insightTag} style={{ color: '#b8a0f7' }}>Biggest XP Month</div>
                <div className={styles.insightVal}>{insights.biggestMonth ? `+${insights.biggestMonth[1]} XP` : '—'}</div>
                <div className={styles.insightSub}>{insights.biggestMonth ? monthLabel(insights.biggestMonth[0]) : 'No logs yet'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.chartCard}>
            <div className={styles.chartHead}><h3 className={styles.chartTitle}>Streak Analytics</h3></div>
            <StreakTimeline goals={goals} />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHead}><h3 className={styles.chartTitle}>Achievement Analytics</h3></div>
            <div className={styles.achOverall}>
              <span className={styles.achFraction}><strong style={{ color: 'var(--gold)' }}>{unlocked.length}</strong> / {ACHIEVEMENTS.length}</span>
              <span className={styles.achLabel}>Earned</span>
            </div>
            <div className={styles.achBar}>
              <div className={styles.achBarFill} style={{ width: `${Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%` }} />
            </div>
            <div className={styles.raritySection}>
              {rarityData.map(r => (
                <div key={r.label} className={styles.rarityItem}>
                  <span className={styles.rarityLabel} style={{ color: r.color }}>{r.label}</span>
                  <div className={styles.rarityBarTrack}>
                    <div className={styles.rarityBarFill} style={{ width: `${r.total > 0 ? (r.count / r.total) * 100 : 0}%`, background: r.color }} />
                  </div>
                  <span className={styles.rarityCount}>{r.count}/{r.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard} style={{ background: 'linear-gradient(135deg, rgba(124,106,247,0.08), rgba(62,207,142,0.05))', borderColor: 'rgba(124,106,247,0.18)' }}>
            <h3 className={styles.chartTitle} style={{ marginBottom: '0.75rem' }}>Growth Summary</h3>
            <p className={styles.growthText}>
              {timeFilter === 'All Time' ? 'Overall' : `This ${timeFilter.toLowerCase()}`}, you've completed <strong style={{ color: 'var(--success)' }}>{completed} goal{completed !== 1 ? 's' : ''}</strong>, earned <strong style={{ color: 'var(--gold)' }}>{periodXP.toLocaleString()} XP</strong>, and logged <strong style={{ color: 'var(--blue)' }}>{totalLogs} entr{totalLogs !== 1 ? 'ies' : 'y'}</strong>.
              {avgProgress > 0 && <> Average progress at <strong style={{ color: 'var(--accent)' }}>{avgProgress}%</strong>.</>}
              {' '}{completed === 0 ? 'Start logging to build momentum.' : completed < 3 ? 'Keep pushing.' : 'You\'re on a serious run.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
