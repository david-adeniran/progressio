import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { getCategoryLevel } from '../lib/xp'
import {
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf, Zap,
  Trophy, ArrowUpRight, AlertCircle, ChevronRight,
} from 'lucide-react'
import styles from './CategoriesPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}
const ICONS = {
  Finance: Wallet, Fitness: Dumbbell, Learning: BookOpen,
  Career: Briefcase, Health: Heart, Travel: Plane, Personal: Leaf, Custom: Zap,
}

function getCatXP(goals, cat) {
  return goals
    .filter(g => g.category === cat)
    .reduce((s, g) => {
      return s + (g.logs || []).length * 10 + (g.progress >= 100 ? 100 : 0) + Math.floor((g.progress || 0) / 10) * 5
    }, 0)
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const { goals } = useGoals(user?.uid)
  const navigate = useNavigate()
  const categories = Object.keys(CATEGORY_COLORS)

  const catData = categories.map(cat => {
    const color = CATEGORY_COLORS[cat]
    const Icon = ICONS[cat]
    const catGoals = goals.filter(g => g.category === cat)
    const completed = catGoals.filter(g => g.progress >= 100).length
    const active = catGoals.filter(g => g.progress < 100).length
    const avg = catGoals.length
      ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length) : 0
    const xp = getCatXP(goals, cat)
    const { title: catTitle, level: catLevel } = getCategoryLevel(goals, cat)
    return { cat, color, Icon, catGoals, completed, active, avg, xp, catTitle, catLevel }
  })

  const withGoals = catData.filter(d => d.catGoals.length > 0)
  const leaderboard = [...catData].sort((a, b) => b.xp - a.xp).slice(0, 3)
  const mostProductive = [...catData].sort((a, b) => b.avg - a.avg)[0]
  const needsAttention = withGoals.sort((a, b) => a.avg - b.avg)[0]
  const bestCompletion = [...catData].sort((a, b) => {
    const rA = a.catGoals.length ? a.completed / a.catGoals.length : 0
    const rB = b.catGoals.length ? b.completed / b.catGoals.length : 0
    return rB - rA
  })[0]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.sub}>Growth across every area of your life</p>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.headerMetaItem}>{goals.length} goals</span>
          <span className={styles.headerMetaDot} />
          <span className={styles.headerMetaItem}>{catData.filter(d => d.catGoals.length > 0).length} active areas</span>
        </div>
      </div>

      {/* Horizontal category strip */}
      <div className={styles.strip}>
        {catData.map(({ cat, color, Icon, catGoals, avg }) => (
          <button key={cat} className={styles.stripItem}
            onClick={() => navigate(`/goals?category=${cat}`)}>
            <div className={styles.stripIcon} style={{ color }}>
              <Icon size={14} strokeWidth={2} />
            </div>
            <span className={styles.stripName}>{cat}</span>
            <div className={styles.stripBar}>
              <div className={styles.stripBarFill} style={{ width: `${avg}%`, background: color }} />
            </div>
            <span className={styles.stripPct} style={{ color }}>{avg}%</span>
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Left — category list */}
        <div className={styles.left}>
          {catData.map(({ cat, color, Icon, catGoals, completed, active, avg, xp, catTitle, catLevel }) => (
            <div key={cat} className={styles.row}>
              {/* Color rule */}
              <div className={styles.rowRule} style={{ background: color }} />

              <div className={styles.rowMain}>
                {/* Row header */}
                <div className={styles.rowHeader}>
                  <div className={styles.rowLeft}>
                    <div className={styles.rowIconWrap} style={{ color }}>
                      <Icon size={16} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className={styles.rowName}>{cat}</div>
                      <div className={styles.rowLevel} style={{ color }}>
                        Lv.{catLevel} · {catTitle}
                      </div>
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <div className={styles.rowStats}>
                      <div className={styles.rowStat}>
                        <span className={styles.rowStatVal} style={{ color }}>{avg}%</span>
                        <span className={styles.rowStatLabel}>avg</span>
                      </div>
                      <div className={styles.rowStatDivider} />
                      <div className={styles.rowStat}>
                        <span className={styles.rowStatVal}>{catGoals.length}</span>
                        <span className={styles.rowStatLabel}>goals</span>
                      </div>
                      <div className={styles.rowStatDivider} />
                      <div className={styles.rowStat}>
                        <span className={styles.rowStatVal} style={{ color: 'var(--gold)' }}>{xp}</span>
                        <span className={styles.rowStatLabel}>xp</span>
                      </div>
                    </div>
                    <button className={styles.rowBtn} style={{ color }}
                      onClick={() => navigate(`/goals?category=${cat}`)}>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={styles.rowBarTrack}>
                  <div className={styles.rowBarFill} style={{ width: `${avg}%`, background: color }} />
                </div>

                {/* Goals list */}
                {catGoals.length > 0 ? (
                  <div className={styles.goalsList}>
                    {catGoals.slice(0, 3).map(g => {
                      const pct = Math.min(100, Math.round(g.progress || 0))
                      return (
                        <div key={g.id} className={styles.goalItem}
                          onClick={() => navigate(`/goal/${g.id}`)}>
                          <div className={styles.goalItemBar} style={{ width: `${pct}%`, background: color + '55' }} />
                          <span className={styles.goalItemName}>{g.title}</span>
                          <span className={styles.goalItemPct} style={{ color }}>{pct}%</span>
                          <ChevronRight size={12} color="var(--text-dim)" />
                        </div>
                      )
                    })}
                    {catGoals.length > 3 && (
                      <button className={styles.moreBtn}
                        onClick={() => navigate(`/goals?category=${cat}`)}>
                        +{catGoals.length - 3} more goals
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyRow}>
                    No goals in this category yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right — sidebar */}
        <div className={styles.right}>
          {/* Leaderboard */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Trophy size={13} color="var(--gold)" />
              <span className={styles.panelTitle}>Category ranking</span>
            </div>
            <div className={styles.rankList}>
              {leaderboard.map(({ cat, color, Icon, xp }, i) => (
                <div key={cat} className={styles.rankItem}
                  onClick={() => navigate(`/goals?category=${cat}`)}>
                  <span className={styles.rankNum}
                    style={{ color: i === 0 ? 'var(--gold)' : i === 1 ? '#b0b8c1' : '#cd7f32' }}>
                    {i + 1}
                  </span>
                  <div className={styles.rankIcon} style={{ color }}>
                    <Icon size={13} strokeWidth={1.8} />
                  </div>
                  <span className={styles.rankName}>{cat}</span>
                  <span className={styles.rankXP} style={{ color: 'var(--gold)' }}>{xp} XP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Insights</span>
            </div>

            <div className={styles.insightList}>
              <div className={styles.insightItem}
                onClick={() => navigate(`/goals?category=${mostProductive?.cat}`)}>
                <span className={styles.insightKey}>Most productive</span>
                <div className={styles.insightVal}>
                  <span style={{ color: CATEGORY_COLORS[mostProductive?.cat] }}>
                    {mostProductive?.cat || '—'}
                  </span>
                  <span className={styles.insightSub}>{mostProductive?.avg}% avg</span>
                </div>
              </div>

              <div className={styles.insightItem}
                onClick={() => navigate(`/goals?category=${needsAttention?.cat}`)}>
                <div className={styles.insightKeyWrap}>
                  <AlertCircle size={11} color="var(--danger)" />
                  <span className={styles.insightKey}>Needs attention</span>
                </div>
                <div className={styles.insightVal}>
                  <span style={{ color: 'var(--danger)' }}>{needsAttention?.cat || '—'}</span>
                  <span className={styles.insightSub}>{needsAttention?.avg}% complete</span>
                </div>
              </div>

              <div className={styles.insightItem}
                onClick={() => navigate(`/goals?category=${bestCompletion?.cat}`)}>
                <span className={styles.insightKey}>Best completion</span>
                <div className={styles.insightVal}>
                  <span style={{ color: CATEGORY_COLORS[bestCompletion?.cat] }}>
                    {bestCompletion?.catGoals.length
                      ? `${Math.round((bestCompletion.completed / bestCompletion.catGoals.length) * 100)}%`
                      : '—'}
                  </span>
                  <span className={styles.insightSub}>{bestCompletion?.cat}</span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className={styles.insightItem} style={{ flexDirection: 'column', gap: 8, cursor: 'default' }}>
                <span className={styles.insightKey}>Goals by area</span>
                <div className={styles.miniChart}>
                  {catData.filter(d => d.catGoals.length > 0).map(({ cat, color, catGoals }) => (
                    <div key={cat} className={styles.miniChartRow}>
                      <span className={styles.miniChartLabel}>{cat.slice(0, 3)}</span>
                      <div className={styles.miniChartTrack}>
                        <div className={styles.miniChartFill}
                          style={{ width: `${Math.min(100, catGoals.length * 20)}%`, background: color }} />
                      </div>
                      <span className={styles.miniChartVal}>{catGoals.length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
