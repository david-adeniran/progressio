import { Trash2 } from 'lucide-react'
import styles from './GoalCard.module.css'

function ProgressRing({ pct, color, size = 56 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize="11" fontFamily="var(--font-body)" fontWeight="600">
        {pct}%
      </text>
    </svg>
  )
}

export default function GoalCard({ goal, color, onClick, onDelete }) {
  const pct = Math.min(100, Math.round(goal.progress || 0))
  const isComplete = pct >= 100

  function handleDelete(e) {
    e.stopPropagation()
    if (confirm(`Delete "${goal.title}"? This can't be undone.`)) onDelete()
  }

  const startDate = goal.startDate ? new Date(goal.startDate + 'T00:00:00') : null
  const deadline = goal.deadline ? new Date(goal.deadline + 'T00:00:00') : null
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null

  const dateRangeStr = startDate && deadline
    ? `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : deadline
      ? `Due ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : null

  return (
    <div className={styles.card + (isComplete ? ' ' + styles.complete : '')} onClick={onClick}>
      <div className={styles.top}>
        <div>
          <span className={styles.cat} style={{ color, borderColor: color + '44', background: color + '18' }}>
            {goal.category}
          </span>
          <h3 className={styles.title}>{goal.title}</h3>
          {goal.description && <p className={styles.desc}>{goal.description}</p>}
        </div>
        <ProgressRing pct={pct} color={isComplete ? 'var(--success)' : color} />
      </div>

      {goal.frequency && (
        <p className={styles.target}>
          <span className={styles.targetLabel}>Frequency</span> {goal.frequency}
        </p>
      )}
      {goal.trackingType === 'numeric' ? (
        <p className={styles.target}>
          <span className={styles.targetLabel}>{goal.unitCategory || 'Amount'}</span>
          {' '}{goal.unit || ''}{Number(goal.currentAmount || 0).toLocaleString('en-NG')}
          {' '}<span style={{ color: 'var(--text-dim)' }}>/ {goal.unit || ''}{Number(goal.targetAmount || 0).toLocaleString('en-NG')}</span>
        </p>
      ) : null}

      {dateRangeStr && (
        <p className={styles.deadline} style={{
          color: daysLeft !== null && daysLeft < 7 && !isComplete ? 'var(--danger)' : 'var(--text-muted)'
        }}>
          {isComplete
            ? '✓ Completed'
            : daysLeft === null ? dateRangeStr
            : daysLeft < 0 ? `Overdue · ${dateRangeStr}`
            : daysLeft === 0 ? `Due today · ${dateRangeStr}`
            : `${daysLeft}d left · ${dateRangeStr}`
          }
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.logs}>{(goal.logs || []).length} update{(goal.logs || []).length !== 1 ? 's' : ''}</span>
        <button className={styles.del} onClick={handleDelete} title="Delete goal">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
