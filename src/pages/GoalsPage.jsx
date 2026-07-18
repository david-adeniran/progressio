import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import AddGoalModal from '../components/AddGoalModal'
import {
  Plus, TrendingUp, AlertTriangle, CheckCircle2, LayoutGrid,
  Calendar, Tag, Zap, X, ChevronRight, Circle,
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf,
} from 'lucide-react'
import styles from './GoalsPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}
const CATEGORY_ICONS = {
  Finance: Wallet, Fitness: Dumbbell, Learning: BookOpen,
  Career: Briefcase, Health: Heart, Travel: Plane,
  Personal: Leaf, Custom: Zap,
}

function getXP(goal) {
  const logs = goal.logs || []
  return logs.length * 10 + (goal.progress >= 100 ? 100 : 0) + Math.floor((goal.progress || 0) / 10) * 5
}

function getPaceStatus(goal) {
  if (goal.progress >= 100) return 'completed'
  if (!goal.startDate || !goal.deadline) return 'on-track'
  const start = new Date(goal.startDate + 'T00:00:00')
  const end = new Date(goal.deadline + 'T00:00:00')
  const totalDays = (end - start) / 86400000
  const elapsed = (Date.now() - start) / 86400000
  const expected = Math.min(100, Math.round((elapsed / totalDays) * 100))
  const actual = goal.progress || 0
  if (actual < expected - 15) return 'at-risk'
  return 'on-track'
}

function GoalRow({ goal, color, isSelected, onClick }) {
  const pct = Math.min(100, Math.round(goal.progress || 0))
  const xp = getXP(goal)
  const unit = goal.unit || ''
  const isNumeric = goal.trackingType === 'numeric'
  const deadline = goal.deadline ? new Date(goal.deadline + 'T00:00:00') : null
  const status = getPaceStatus(goal)
  const Icon = CATEGORY_ICONS[goal.category] || Zap

  const statusConfig = {
    'on-track': { label: 'On Track', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.25)' },
    'at-risk': { label: 'At Risk', color: '#f0a844', bg: 'rgba(240,168,68,0.12)', border: 'rgba(240,168,68,0.25)' },
    'completed': { label: 'Completed', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.25)' },
  }
  const sc = statusConfig[status]

  return (
    <div
      className={`${styles.goalRow} ${isSelected ? styles.goalRowSelected : ''}`}
      style={{ '--goal-color': color }}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={styles.goalRowIcon} style={{ background: color + '20', border: `1px solid ${color}30` }}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>

      {/* Main info */}
      <div className={styles.goalRowMain}>
        <div className={styles.goalRowTop}>
          <div className={styles.goalRowTitleWrap}>
            <span className={styles.goalRowTitle}>{goal.title}</span>
            {goal.description && <span className={styles.goalRowDesc}>{goal.description}</span>}
          </div>
          <div className={styles.goalRowRight}>
            {deadline && (
              <span className={styles.goalRowDate}>
                {goal.progress >= 100 ? `Completed` : `Due ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            )}
            <span className={styles.goalRowStatus} style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
              {sc.label}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.goalRowBarWrap}>
          <div className={styles.goalRowBar}>
            <div
              className={styles.goalRowBarFill}
              style={{
                width: `${pct}%`,
                background: goal.progress >= 100 ? '#4ade80' : color,
              }}
            />
          </div>
          <span className={styles.goalRowPct} style={{ color }}>{pct}%</span>
        </div>

        {/* Meta row */}
        <div className={styles.goalRowMeta}>
          {isNumeric ? (
            <span className={styles.goalRowAmt}>
              {unit}{Number(goal.currentAmount || 0).toLocaleString('en-NG')} / {unit}{Number(goal.targetAmount || 0).toLocaleString('en-NG')}
            </span>
          ) : (
            <span className={styles.goalRowAmt}>Milestone tracking</span>
          )}
          {goal.frequency && (
            <span className={styles.goalRowFreq}>· {goal.frequency}</span>
          )}
          <span className={styles.goalRowXP} style={{ color: '#f0a844' }}>+{xp} XP</span>
        </div>
      </div>
    </div>
  )
}

function GoalDetailPanel({ goal, onClose, color }) {
  const navigate = useNavigate()
  const pct = Math.min(100, Math.round(goal.progress || 0))
  const xp = getXP(goal)
  const unit = goal.unit || ''
  const isNumeric = goal.trackingType === 'numeric'
  const status = getPaceStatus(goal)
  const deadline = goal.deadline ? new Date(goal.deadline + 'T00:00:00') : null
  const Icon = CATEGORY_ICONS[goal.category] || Zap

  const statusConfig = {
    'on-track': { label: 'On Track', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.25)' },
    'at-risk': { label: 'At Risk', color: '#f0a844', bg: 'rgba(240,168,68,0.12)', border: 'rgba(240,168,68,0.25)' },
    'completed': { label: 'Completed', color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', border: 'rgba(62,207,142,0.25)' },
  }
  const sc = statusConfig[status]

  // Auto milestones at 25/50/75/100
  const milestones = [25, 50, 75, 100].map(m => ({
    pct: m,
    reached: pct >= m,
    label: m === 100 ? 'Goal Complete' : `${m}% Reached`,
    xp: m === 100 ? 100 : m === 75 ? 75 : m === 50 ? 50 : 25,
  }))

  return (
    <div className={styles.detailPanel}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderLeft}>
          <div className={styles.detailIcon} style={{ background: color + '22', border: `1px solid ${color}33` }}>
            <Icon size={22} color={color} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={styles.detailTitle}>{goal.title}</span>
              <span className={styles.goalRowStatus} style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: '0.65rem' }}>
                {sc.label}
              </span>
            </div>
            {goal.description && <p className={styles.detailDesc}>{goal.description}</p>}
          </div>
        </div>
        <button className={styles.detailClose} onClick={onClose}><X size={15} /></button>
      </div>

      {/* Progress */}
      <div className={styles.detailProgress}>
        <div className={styles.detailProgressTop}>
          <span className={styles.detailPct} style={{ color }}>{pct}%</span>
          {isNumeric && (
            <span className={styles.detailAmt}>
              {unit}{Number(goal.currentAmount || 0).toLocaleString('en-NG')} / {unit}{Number(goal.targetAmount || 0).toLocaleString('en-NG')}
            </span>
          )}
          <span className={styles.detailXP} style={{ color: '#f0a844' }}>+{xp} XP</span>
        </div>
        <div className={styles.detailBar}>
          <div className={styles.detailBarFill} style={{
            width: `${pct}%`,
            background: color,
          }} />
        </div>
      </div>

      {/* Meta grid */}
      <div className={styles.detailMeta}>
        <div className={styles.detailMetaItem}>
          <CheckCircle2 size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Status</span>
          <span className={styles.detailMetaVal} style={{ color: sc.color }}>{sc.label}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <Calendar size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Due Date</span>
          <span className={styles.detailMetaVal}>
            {deadline ? deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </span>
        </div>
        <div className={styles.detailMetaItem}>
          <Tag size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Category</span>
          <span className={styles.detailMetaVal} style={{ color }}>{goal.category}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <Zap size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Frequency</span>
          <span className={styles.detailMetaVal}>{goal.frequency || '—'}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <TrendingUp size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Logs</span>
          <span className={styles.detailMetaVal}>{(goal.logs || []).length} entries</span>
        </div>
        <div className={styles.detailMetaItem}>
          <LayoutGrid size={13} color="rgba(255,255,255,0.3)" />
          <span className={styles.detailMetaLabel}>Type</span>
          <span className={styles.detailMetaVal}>{goal.trackingType === 'numeric' ? 'Numeric' : 'Milestone'}</span>
        </div>
      </div>

      {/* Milestones */}
      <div className={styles.detailSection}>
      <span className={styles.detailSectionTitle}>Milestones</span>
      <div className={styles.milestoneList}>
        {milestones.map(m => (
        <div key={m.pct} className={styles.milestoneItem}>
          <div className={styles.milestoneCheck}>
          {m.reached
            ? <CheckCircle2 size={18} color="#3ecf8e" fill="rgba(62,207,142,0.2)" />
            : <Circle size={18} color="var(--border-light)" />
          }
        </div>
        <div className={styles.milestoneInfo}>
          <span className={styles.milestoneName} style={{ color: m.reached ? 'var(--text)' : 'var(--text-dim)' }}>
            {m.label}
          </span>
          <span className={styles.milestoneSub} style={{ color: m.reached ? 'var(--text-dim)' : 'var(--text-dim)' }}>
            {m.reached ? 'Completed' : `${m.pct - pct}% away`}
          </span>
        </div>
        <span className={styles.milestoneXP} style={{ color: m.reached ? '#f0a844' : 'var(--text-dim)' }}>
          +{m.xp} XP
        </span>
        </div>
        ))}
      </div>
    </div>

      {/* View full goal button */}
      <button className={styles.detailViewBtn} style={{ '--goal-color': color }} onClick={() => navigate(`/goal/${goal.id}`)}>
        View full goal <ChevronRight size={14} />
      </button>
    </div>
  )
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { goals, loading, addGoal, deleteGoal } = useGoals(user?.uid)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('All')
  const [sort, setSort] = useState('newest')
  const [searchParams] = useSearchParams()
  const [category, setCategory] = useState(searchParams.get('category') || 'All')
  const [selectedGoal, setSelectedGoal] = useState(null)

  useEffect(() => {
    const cat = searchParams.get('category')
    setCategory(cat || 'All')
    setSelectedGoal(null)
  }, [searchParams])

  const categoryGoals = category === 'All' ? goals : goals.filter(g => g.category === category)
  const onTrack = categoryGoals.filter(g => getPaceStatus(g) === 'on-track')
  const atRisk = categoryGoals.filter(g => getPaceStatus(g) === 'at-risk')
  const completed = categoryGoals.filter(g => g.progress >= 100)

  const getFiltered = () => {
    let base = categoryGoals
    if (tab === 'On Track') base = onTrack
    else if (tab === 'At Risk') base = atRisk
    else if (tab === 'Completed') base = completed

    return [...base].sort((a, b) => {
      if (sort === 'progress-high') return (b.progress || 0) - (a.progress || 0)
      if (sort === 'progress-low') return (a.progress || 0) - (b.progress || 0)
      if (sort === 'name') return a.title.localeCompare(b.title)
      return 0
    })
  }

  const filtered = getFiltered()

  // Group by status when on All tab
  const grouped = tab === 'All' ? [
    { key: 'on-track', label: 'ON TRACK', dot: '#3ecf8e', items: filtered.filter(g => getPaceStatus(g) === 'on-track' && g.progress < 100) },
    { key: 'at-risk', label: 'AT RISK', dot: '#f0a844', items: filtered.filter(g => getPaceStatus(g) === 'at-risk') },
    { key: 'completed', label: 'COMPLETED', dot: '#3ecf8e', items: filtered.filter(g => g.progress >= 100) },
  ].filter(g => g.items.length > 0) : null

  const selectedColor = selectedGoal ? (CATEGORY_COLORS[selectedGoal.category] || '#aaa') : null

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className={styles.title}>
              {category !== 'All' ? `${category} Goals` : 'Goals'}
            </h1>
            {category !== 'All' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.72rem', fontWeight: 600,
                color: CATEGORY_COLORS[category],
                background: CATEGORY_COLORS[category] + '18',
                border: `1px solid ${CATEGORY_COLORS[category]}44`,
                padding: '3px 10px', borderRadius: '99px',
                cursor: 'pointer',
              }} onClick={() => setCategory('All')}>
                {category} <X size={11} />
              </span>
            )}
          </div>
          <p className={styles.sub}>
            {category !== 'All'
              ? `${goals.filter(g => g.category === category).length} goals in ${category}`
              : 'Manage and track all your goals in one place.'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <select
            className={`${styles.sortSelect} ${styles.sortSelectMobile}`}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="progress-high">Most progress</option>
            <option value="progress-low">Least progress</option>
            <option value="name">A → Z</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> New Goal
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'All', label: 'All Goals', count: categoryGoals.length, color: 'var(--accent)' },
          { key: 'On Track', label: 'On Track', count: onTrack.filter(g => g.progress < 100).length, color: '#3ecf8e' },
          { key: 'At Risk', label: 'At Risk', count: atRisk.length, color: '#f0a844' },
          { key: 'Completed', label: 'Completed', count: completed.length, color: '#3b82fe' },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            style={tab === t.key ? { '--tab-color': t.color } : {}}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className={styles.tabCount} style={{ background: tab === t.key ? t.color + '25' : 'var(--surface-2)', color: tab === t.key ? t.color : 'var(--text-muted)' }}>
              {t.count}
            </span>
          </button>
        ))}

        <div className={styles.sortWrapDesktop} style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="progress-high">Most progress</option>
            <option value="progress-low">Least progress</option>
            <option value="name">A → Z</option>
          </select>
        </div>
      </div>

      <div className={`${styles.mainLayout} ${selectedGoal ? styles.withPanel : ''}`}>
        {/* Goals list */}
        <div className={styles.goalsList}>
          {loading ? (
            <p className={styles.empty}>Loading…</p>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <TrendingUp size={40} color="rgba(255,255,255,0.15)" />
              <p>{goals.length === 0 ? 'No goals yet. Add your first one.' : 'No goals match this filter.'}</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
                Add a goal
              </button>
            </div>
          ) : grouped ? (
            grouped.map(group => (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupDot} style={{ background: group.dot }} />
                  <span className={styles.groupLabel}>{group.label}</span>
                  <span className={styles.groupCount}>{group.items.length}</span>
                </div>
                <div className={styles.groupItems}>
                  {group.items.map(goal => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      color={CATEGORY_COLORS[goal.category] || '#aaa'}
                      isSelected={selectedGoal?.id === goal.id}
                      onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.groupItems}>
              {filtered.map(goal => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  color={CATEGORY_COLORS[goal.category] || '#aaa'}
                  isSelected={selectedGoal?.id === goal.id}
                  onClick={() => setSelectedGoal(selectedGoal?.id === goal.id ? null : goal)}
                />
              ))}
            </div>
          )}

          {/* Add new row */}
          {goals.length > 0 && (
            <button className={styles.addRow} onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add New Goal
            </button>
          )}
        </div>

        {/* Detail panel */}
        {selectedGoal && (
          <GoalDetailPanel
            goal={selectedGoal}
            color={selectedColor}
            onClose={() => setSelectedGoal(null)}
          />
        )}
      </div>

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onAdd={async data => { await addGoal(data); setShowAdd(false) }}
          categories={Object.keys(CATEGORY_COLORS)}
        />
      )}
    </div>
  )
}
