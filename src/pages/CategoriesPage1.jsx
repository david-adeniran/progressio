import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import { getCategoryLevel } from '../lib/xp'
import {
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf, Zap, ChevronRight
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

export default function CategoriesPage() {
  const { user } = useAuth()
  const { goals } = useGoals(user?.uid)
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
        <p className={styles.sub}>Your goals organised by life area</p>
      </div>

      <div className={styles.grid}>
        {Object.keys(CATEGORY_COLORS).map(cat => {
          const color = CATEGORY_COLORS[cat]
          const Icon = ICONS[cat]
          const catGoals = goals.filter(g => g.category === cat)
          const completed = catGoals.filter(g => g.progress >= 100).length
          const active = catGoals.filter(g => g.progress < 100).length
          const avg = catGoals.length
            ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length)
            : 0
          const { title: catTitle } = getCategoryLevel(goals, cat)
          const r = 30, circ = 2 * Math.PI * r, dash = (avg / 100) * circ

          return (
            <div
              key={cat}
              className={styles.card}
              style={{ '--cat-color': color }}
              onClick={() => navigate(`/categories/${cat.toLowerCase()}`)}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconWrap} style={{ background: color + '22' }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <div className={styles.ring}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                    <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
                      strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
                  </svg>
                  <span className={styles.ringPct} style={{ color }}>{avg}%</span>
                </div>
              </div>

              <h3 className={styles.catName}>{cat}</h3>
              <p className={styles.catLevel} style={{ color }}>{catTitle}</p>

              <div className={styles.catStats}>
                <div className={styles.catStat}>
                  <span className={styles.catStatVal}>{catGoals.length}</span>
                  <span className={styles.catStatLabel}>Total</span>
                </div>
                <div className={styles.catStat}>
                  <span className={styles.catStatVal} style={{ color: 'var(--success)' }}>{completed}</span>
                  <span className={styles.catStatLabel}>Done</span>
                </div>
                <div className={styles.catStat}>
                  <span className={styles.catStatVal} style={{ color }}>{active}</span>
                  <span className={styles.catStatLabel}>Active</span>
                </div>
              </div>

              {catGoals.length > 0 && (
                <div className={styles.goalList}>
                  {catGoals.slice(0, 3).map(g => (
                    <div key={g.id} className={styles.goalItem}
                      onClick={e => { e.stopPropagation(); navigate(`/goal/${g.id}`) }}>
                      <span className={styles.goalItemTitle}>{g.title}</span>
                      <span className={styles.goalItemPct} style={{ color }}>{g.progress || 0}%</span>
                    </div>
                  ))}
                  {catGoals.length > 3 && (
                    <div className={styles.moreGoals}>+{catGoals.length - 3} more</div>
                  )}
                </div>
              )}

              {catGoals.length === 0 && (
                <p className={styles.noGoals}>No goals yet in this category</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
