import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { UNIT_CATEGORIES } from '../components/AddGoalModal'
import { Calendar, CalendarOff } from 'lucide-react'
import styles from './GoalDetailPage.module.css'

const CATEGORY_COLORS = {
  Fitness: '#3ecf8e', Finance: '#7c6af7', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}

function fmt(n) {
  return Number(n).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Calendar helpers ─────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function CalendarView({ goal, color }) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

  // Build a map: 'YYYY-MM-DD' => array of log entries
  const logsByDay = useMemo(() => {
    const map = {}
    for (const log of (goal.logs || [])) {
      const d = new Date(log.date)
      const key = d.toISOString().split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(log)
    }
    return map
  }, [goal.logs])

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const isNumeric = goal.trackingType === 'numeric'
  const unit = goal.unit || ''

  return (
    <div className={styles.calendarSection}>
      <div className={styles.calHeader}>
        <button className={styles.calNav} onClick={prevMonth}>‹</button>
        <span className={styles.calTitle}>{MONTHS[calMonth]} {calYear}</span>
        <button className={styles.calNav} onClick={nextMonth}>›</button>
      </div>
      <div className={styles.calGrid}>
        {DAYS.map(d => (
          <div key={d} className={styles.calDayLabel}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={'e' + i} className={styles.calEmpty} />
          const key = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const logs = logsByDay[key] || []
          const hasLog = logs.length > 0
          const isToday = key === today.toISOString().split('T')[0]
          const totalAmt = logs.reduce((s, l) => s + (l.amount || 0), 0)
          return (
            <div
              key={key}
              className={styles.calDay}
              title={hasLog ? (isNumeric ? `+${unit}${fmt(totalAmt)}` : `${logs[logs.length-1]?.progress}%`) : ''}
              style={{
                background: hasLog ? color + '28' : undefined,
                border: isToday ? `1.5px solid ${color}` : undefined,
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: isToday ? color : hasLog ? color : 'var(--text-muted)', fontWeight: isToday || hasLog ? 600 : 400 }}>
                {day}
              </span>
              {hasLog && (
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: color, margin: '1px auto 0',
                }} />
              )}
            </div>
          )
        })}
      </div>
      <div className={styles.calLegend}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} /> Entry logged
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          {Object.keys(logsByDay).length} day{Object.keys(logsByDay).length !== 1 ? 's' : ''} logged
        </span>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function GoalDetailPage() {
  const { goalId } = useParams()
  const { user } = useAuth()
  const { goals, loading, logEntry, logMilestone, updateGoal, deleteGoal } = useGoals(user?.uid)
  const navigate = useNavigate()

  const goal = goals.find(g => g.id === goalId)

  const [amount, setAmount] = useState('')
  const [milestoneProgress, setMilestoneProgress] = useState('')
  const [note, setNote] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [logging, setLogging] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editUnitCategory, setEditUnitCategory] = useState('')
  const [editSelectedUnit, setEditSelectedUnit] = useState('')
  const [editCustomUnit, setEditCustomUnit] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editHasDateRange, setEditHasDateRange] = useState(true)

  if (loading) return <p className={styles.loading}>Loading…</p>
  if (!goal) return (
    <p className={styles.loading}>
      Goal not found.
      <button className="btn btn-ghost" style={{ marginLeft: '8px' }} onClick={() => navigate('/')}>Back</button>
    </p>
  )

  const color = CATEGORY_COLORS[goal.category] || '#aaa'
  const isNumeric = goal.trackingType === 'numeric'
  const pct = Math.min(100, Math.round(goal.progress || 0))
  const currentAmount = goal.currentAmount || 0
  const targetAmount = goal.targetAmount || 0
  const unit = goal.unit || ''
  const logs = [...(goal.logs || [])].reverse()
  const frequency = goal.frequency || ''

  const startDate = goal.startDate ? new Date(goal.startDate + 'T00:00:00') : null
  const deadline = goal.deadline ? new Date(goal.deadline + 'T00:00:00') : null
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null

  // Enforce frequency constraints on entry date
  function isDateAllowed(dateStr) {
    if (!dateStr) return true
    if (!frequency) return true
    const d = new Date(dateStr + 'T12:00:00')
    const ref = startDate || new Date()
    if (frequency === 'Weekly') {
      // same weekday as the start day (or any day is fine — we just validate one entry per week)
      return true // we'll enforce 1-per-period in logEntry
    }
    if (frequency === 'Monthly') return true
    return true
  }

  // Check if logging is allowed based on frequency and existing logs
  function canLogToday() {
    if (!frequency || !entryDate) return true
    const existing = (goal.logs || []).filter(l => {
      const ld = new Date(l.date)
      const ed = new Date(entryDate + 'T12:00:00')
      if (frequency === 'Daily') {
        return ld.toISOString().split('T')[0] === entryDate
      }
      if (frequency === 'Weekly') {
        // same ISO week
        const isoWeek = d => {
          const t = new Date(d); t.setHours(0,0,0,0)
          t.setDate(t.getDate() + 3 - (t.getDay() + 6) % 7)
          const w = new Date(t.getFullYear(), 0, 4)
          return 1 + Math.round(((t - w) / 86400000 - 3 + (w.getDay() + 6) % 7) / 7)
        }
        return isoWeek(ld) === isoWeek(ed) && ld.getFullYear() === ed.getFullYear()
      }
      if (frequency === 'Monthly') {
        return ld.getMonth() === ed.getMonth() && ld.getFullYear() === ed.getFullYear()
      }
      return false
    })
    return existing.length === 0
  }

  const alreadyLoggedThisPeriod = isNumeric && !canLogToday()

  function getPeriodLabel() {
    if (frequency === 'Daily') return 'today'
    if (frequency === 'Weekly') return 'this week'
    if (frequency === 'Monthly') return 'this month'
    return 'this period'
  }

  async function handleLog(e) {
    e.preventDefault()
    if (alreadyLoggedThisPeriod) return
    setLogging(true)
    if (isNumeric) {
      const a = Number(amount)
      if (!a || a <= 0) { setLogging(false); return }
      await logEntry(goalId, {
        amount: a,
        note: note.trim(),
        date: new Date(entryDate + 'T12:00:00').toISOString(),
      })
      setAmount('')
    } else {
      const p = Number(milestoneProgress)
      if (isNaN(p)) { setLogging(false); return }
      await logMilestone(goalId, { progress: p, note: note.trim() })
      setMilestoneProgress('')
    }
    setNote('')
    setLogging(false)
  }

  function startEdit() {
    setEditTitle(goal.title)
    setEditDesc(goal.description || '')
    setEditTarget(goal.targetAmount || '')
    setEditUnitCategory(goal.unitCategory || 'Custom')
    setEditSelectedUnit(goal.unit || '')
    setEditCustomUnit(goal.unitCategory === 'Custom' ? (goal.unit || '') : '')
    setEditStartDate(goal.startDate || '')
    setEditEndDate(goal.deadline || '')
    setEditHasDateRange(!!(goal.startDate || goal.deadline))
    setEditing(true)
  }

  function getEditDisplayUnit() {
    return editUnitCategory === 'Custom' ? editCustomUnit : editSelectedUnit
  }

  function handleEditUnitCatChange(catLabel) {
    setEditUnitCategory(catLabel)
    const cat = UNIT_CATEGORIES.find(c => c.label === catLabel)
    if (cat && cat.units.length > 0) setEditSelectedUnit(cat.units[0].symbol)
    else setEditSelectedUnit('')
    setEditCustomUnit('')
  }

  async function saveEdit() {
    await updateGoal(goalId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      targetAmount: isNumeric ? (Number(editTarget) || targetAmount) : null,
      unit: getEditDisplayUnit().trim(),
      unitCategory: editUnitCategory,
      startDate: editHasDateRange ? editStartDate : null,
      deadline: editHasDateRange ? editEndDate : null,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${goal.title}"? This can't be undone.`)) return
    await deleteGoal(goalId)
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <button className="btn btn-ghost" style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }} onClick={() => navigate('/')}>
        ← Back to goals
      </button>

      {/* Header / Edit */}
      {editing ? (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Title</label>
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} />
          </div>
          {isNumeric && (
            <>
              <div className="form-group">
                <label>Target amount</label>
                <input type="number" value={editTarget} onChange={e => setEditTarget(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Unit category</label>
                <select value={editUnitCategory} onChange={e => handleEditUnitCatChange(e.target.value)}>
                  {UNIT_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>
              {editUnitCategory !== 'Custom' && (() => {
                const cat = UNIT_CATEGORIES.find(c => c.label === editUnitCategory)
                return cat && cat.units.length > 0 ? (
                  <div className="form-group">
                    <label>Unit</label>
                    <select value={editSelectedUnit} onChange={e => setEditSelectedUnit(e.target.value)}>
                      {cat.units.map(u => <option key={u.symbol} value={u.symbol}>{u.label}</option>)}
                    </select>
                  </div>
                ) : null
              })()}
              {editUnitCategory === 'Custom' && (
                <div className="form-group">
                  <label>Custom unit</label>
                  <input value={editCustomUnit} onChange={e => setEditCustomUnit(e.target.value)} placeholder="e.g. medals, clients" />
                </div>
              )}
              {/* Frequency is READ-ONLY in edit */}
              <div className="form-group">
                <label>Tracking frequency</label>
                <div style={{
                  padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  fontSize: '0.85rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span>{goal.frequency}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>🔒 Locked</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Frequency cannot be changed after creation.
                </p>
              </div>
            </>
          )}
          {/* Date range in edit */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Date range</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={!editHasDateRange} onChange={e => setEditHasDateRange(!e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }} />
                No set dates
              </label>
            </div>
            {editHasDateRange && (
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Start date</label>
                  <input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>End date</label>
                  <input type="date" value={editEndDate} min={editStartDate} onChange={e => setEditEndDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}>Save changes</button>
          </div>
        </div>
      ) : (
        <div className={styles.header}>
          <div>
            <span className={styles.cat} style={{ color, borderColor: color + '44', background: color + '18' }}>{goal.category}</span>
            <h1 className={styles.title}>{goal.title}</h1>
            {goal.description && <p className={styles.desc}>{goal.description}</p>}
            <div className={styles.meta}>
              {goal.frequency && <span className={styles.badge}>{goal.frequency} tracking</span>}
              {isNumeric ? <span className={styles.badge}>Numeric</span> : <span className={styles.badge}>Milestone</span>}
              {goal.unitCategory && goal.unitCategory !== 'Custom' && (
                <span className={styles.badge}>{goal.unitCategory}</span>
              )}
              {startDate && deadline && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' → '}
                  {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {deadline && daysLeft !== null && (
                <span style={{ fontSize: '0.8rem', color: daysLeft < 7 && pct < 100 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {pct >= 100 ? '✓ Completed' : daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={startEdit}>Edit</button>
            <button className="btn btn-danger" style={{ fontSize: '0.8rem' }} onClick={handleDelete}>Delete</button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressTop}>
          <span className={styles.progressLabel}>Overall progress</span>
          <span className={styles.progressPct} style={{ color: pct >= 100 ? 'var(--success)' : color }}>{pct}%</span>
        </div>
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : color }} />
        </div>
        {isNumeric && (
          <div className={styles.amountRow}>
            <span className={styles.amountCurrent} style={{ color }}>{unit}{fmt(currentAmount)}</span>
            <span className={styles.amountSep}>/</span>
            <span className={styles.amountTarget}>{unit}{fmt(targetAmount)}</span>
            <span className={styles.amountRemaining}>· {unit}{fmt(Math.max(0, targetAmount - currentAmount))} to go</span>
          </div>
        )}
        {pct >= 100 && <p className={styles.complete}>Goal complete! 🎉</p>}

        {/* Milestone markers */}
        {isNumeric && (
          <div className={styles.milestones}>
            {[25, 50, 75, 100].map(m => {
              const reached = pct >= m
              return (
                <div key={m} className={`${styles.milestone} ${reached ? styles.milestoneReached : ''}`}>
                  <div className={styles.milestoneDot} style={{ background: reached ? color : 'var(--surface-3)', borderColor: reached ? color : 'var(--border)' }}>
                    {reached ? '✓' : ''}
                  </div>
                  <span className={styles.milestoneLabel} style={{ color: reached ? color : 'var(--text-dim)' }}>
                    {m === 100 ? '🏁' : `${m}%`}
                  </span>
                  <span className={styles.milestoneAmt} style={{ color: reached ? 'var(--text-muted)' : 'var(--text-dim)' }}>
                    {unit}{fmt(Math.round(targetAmount * m / 100))}
                  </span>
                </div>
              )
            })}
            <div className={styles.milestoneLine} />
          </div>
        )}

        {/* XP earned */}
        <div className={styles.xpEarned}>
          <span className={styles.xpEarnedLabel}>XP earned from this goal</span>
          <span className={styles.xpEarnedVal} style={{ color: 'var(--gold)' }}>
            ⚡ {(goal.logs || []).length * 10 + (pct >= 100 ? 100 : 0) + Math.floor(pct / 10) * 5} XP
          </span>
        </div>
      </div>

      {/* Calendar toggle */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowCalendar(v => !v)}
        >
          {showCalendar ? <CalendarOff size={14} /> : <Calendar size={14} />}
          {showCalendar ? 'Hide calendar' : 'Show calendar'}
        </button>
        {showCalendar && <CalendarView goal={goal} color={color} />}
      </div>

      {/* Log form */}
      <div className={styles.logSection}>
        <h2 className={styles.sectionTitle}>Log an entry</h2>
        {alreadyLoggedThisPeriod && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            fontSize: '0.83rem', color: 'var(--accent)', marginBottom: '1rem',
          }}>
            ✓ You've already logged {getPeriodLabel()} for this {frequency?.toLowerCase()} goal. Come back {frequency === 'Daily' ? 'tomorrow' : frequency === 'Weekly' ? 'next week' : 'next month'}.
          </div>
        )}
        <form onSubmit={handleLog} className={styles.logForm}>
          {isNumeric ? (
            <>
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Amount {unit ? `(${unit})` : ''}</label>
                  <input
                    type="number" min="0.01" step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 2000"
                    required
                    disabled={alreadyLoggedThisPeriod}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    disabled={alreadyLoggedThisPeriod}
                  />
                </div>
              </div>
              <div className={styles.calcPreview}>
                {amount && targetAmount > 0 ? (
                  <>
                    <span>This entry: <strong style={{ color }}>{unit}{fmt(Number(amount))}</strong></span>
                    <span>Running total after: <strong style={{ color }}>{unit}{fmt(currentAmount + Number(amount))}</strong> = <strong style={{ color }}>{Math.min(100, Math.round(((currentAmount + Number(amount)) / targetAmount) * 100))}%</strong></span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>Enter an amount to see the updated percentage</span>
                )}
              </div>
            </>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Progress % (current: {pct}%)</label>
              <input
                type="number" min="0" max="100"
                value={milestoneProgress}
                onChange={e => setMilestoneProgress(e.target.value)}
                placeholder={`${pct}`}
              />
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Weekly savings deposit" disabled={alreadyLoggedThisPeriod} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={logging || alreadyLoggedThisPeriod || (isNumeric && !amount)} style={{ alignSelf: 'flex-end' }}>
            {logging ? 'Saving…' : 'Log entry'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Entry history ({logs.length})</h2>
        {logs.length === 0 ? (
          <p className={styles.noLogs}>No entries yet — log your first one above.</p>
        ) : (
          <div className={styles.timeline}>
            {logs.map((log, i) => (
              <div key={i} className={styles.logItem}>
                <div className={styles.logDot} style={{ background: color }} />
                <div className={styles.logContent}>
                  <div className={styles.logMeta}>
                    <span className={styles.logDate}>{formatDate(log.date)}</span>
                    {isNumeric ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+{unit}{fmt(log.amount)}</span>
                        <span className={styles.logPct} style={{ color }}>→ {log.progress}%</span>
                      </div>
                    ) : (
                      <span className={styles.logPct} style={{ color }}>{log.progress}%</span>
                    )}
                  </div>
                  {isNumeric && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Running total: {unit}{fmt(log.runningTotal)}
                    </p>
                  )}
                  {log.note && <p className={styles.logNote}>{log.note}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
