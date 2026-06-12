import { Trash2 } from 'lucide-react'
import styles from './GoalCard.module.css'

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

  const dateStr = startDate && deadline
    ? `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : deadline
      ? `Due ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : null

  const isNumeric = goal.trackingType === 'numeric'
  const unit = goal.unit || ''

  return (
    <div
      className={`${styles.card} ${isComplete ? styles.complete : ''}`}
      style={{ '--card-color': color }}
      onClick={onClick}
    >
      <div className={styles.top}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className={styles.cat} style={{ color, borderColor: color + '44', background: color + '14' }}>
            {goal.category}
          </span>
          <h3 className={styles.title}>{goal.title}</h3>
          {goal.description && <p className={styles.desc}>{goal.description}</p>}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${pct}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #3ecf8e, #5de0b8)'
                : `linear-gradient(90deg, ${color}cc, ${color})`,
              boxShadow: `0 0 8px ${color}66`,
            }}
          />
        </div>
        <div className={styles.progressMeta}>
          {isNumeric ? (
            <>
              <span className={styles.progressAmt}>
                {unit}{Number(goal.currentAmount || 0).toLocaleString('en-NG')}
                {' '}<span style={{ opacity: 0.5 }}>/ {unit}{Number(goal.targetAmount || 0).toLocaleString('en-NG')}</span>
              </span>
              <span className={styles.progressPct} style={{ color: isComplete ? 'var(--success)' : color }}>{pct}%</span>
            </>
          ) : (
            <>
              <span className={styles.progressAmt}>Milestone</span>
              <span className={styles.progressPct} style={{ color: isComplete ? 'var(--success)' : color }}>{pct}%</span>
            </>
          )}
        </div>
      </div>

      {goal.frequency && (
        <p className={styles.target}>
          <span className={styles.targetLabel}>Freq</span>
          {goal.frequency}
          {isComplete && <span style={{ marginLeft: 'auto', color: 'var(--success)', fontSize: '0.68rem', fontWeight: 700 }}>✓ Done</span>}
        </p>
      )}

      {dateStr && (
        <p className={styles.deadline} style={{
          color: daysLeft !== null && daysLeft < 7 && !isComplete
            ? 'var(--danger)' : 'var(--text-dim)'
        }}>
          {isComplete ? '✓ Completed'
            : daysLeft === null ? dateStr
            : daysLeft < 0 ? `Overdue · ${dateStr}`
            : daysLeft === 0 ? `Due today · ${dateStr}`
            : `${daysLeft}d left · ${dateStr}`}
        </p>
      )}

      <div className={styles.footer}>
        <span className={styles.logs}>
          {(goal.logs || []).length} update{(goal.logs || []).length !== 1 ? 's' : ''}
        </span>
        <button className={styles.del} onClick={handleDelete} title="Delete goal">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
