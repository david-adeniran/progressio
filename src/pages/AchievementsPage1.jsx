import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { calcTotalXP, getLevelInfo, ACHIEVEMENTS } from '../lib/xp'
import { Target, Pencil, CheckCircle, Rocket, Globe, Flame, Zap, Star, Trophy, Lock, RotateCcw, AlertTriangle } from 'lucide-react'
import styles from './AchievementsPage.module.css'

const ICONS = {
  target: Target, pencil: Pencil, check: CheckCircle,
  rocket: Rocket, globe: Globe, flame: Flame,
  zap: Zap, star: Star, trophy: Trophy,
}

const TIER_META = {
  legendary: { label: 'Legendary', color: '#f0a844', xp: 500 },
  epic:      { label: 'Epic',      color: '#7c6af7', xp: 250 },
  rare:      { label: 'Rare',      color: '#4ab8f5', xp: 100 },
  common:    { label: 'Common',    color: '#7c7c8e', xp: 50  },
  hidden:    { label: 'Hidden',    color: '#f25a95', xp: 300 },
}

const TIER_ORDER = ['legendary', 'epic', 'rare', 'common', 'hidden']

const ROADMAP_LEVELS = [
  { level: 2,  label: 'Level 2',  desc: 'Unlock at\nLevel 2' },
  { level: 3,  label: 'Level 3',  desc: 'Unlock at\nLevel 3' },
  { level: 5,  label: 'Level 5',  desc: 'Unlock at\nLevel 5' },
  { level: 10, label: 'Level 10', desc: 'Unlock at\nLevel 10' },
]

export default function AchievementsPage() {
  const { user } = useAuth()
  const { goals, getUnlockedAchievements, resetAchievements, persistedAchievements } = useGoals(user?.uid)
  const totalXP = calcTotalXP(goals)
  const { level } = getLevelInfo(totalXP)
  const [filter, setFilter] = useState('all')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Use persisted achievements merged with current goal state
  const unlockedSet = getUnlockedAchievements()
  const unlocked = ACHIEVEMENTS.filter(a => unlockedSet.has(a.id))
  const unlockedIds = unlockedSet

  const pct = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)

  const featured = useMemo(() => {
    const tierRank = { legendary: 0, epic: 1, hidden: 2, rare: 3, common: 4 }
    return [...unlocked].sort((a, b) => tierRank[a.tier] - tierRank[b.tier])[0] || null
  }, [unlocked])

  const filtered = useMemo(() => {
    if (filter === 'all') return ACHIEVEMENTS
    if (filter === 'unlocked') return ACHIEVEMENTS.filter(a => unlockedIds.has(a.id))
    if (filter === 'locked') return ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id))
    return ACHIEVEMENTS.filter(a => a.tier === filter)
  }, [filter, unlockedIds])

  const rarestUnlocked = useMemo(() => {
    const tierRank = { legendary: 0, epic: 1, hidden: 2, rare: 3, common: 4 }
    return [...unlocked].sort((a, b) => tierRank[a.tier] - tierRank[b.tier])[0]
  }, [unlocked])

  async function handleReset() {
    setResetting(true)
    await resetAchievements()
    setResetting(false)
    setShowResetConfirm(false)
  }

  function filterTabClass(val) {
    const isTier = TIER_ORDER.includes(val)
    let cls = styles.filterTab
    if (isTier) cls += ' ' + styles.filterTabTier
    if (filter === val) cls += ' ' + (isTier ? styles.filterTabTierActive : styles.filterTabActive)
    return cls
  }

  return (
    <div className={styles.page}>

      {/* Reset confirm — inline, not modal */}
      {showResetConfirm && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1.1rem 1.25rem',
          background: 'var(--surface)',
          border: '1px solid var(--danger)',
          borderLeft: '3px solid var(--danger)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
              Reset all achievements?
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This permanently erases all unlocked achievements and cannot be undone.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
              onClick={() => setShowResetConfirm(false)}>Cancel</button>
            <button className="btn" style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', background: 'var(--danger)', color: '#fff' }}
              onClick={handleReset} disabled={resetting}>
              {resetting ? 'Resetting…' : 'Reset'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.sub}>Celebrate milestones and track your journey toward mastery.</p>
        </div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowResetConfirm(true)}
        >
          <RotateCcw size={13} /> Reset achievements
        </button>
      </div>

      {/* Top progress bar */}
      <div className={styles.topProgress}>
        <span className={styles.topProgressLabel}>{unlocked.length} / {ACHIEVEMENTS.length} Unlocked</span>
        <div className={styles.topProgressTrack}>
          <div className={styles.topProgressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.topProgressPct}>{pct}% Complete</span>
      </div>

      <div className={styles.layout}>
        {/* Left column */}
        <div>
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroTag}>Featured Achievement</div>
            {featured ? (
              <div className={styles.heroBody}>
                <div className={styles.heroHexWrap}>
                  <div className={styles.heroHex}>
                    {(() => { const Icon = ICONS[featured.icon] || Trophy; return <Icon size={38} color={TIER_META[featured.tier].color} strokeWidth={1.5} /> })()}
                  </div>
                  <span className={styles.heroHexBadge}>{TIER_META[featured.tier].label.toUpperCase()}</span>
                </div>
                <div className={styles.heroInfo}>
                  <div className={styles.heroName}>{featured.label}</div>
                  <div className={styles.heroDesc}>{featured.revealedDesc || featured.desc}</div>
                  <div className={styles.heroXP}>+{TIER_META[featured.tier].xp} XP</div>
                </div>
              </div>
            ) : (
              <p className={styles.heroEmpty}>Complete your first achievement to feature it here.</p>
            )}
          </div>

          {/* Filter tabs */}
          <div className={styles.filters}>
            {['all','unlocked','locked'].map(f => (
              <button key={f} className={filter === f ? `${styles.filterTab} ${styles.filterTabActive}` : styles.filterTab}
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            {TIER_ORDER.map(tier => (
              <button key={tier}
                className={filterTabClass(tier)}
                style={{ '--tier-color': TIER_META[tier].color }}
                onClick={() => setFilter(tier)}>
                {TIER_META[tier].label}
              </button>
            ))}
          </div>

          {/* Trophy grid */}
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No achievements in this filter.</div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(a => {
                const isUnlocked = unlockedIds.has(a.id)
                const meta = TIER_META[a.tier]
                const Icon = ICONS[a.icon] || Trophy
                const isHidden = a.tier === 'hidden' && !isUnlocked

                return (
                  <div key={a.id}
                    className={`${styles.badge} ${isUnlocked ? styles.badgeUnlocked : ''}`}
                    style={{ '--tier-color': meta.color }}>

                    {isUnlocked
                      ? <span className={styles.badgeXPTag}>+{meta.xp} XP</span>
                      : <span className={styles.badgeLockTag}><Lock size={11} /></span>
                    }

                    <div className={styles.badgeIcon}>
                      {isUnlocked
                        ? <Icon size={26} color={meta.color} strokeWidth={1.8} />
                        : <Lock size={20} color="var(--text-muted)" />
                      }
                    </div>

                    <span className={styles.tierTag} style={{
                      color: isUnlocked ? meta.color : 'var(--text-muted)',
                      borderColor: isUnlocked ? meta.color + '44' : 'var(--border)',
                      background: isUnlocked ? meta.color + '14' : 'transparent',
                    }}>
                      {meta.label}
                    </span>

                    <h3 className={styles.badgeName} style={{ color: isUnlocked ? 'var(--text)' : 'var(--text-muted)' }}>
                      {isHidden ? '???' : a.label}
                    </h3>
                    <p className={styles.badgeDesc}>
                      {isHidden ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Lock size={10} /> Secret achievement</span> : (isUnlocked ? (a.revealedDesc || a.desc) : a.desc)}
                    </p>
                    {isUnlocked && <span className={styles.badgeCheck}>✓ Earned</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Roadmap */}
          <div className={styles.roadmap}>
            <div className={styles.roadmapTitle}>Achievement Roadmap</div>
            <div className={styles.roadmapTrack}>
              {ROADMAP_LEVELS.map((node, i) => {
                const isDone = level > node.level
                const isActive = level === node.level
                return (
                  <div key={node.level} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div className={styles.roadmapNode}>
                      <div className={`${styles.roadmapDot} ${isActive ? styles.roadmapDotActive : ''} ${isDone ? styles.roadmapDotDone : ''}`}>
                        {isDone ? '✓' : node.label}
                      </div>
                      <span className={`${styles.roadmapLabel} ${isActive ? styles.roadmapLabelActive : ''}`}>
                        {node.desc}
                      </span>
                    </div>
                    {i < ROADMAP_LEVELS.length - 1 && (
                      <div className={`${styles.roadmapLine} ${isDone ? styles.roadmapLineDone : ''}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Achievement Statistics</div>
            {[
              { label: 'Unlocked', val: unlocked.length },
              { label: 'Locked', val: ACHIEVEMENTS.length - unlocked.length },
              { label: 'Total XP Earned', val: totalXP.toLocaleString() },
              { label: 'Rarest Achievement', val: rarestUnlocked ? rarestUnlocked.label : '—' },
            ].map(row => (
              <div key={row.label} className={styles.statRow}>
                <span className={styles.statRowLabel}>{row.label}</span>
                <span className={styles.statRowVal}>{row.val}</span>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTitle}>Rarity Legend</div>
            {TIER_ORDER.filter(t => t !== 'hidden').map(tier => (
              <div key={tier} className={styles.legendRow}>
                <div className={styles.legendDot} style={{ background: TIER_META[tier].color }} />
                <span className={styles.legendLabel}>{TIER_META[tier].label} — {
                  tier === 'legendary' ? 'Gold' : tier === 'epic' ? 'Purple' : tier === 'rare' ? 'Blue' : 'Grey'
                }</span>
              </div>
            ))}
          </div>

          {unlocked.length > 0 && (
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Recent Unlocks</div>
              {unlocked.slice(-4).reverse().map(a => {
                const meta = TIER_META[a.tier]
                const Icon = ICONS[a.icon] || Trophy
                return (
                  <div key={a.id} className={styles.recentItem}>
                    <div className={styles.recentIcon} style={{ background: meta.color + '18' }}>
                      <Icon size={16} color={meta.color} strokeWidth={2} />
                    </div>
                    <div className={styles.recentInfo}>
                      <div className={styles.recentName}>{a.label}</div>
                      <div className={styles.recentSub}>Unlocked</div>
                    </div>
                    <span className={styles.recentXP} style={{ color: meta.color }}>+{meta.xp} XP</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
