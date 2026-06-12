import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../hooks/useGoals'
import GoalCard from '../components/GoalCard'
import AddGoalModal from '../components/AddGoalModal'
import { Search, Plus, SlidersHorizontal, Target } from 'lucide-react'
import styles from './GoalsPage.module.css'

const CATEGORY_COLORS = {
  Finance: '#7c6af7', Fitness: '#3ecf8e', Learning: '#f0a844',
  Career: '#4ab8f5', Health: '#f25a95', Travel: '#5de0e6',
  Personal: '#b8a0f7', Custom: '#aaa',
}

export default function GoalsPage() {
  const { user } = useAuth()
  const { goals, loading, addGoal, deleteGoal } = useGoals(user?.uid)
  const navigate = useNavigate()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('newest')

  const categories = ['All', ...Object.keys(CATEGORY_COLORS)]

  let filtered = goals.filter(g => {
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || g.category === category
    const matchStatus =
      status === 'All' ? true :
      status === 'Active' ? g.progress < 100 :
      status === 'Completed' ? g.progress >= 100 : true
    return matchSearch && matchCat && matchStatus
  })

  filtered = [...filtered].sort((a, b) => {
    if (sort === 'newest') return 0 // already ordered by createdAt desc from Firestore
    if (sort === 'progress-high') return (b.progress || 0) - (a.progress || 0)
    if (sort === 'progress-low') return (a.progress || 0) - (b.progress || 0)
    if (sort === 'name') return a.title.localeCompare(b.title)
    return 0
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Goals</h1>
          <p className={styles.sub}>{goals.length} total · {goals.filter(g => g.progress >= 100).length} completed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* Search + filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search goals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
          <select className={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="progress-high">Most progress</option>
            <option value="progress-low">Least progress</option>
            <option value="name">A → Z</option>
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className={styles.catPills}>
        {categories.map(cat => (
          <button
            key={cat}
            className={`${styles.pill} ${category === cat ? styles.pillActive : ''}`}
            onClick={() => setCategory(cat)}
            style={category === cat && cat !== 'All' ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat], background: CATEGORY_COLORS[cat] + '18' } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Target size={44} color="var(--text-dim)" />
          <p>{goals.length === 0 ? 'No goals yet. Add your first one.' : 'No goals match your filters.'}</p>
          {goals.length === 0 && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
              Add your first goal
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              color={CATEGORY_COLORS[goal.category] || '#aaa'}
              onClick={() => navigate(`/goal/${goal.id}`)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      )}

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
