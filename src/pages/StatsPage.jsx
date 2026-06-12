import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { calcTotalXP, getLevelInfo } from '../lib/xp'
import styles from './StatsPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}

function ActivityGrid({ goals }) {
  // Build last 12 weeks of activity
  const weeks = useMemo(() => {
    const logDates = {}
    goals.forEach(g => (g.logs || []).forEach(l => {
      const d = new Date(l.date).toISOString().split('T')[0]
      logDates[d] = (logDates[d] || 0) + 1
    }))
    const today = new Date()
    const result = []
    for (let w = 11; w >= 0; w--) {
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
    <div className={styles.activityGrid}>
      {weeks.map((week, wi) => (
        <div key={wi} className={styles.activityWeek}>
          {week.map(({ key, count }) => {
            const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4)
            return (
              <div
                key={key}
                className={styles.activityDay}
                title={count > 0 ? `${key}: ${count} log${count !== 1 ? 's' : ''}` : key}
                style={{
                  background: count === 0
                    ? 'rgba(255,255,255,0.04)'
                    : `rgba(124,106,247,${0.2 + intensity * 0.18})`,
                  borderColor: count > 0 ? 'rgba(124,106,247,0.3)' : 'transparent'
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function ProgressBarChart({ goals }) {
  const sorted = [...goals].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 8)
  return (
    <div className={styles.barChart}>
      {sorted.map(g => {
        const pct = Math.min(100, Math.round(g.progress || 0))
        const color = CATEGORY_COLORS[g.category] || '#aaa'
        return (
          <div key={g.id} className={styles.barRow}>
            <div className={styles.barLabel} title={g.title}>{g.title}</div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
            </div>
            <span className={styles.barPct} style={{ color }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function CategoryDonut({ goals }) {
  const cats = Object.keys(CATEGORY_COLORS).map(cat => ({
    cat, count: goals.filter(g => g.category === cat).length, color: CATEGORY_COLORS[cat]
  })).filter(c => c.count > 0)
  const total = cats.reduce((s, c) => s + c.count, 0)
  if (!total) return <p className={styles.noData}>No goals yet</p>

  let cumAngle = 0
  const radius = 40, cx = 55, cy = 55
  const segments = cats.map(c => {
    const angle = (c.count / total) * 360
    const start = cumAngle
    cumAngle += angle
    const startRad = (start - 90) * Math.PI / 180
    const endRad = (start + angle - 90) * Math.PI / 180
    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)
    const large = angle > 180 ? 1 : 0
    return { ...c, d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z` }
  })

  return (
    <div className={styles.donutWrap}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {segments.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity="0.85" />
        ))}
        <circle cx={cx} cy={cy} r="22" fill="var(--surface)" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="var(--text)" fontSize="11" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle" fill="var(--text-muted)" fontSize="7">goals</text>
      </svg>
      <div className={styles.donutLegend}>
        {cats.map(c => (
          <div key={c.cat} className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: c.color }} />
            <span className={styles.legendLabel}>{c.cat}</span>
            <span className={styles.legendCount}>{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const { user } = useAuth()
  const { goals } = useGoals(user?.uid)
  const totalXP = calcTotalXP(goals)
  const levelInfo = getLevelInfo(totalXP)
  const totalLogs = goals.reduce((s, g) => s + (g.logs || []).length, 0)
  const completed = goals.filter(g => g.progress >= 100).length
  const avgProgress = goals.length
    ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Stats</h1>
        <p className={styles.sub}>Your progress at a glance</p>
      </div>

      {/* Top metrics */}
      <div className={styles.metricsRow}>
        {[
          { label: 'Total XP', value: totalXP.toLocaleString(), color: 'var(--gold)', sub: `Level ${levelInfo.level}` },
          { label: 'Goals Created', value: goals.length, color: 'var(--accent)', sub: `${completed} completed` },
          { label: 'Total Logs', value: totalLogs, color: 'var(--blue)', sub: 'across all goals' },
          { label: 'Avg Progress', value: `${avgProgress}%`, color: 'var(--success)', sub: 'across all goals' },
        ].map(m => (
          <div key={m.label} className={styles.metricCard}>
            <div className={styles.metricVal} style={{ color: m.color }}>{m.value}</div>
            <div className={styles.metricLabel}>{m.label}</div>
            <div className={styles.metricSub}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        {/* Activity heatmap */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle}>Activity — last 12 weeks</h3>
          <p className={styles.chartSub}>Each square = one day. Darker = more logs.</p>
          <ActivityGrid goals={goals} />
        </div>

        {/* Progress bar chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Goal Progress</h3>
          <p className={styles.chartSub}>Top goals by completion</p>
          {goals.length === 0 ? <p className={styles.noData}>No goals yet</p> : <ProgressBarChart goals={goals} />}
        </div>

        {/* Category donut */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Goals by Category</h3>
          <p className={styles.chartSub}>Distribution across life areas</p>
          <CategoryDonut goals={goals} />
        </div>
      </div>
    </div>
  )
}
