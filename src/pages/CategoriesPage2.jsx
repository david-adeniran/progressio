import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { getCategoryLevel, calcTotalXP } from '../lib/xp'
import {
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf, Zap,
  Trophy, TrendingUp, AlertTriangle, Flame,
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
const MEDALS = {
  1: '/gold-medal.jpeg',
  2: '/silver-medal.jpeg',
  3: '/bronze-medal.jpeg',
}

function getCatXP(goals, cat) {
  return goals
    .filter(g => g.category === cat)
    .reduce((s, g) => {
      const logs = g.logs || []
      return s + logs.length * 10 + (g.progress >= 100 ? 100 : 0) + Math.floor((g.progress || 0) / 10) * 5
    }, 0)
}

function ProgressRing({ pct, color, size = 72, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className={styles.ringWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <span className={styles.ringPct} style={{ color, fontSize: size > 60 ? '1rem' : '0.7rem' }}>{pct}%</span>
    </div>
  )
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const { goals } = useGoals(user?.uid)
  const navigate = useNavigate()
  const categories = Object.keys(CATEGORY_COLORS)

  // Build category data
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

  // Leaderboard — top 3 by XP
  const leaderboard = [...catData].sort((a, b) => b.xp - a.xp).slice(0, 3)

  // Insights
  const mostProductive = [...catData].sort((a, b) => b.avg - a.avg)[0]
  const highestXP = [...catData].sort((a, b) => b.xp - a.xp)[0]
  const needsAttention = [...catData].filter(d => d.catGoals.length > 0).sort((a, b) => a.avg - b.avg)[0]
  const mostActive = catData.find(d => d.catGoals.length > 0 && d.avg > 0) || catData[0]
  const bestCompletion = [...catData].sort((a, b) => {
    const rateA = a.catGoals.length ? a.completed / a.catGoals.length : 0
    const rateB = b.catGoals.length ? b.completed / b.catGoals.length : 0
    return rateB - rateA
  })[0]

  const podiumOrder = leaderboard.length >= 3
    ? [leaderboard[1], leaderboard[0], leaderboard[2]]
    : leaderboard

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.sub}>Track growth across every area of your life.</p>
        </div>
      </div>

      {/* Top summary row */}
      <div className={styles.summaryLabel}>TOP SUMMARY ROW</div>
      <div className={styles.summaryRow}>
        {catData.map(({ cat, color, Icon, catGoals, avg, xp, catLevel }) => (
          <div key={cat} className={styles.summaryCard} style={{ '--cat-color': color }}
            onClick={() => navigate(`/goals?category=${cat}`)}>
            <div className={styles.summaryCardTop}>
              <Icon size={14} color={color} strokeWidth={1.8} />
              <span className={styles.summaryCardName}>{cat}</span>
            </div>
            <div className={styles.summaryCardPct} style={{ color }}>{avg}% completion</div>
            <div className={styles.summaryCardBar}>
              <div style={{ width: `${avg}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
            </div>
            <div className={styles.summaryCardMeta}>
              <span>XP Earned: {xp}</span>
              <span>Goals: {catGoals.length}</span>
              <span>Level {catLevel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.mainLeft}>
          {/* Category Grid label */}
          <div className={styles.sectionLabel}>Category Grid</div>

          {/* Category Grid */}
          <div className={styles.catGrid}>
            {catData.map(({ cat, color, Icon, catGoals, completed, active, avg, xp, catTitle, catLevel }) => (
              <div key={cat} className={styles.catCard} style={{ '--cat-color': color }}>
                <div className={styles.catCardHeader}>
                  <div className={styles.catCardIcon} style={{ background: color + '20' }}>
                    <Icon size={18} color={color} strokeWidth={1.8} />
                  </div>
                  <div className={styles.catCardTitleWrap}>
                    <span className={styles.catCardName}>{cat}</span>
                    <span className={styles.catCardLevel} style={{ color }}>Level {catLevel} · {catTitle}</span>
                  </div>
                  <ProgressRing pct={avg} color={color} size={64} stroke={5} />
                </div>

                <div className={styles.catCardBody}>
                  <div className={styles.catCardStat}>
                    <span className={styles.catCardStatLabel}>Completion</span>
                    <span className={styles.catCardStatVal} style={{ color }}>{avg}%</span>
                  </div>
                  <div className={styles.catCardStat}>
                    <span className={styles.catCardStatLabel}>XP Earned</span>
                    <span className={styles.catCardStatVal} style={{ color: 'var(--gold)' }}>{xp}</span>
                  </div>
                </div>

                {catGoals.length > 0 ? (
                  <div className={styles.catCardGoals}>
                    <span className={styles.catCardGoalsLabel}>Goals</span>
                    {catGoals.slice(0, 3).map(g => (
                      <div key={g.id} className={styles.catCardGoalItem}
                        onClick={e => { e.stopPropagation(); navigate(`/goal/${g.id}`) }}>
                        <span className={styles.catCardGoalDot} style={{ background: color }} />
                        <span className={styles.catCardGoalTitle}>{g.title}</span>
                        <span className={styles.catCardGoalPct} style={{ color }}>{g.progress || 0}%</span>
                      </div>
                    ))}
                    {catGoals.length > 3 && (
                      <span className={styles.catCardMore}>+{catGoals.length - 3} more</span>
                    )}
                  </div>
                ) : (
                  <p className={styles.catCardEmpty}>No goals yet</p>
                )}

                <button
                  className={styles.viewHubBtn}
                  style={{ '--cat-color': color }}
                  onClick={() => navigate(`/goals?category=${cat}`)}
                >
                  View Hub
                </button>
              </div>
            ))}
          </div>

          {/* Category Insights */}
          <div className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>Category Insights</div>
          <div className={styles.insightsGrid}>
            <div className={styles.insightCard}>
              <span className={styles.insightLabel}>Most Productive Category</span>
              <span className={styles.insightVal}>{mostProductive?.cat || '—'}</span>
              {mostProductive && (
                <span className={styles.insightSub} style={{ color: CATEGORY_COLORS[mostProductive.cat] }}>
                  {mostProductive.avg}% avg completion
                </span>
              )}
            </div>
            <div className={styles.insightCard}>
              <span className={styles.insightLabel}>Highest XP Earned</span>
              <span className={styles.insightVal}>{highestXP?.cat || '—'}</span>
              {highestXP && (
                <span className={styles.insightSub} style={{ color: 'var(--gold)' }}>
                  {highestXP.xp} XP total
                </span>
              )}
            </div>
            <div className={styles.insightCard} style={{ borderColor: 'rgba(242,90,90,0.2)', background: 'rgba(242,90,90,0.04)' }}>
              <span className={styles.insightLabel}>Needs Attention</span>
              <span className={styles.insightVal} style={{ color: 'var(--danger)' }}>{needsAttention?.cat || '—'}</span>
              {needsAttention && (
                <span className={styles.insightSub} style={{ color: 'var(--danger)' }}>
                  Only {needsAttention.avg}% complete
                </span>
              )}
            </div>
            <div className={styles.insightCard}>
              <span className={styles.insightLabel}>Goals Across Categories</span>
              <div className={styles.miniBarChart}>
                {catData.filter(d => d.catGoals.length > 0).map(({ cat, color, catGoals }) => (
                  <div key={cat} className={styles.miniBar} title={`${cat}: ${catGoals.length}`}>
                    <div className={styles.miniBarFill}
                      style={{ height: `${Math.min(100, catGoals.length * 20)}%`, background: color }} />
                    <span className={styles.miniBarLabel}>{cat.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.insightCard}>
              <span className={styles.insightLabel}>Best Completion Rate</span>
              <span className={styles.insightVal}>
                {bestCompletion?.catGoals.length
                  ? `${Math.round((bestCompletion.completed / bestCompletion.catGoals.length) * 100)}%`
                  : '—'}
              </span>
              {bestCompletion?.catGoals.length > 0 && (
                <span className={styles.insightSub} style={{ color: CATEGORY_COLORS[bestCompletion.cat] }}>
                  {bestCompletion.cat}
                </span>
              )}
            </div>
            <div className={styles.insightCard}>
              <span className={styles.insightLabel}>Highest XP Category</span>
              <span className={styles.insightVal} style={{ color: 'var(--gold)' }}>
                {highestXP?.xp ? `${highestXP.xp} XP` : '—'}
              </span>
              {highestXP && (
                <span className={styles.insightSub}>{highestXP.cat}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          {/* Leaderboard */}
          <div className={styles.leaderboard}>
            <div className={styles.leaderboardTitle}>
              <Trophy size={14} color="var(--gold)" />
              Category Leaderboard
            </div>
            <p className={styles.leaderboardSub}>XP ranking:</p>

            <div className={styles.podium}>
              {podiumOrder.map((d, i) => {
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3
                const Icon = ICONS[d.cat]
                const MEDALS = { 1: '/gold-medal.png',2: '/silver-medal.png', 3: '/bronze-medal.png',}
                return (
                  <div key={d.cat} className={`${styles.podiumItem} ${rank === 1 ? styles.podiumFirst : ''}`}>
                    <div className={styles.podiumMedal}>{medals[rank - 1]}</div>
                    <div className={styles.podiumIconWrap} style={{ background: d.color + '22', border: `2px solid ${d.color}44` }}>
                      <Icon size={18} color={d.color} strokeWidth={1.8} />
                    </div>
                    <span className={styles.podiumRank} style={{ background: d.color, color: '#fff' }}>{rank}</span>
                    <span className={styles.podiumName}>{d.cat}</span>
                    <span className={styles.podiumXP} style={{ color: d.color }}>{d.xp} XP</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right insights */}
          <div className={styles.rightInsights}>
            <div className={styles.rightInsightItem}>
              <span className={styles.rightInsightLabel}>Most active category</span>
              {mostActive && (
                <div className={styles.rightInsightContent}>
                  <span style={{ color: CATEGORY_COLORS[mostActive.cat], fontWeight: 600, fontSize: '0.82rem' }}>
                    {mostActive.cat}
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    {mostActive.catGoals.slice(0, 2).map(g => (
                      <div key={g.id} className={styles.rightInsightGoal}
                        onClick={() => navigate(`/goal/${g.id}`)}>
                        · {g.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.rightInsightItem}>
              <span className={styles.rightInsightLabel}>Current streak category</span>
              {mostActive && (
                <div className={styles.rightInsightContent}>
                  {mostActive.catGoals.slice(0, 2).map(g => (
                    <div key={g.id} className={styles.rightInsightGoal}
                      onClick={() => navigate(`/goal/${g.id}`)}>
                      · {g.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.rightInsightItem}>
              <span className={styles.rightInsightLabel}>Best completion rate</span>
              {bestCompletion?.catGoals.length > 0 && (
                <div className={styles.rightInsightContent}>
                  <span className={styles.rightInsightBig} style={{ color: CATEGORY_COLORS[bestCompletion.cat] }}>
                    {Math.round((bestCompletion.completed / bestCompletion.catGoals.length) * 100)}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}> · {bestCompletion.cat}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
