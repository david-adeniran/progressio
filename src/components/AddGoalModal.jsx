import { useState } from 'react'
import { Calendar, X, ChevronRight, Target, TrendingUp, Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf, Zap } from 'lucide-react'
import styles from './AddGoalModal.module.css'

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']

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

// ─── UNIT CATEGORIES ────────────────────────────────────────────────────────
export const UNIT_CATEGORIES = [
  {
    label: 'Currency',
    units: [
      { label: 'Nigerian Naira (₦)', symbol: '₦', code: 'NGN' },
      { label: 'US Dollar ($)', symbol: '$', code: 'USD' },
      { label: 'Euro (€)', symbol: '€', code: 'EUR' },
      { label: 'British Pound (£)', symbol: '£', code: 'GBP' },
      { label: 'Afghan Afghani (AFN)', symbol: '؋', code: 'AFN' },
      { label: 'Albanian Lek (ALL)', symbol: 'L', code: 'ALL' },
      { label: 'Algerian Dinar (DZD)', symbol: 'دج', code: 'DZD' },
      { label: 'Argentine Peso (ARS)', symbol: '$', code: 'ARS' },
      { label: 'Australian Dollar (AUD)', symbol: 'A$', code: 'AUD' },
      { label: 'Bangladeshi Taka (BDT)', symbol: '৳', code: 'BDT' },
      { label: 'Brazilian Real (BRL)', symbol: 'R$', code: 'BRL' },
      { label: 'Canadian Dollar (CAD)', symbol: 'CA$', code: 'CAD' },
      { label: 'Chilean Peso (CLP)', symbol: '$', code: 'CLP' },
      { label: 'Chinese Yuan (CNY)', symbol: '¥', code: 'CNY' },
      { label: 'Colombian Peso (COP)', symbol: '$', code: 'COP' },
      { label: 'Czech Koruna (CZK)', symbol: 'Kč', code: 'CZK' },
      { label: 'Danish Krone (DKK)', symbol: 'kr', code: 'DKK' },
      { label: 'Egyptian Pound (EGP)', symbol: '£', code: 'EGP' },
      { label: 'Ethiopian Birr (ETB)', symbol: 'Br', code: 'ETB' },
      { label: 'Ghanaian Cedi (GHS)', symbol: '₵', code: 'GHS' },
      { label: 'Hong Kong Dollar (HKD)', symbol: 'HK$', code: 'HKD' },
      { label: 'Hungarian Forint (HUF)', symbol: 'Ft', code: 'HUF' },
      { label: 'Indian Rupee (INR)', symbol: '₹', code: 'INR' },
      { label: 'Indonesian Rupiah (IDR)', symbol: 'Rp', code: 'IDR' },
      { label: 'Israeli New Shekel (ILS)', symbol: '₪', code: 'ILS' },
      { label: 'Japanese Yen (JPY)', symbol: '¥', code: 'JPY' },
      { label: 'Kenyan Shilling (KES)', symbol: 'KSh', code: 'KES' },
      { label: 'Kuwaiti Dinar (KWD)', symbol: 'KD', code: 'KWD' },
      { label: 'Malaysian Ringgit (MYR)', symbol: 'RM', code: 'MYR' },
      { label: 'Mexican Peso (MXN)', symbol: 'MX$', code: 'MXN' },
      { label: 'Moroccan Dirham (MAD)', symbol: 'MAD', code: 'MAD' },
      { label: 'New Zealand Dollar (NZD)', symbol: 'NZ$', code: 'NZD' },
      { label: 'Norwegian Krone (NOK)', symbol: 'kr', code: 'NOK' },
      { label: 'Pakistani Rupee (PKR)', symbol: '₨', code: 'PKR' },
      { label: 'Philippine Peso (PHP)', symbol: '₱', code: 'PHP' },
      { label: 'Polish Zloty (PLN)', symbol: 'zł', code: 'PLN' },
      { label: 'Romanian Leu (RON)', symbol: 'lei', code: 'RON' },
      { label: 'Russian Ruble (RUB)', symbol: '₽', code: 'RUB' },
      { label: 'Saudi Riyal (SAR)', symbol: '﷼', code: 'SAR' },
      { label: 'Singapore Dollar (SGD)', symbol: 'S$', code: 'SGD' },
      { label: 'South African Rand (ZAR)', symbol: 'R', code: 'ZAR' },
      { label: 'South Korean Won (KRW)', symbol: '₩', code: 'KRW' },
      { label: 'Swedish Krona (SEK)', symbol: 'kr', code: 'SEK' },
      { label: 'Swiss Franc (CHF)', symbol: 'Fr', code: 'CHF' },
      { label: 'Tanzanian Shilling (TZS)', symbol: 'Sh', code: 'TZS' },
      { label: 'Thai Baht (THB)', symbol: '฿', code: 'THB' },
      { label: 'Turkish Lira (TRY)', symbol: '₺', code: 'TRY' },
      { label: 'Ugandan Shilling (UGX)', symbol: 'USh', code: 'UGX' },
      { label: 'Ukrainian Hryvnia (UAH)', symbol: '₴', code: 'UAH' },
      { label: 'UAE Dirham (AED)', symbol: 'د.إ', code: 'AED' },
      { label: 'Vietnamese Dong (VND)', symbol: '₫', code: 'VND' },
      { label: 'West African CFA Franc (XOF)', symbol: 'Fr', code: 'XOF' },
      { label: 'Zambian Kwacha (ZMW)', symbol: 'ZK', code: 'ZMW' },
    ],
  },
  {
    label: 'Distance',
    units: [
      { label: 'Kilometres (km)', symbol: 'km' },
      { label: 'Metres (m)', symbol: 'm' },
      { label: 'Miles (mi)', symbol: 'mi' },
      { label: 'Steps', symbol: 'steps' },
    ],
  },
  {
    label: 'Weight',
    units: [
      { label: 'Kilograms (kg)', symbol: 'kg' },
      { label: 'Grams (g)', symbol: 'g' },
      { label: 'Pounds (lbs)', symbol: 'lbs' },
      { label: 'Ounces (oz)', symbol: 'oz' },
      { label: 'Stone (st)', symbol: 'st' },
    ],
  },
  {
    label: 'Books Read',
    units: [
      { label: 'Books', symbol: 'books' },
      { label: 'Chapters', symbol: 'chapters' },
      { label: 'Pages', symbol: 'pages' },
    ],
  },
  {
    label: 'Time',
    units: [
      { label: 'Hours (hrs)', symbol: 'hrs' },
      { label: 'Minutes (min)', symbol: 'min' },
      { label: 'Days', symbol: 'days' },
      { label: 'Weeks', symbol: 'weeks' },
    ],
  },
  {
    label: 'Fitness & Health',
    units: [
      { label: 'Calories (kcal)', symbol: 'kcal' },
      { label: 'Reps', symbol: 'reps' },
      { label: 'Sets', symbol: 'sets' },
      { label: 'Workouts', symbol: 'workouts' },
      { label: 'Litres of water (L)', symbol: 'L' },
      { label: 'Hours of sleep (hrs)', symbol: 'hrs sleep' },
    ],
  },
  {
    label: 'Productivity',
    units: [
      { label: 'Tasks completed', symbol: 'tasks' },
      { label: 'Projects', symbol: 'projects' },
      { label: 'Commits (code)', symbol: 'commits' },
      { label: 'Words written', symbol: 'words' },
      { label: 'Pomodoros', symbol: 'pomodoros' },
    ],
  },
  {
    label: 'Learning',
    units: [
      { label: 'Courses', symbol: 'courses' },
      { label: 'Lessons', symbol: 'lessons' },
      { label: 'Certifications', symbol: 'certs' },
      { label: 'Practice sessions', symbol: 'sessions' },
    ],
  },
  {
    label: 'Travel',
    units: [
      { label: 'Flights taken', symbol: 'flights' },
      { label: 'Countries visited', symbol: 'countries' },
      { label: 'Cities visited', symbol: 'cities' },
      { label: 'Distance travelled (km)', symbol: 'km' },
    ],
  },
  {
    label: 'Social & Habits',
    units: [
      { label: 'Times/occurrences', symbol: 'times' },
      { label: 'People met', symbol: 'people' },
      { label: 'Posts published', symbol: 'posts' },
      { label: 'Calls made', symbol: 'calls' },
    ],
  },
  { label: 'Custom', units: [] },
]

export default function AddGoalModal({ onClose, onAdd, categories }) {
  const [step, setStep] = useState(1) // 1 = basics, 2 = tracking, 3 = schedule
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [trackingType, setTrackingType] = useState('numeric')
  const [targetAmount, setTargetAmount] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [loading, setLoading] = useState(false)
  const [hasDateRange, setHasDateRange] = useState(true)
  const todayStr = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState('')
  const [unitCategory, setUnitCategory] = useState(UNIT_CATEGORIES[0].label)
  const [selectedUnit, setSelectedUnit] = useState(UNIT_CATEGORIES[0].units[0].symbol)
  const [customUnit, setCustomUnit] = useState('')

  const currentCat = UNIT_CATEGORIES.find(c => c.label === unitCategory) ?? null
  const isCustomUnitCat = unitCategory === 'Custom'
  const currentCatHasUnits = !isCustomUnitCat && currentCat && currentCat.units.length > 0
  const displayUnit = isCustomUnitCat ? customUnit : selectedUnit

  function handleUnitCategoryChange(catLabel) {
    const cat = UNIT_CATEGORIES.find(c => c.label === catLabel)
    const firstUnit = cat && cat.units.length > 0 ? cat.units[0].symbol : ''
    setUnitCategory(catLabel)
    setSelectedUnit(firstUnit)
    setCustomUnit('')
  }

  const step1Valid = title.trim()
  const step2Valid = trackingType === 'milestone' || (targetAmount && displayUnit.trim())
  const canSubmit = step1Valid && step2Valid && (!hasDateRange || (startDate && endDate))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    await onAdd({
      title: title.trim(),
      category,
      description: description.trim(),
      trackingType,
      targetAmount: trackingType === 'numeric' ? Number(targetAmount) : null,
      unit: displayUnit.trim(),
      unitCategory,
      frequency: trackingType === 'numeric' ? frequency : null,
      startDate: hasDateRange ? startDate : null,
      deadline: hasDateRange ? endDate : null,
    })
    setLoading(false)
  }

  const catColor = CATEGORY_COLORS[category] || 'var(--accent)'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header} style={{ '--cat-color': catColor }}>
          <div className={styles.headerInner}>
            <div className={styles.headerIcon} style={{ background: catColor + '22' }}>
              {(() => { const Icon = CATEGORY_ICONS[category] || Target; return <Icon size={20} color={catColor} strokeWidth={1.8} /> })()}
            </div>
            <div>
              <h2 className={styles.title}>New Goal</h2>
              <p className={styles.subtitle}>
                {step === 1 ? 'Name it and pick a category' : step === 2 ? 'Set up tracking' : 'Set your timeline'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step indicator */}
        <div className={styles.steps}>
          {['Basics', 'Tracking', 'Schedule'].map((s, i) => {
            const n = i + 1
            const active = step === n
            const done = step > n
            return (
              <div key={s} className={styles.stepItem}>
                <div
                  className={`${styles.stepDot} ${active ? styles.stepActive : ''} ${done ? styles.stepDone : ''}`}
                  onClick={() => done && setStep(n)}
                  style={active || done ? { borderColor: catColor, background: done ? catColor : 'transparent' } : {}}
                >
                  {done ? '✓' : n}
                </div>
                <span className={styles.stepLabel} style={active ? { color: catColor } : {}}>{s}</span>
                {i < 2 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} style={done ? { background: catColor } : {}} />}
              </div>
            )
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>

            {/* ── Step 1: Basics ── */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <label className={styles.label}>Goal title *</label>
                  <input
                    className={styles.input}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Save ₦500k for rent"
                    autoFocus
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Category</label>
                  <div className={styles.categoryGrid}>
                    {categories.map(cat => {
                      const color = CATEGORY_COLORS[cat] || '#aaa'
                      const selected = category === cat
                      return (
                        <button
                          key={cat} type="button"
                          className={`${styles.catBtn} ${selected ? styles.catBtnActive : ''}`}
                          onClick={() => setCategory(cat)}
                          style={selected ? { borderColor: color, background: color + '15', color } : {}}
                        >
                          {(() => { const Icon = CATEGORY_ICONS[cat] || Target; return <Icon size={18} color={selected ? color : 'var(--text-dim)'} strokeWidth={1.8} className={styles.catBtnIcon} /> })()}
                          <span className={styles.catBtnLabel}>{cat}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Description <span className={styles.optional}>(optional)</span></label>
                  <textarea
                    className={styles.textarea}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What does achieving this look like?"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: Tracking ── */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <label className={styles.label}>How do you want to track this?</label>
                  <div className={styles.trackingToggle}>
                    <button
                      type="button"
                      className={`${styles.trackBtn} ${trackingType === 'numeric' ? styles.trackBtnActive : ''}`}
                      onClick={() => setTrackingType('numeric')}
                      style={trackingType === 'numeric' ? { borderColor: catColor, background: catColor + '15' } : {}}
                    >
                      <TrendingUp size={20} color={trackingType === 'numeric' ? catColor : 'var(--text-dim)'} />
                      <span className={styles.trackBtnTitle} style={trackingType === 'numeric' ? { color: catColor } : {}}>Numeric</span>
                      <span className={styles.trackBtnSub}>Log amounts, auto % calculated</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.trackBtn} ${trackingType === 'milestone' ? styles.trackBtnActive : ''}`}
                      onClick={() => setTrackingType('milestone')}
                      style={trackingType === 'milestone' ? { borderColor: catColor, background: catColor + '15' } : {}}
                    >
                      <Target size={20} color={trackingType === 'milestone' ? catColor : 'var(--text-dim)'} />
                      <span className={styles.trackBtnTitle} style={trackingType === 'milestone' ? { color: catColor } : {}}>Milestone</span>
                      <span className={styles.trackBtnSub}>Set percentage manually</span>
                    </button>
                  </div>
                </div>

                {trackingType === 'numeric' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>Target amount *</label>
                      <input
                        className={styles.input}
                        type="number" min="1"
                        value={targetAmount}
                        onChange={e => setTargetAmount(e.target.value)}
                        placeholder="e.g. 100000"
                      />
                    </div>

                    <div className={styles.twoCol}>
                      <div className={styles.field}>
                        <label className={styles.label}>Unit category *</label>
                        <select className={styles.select} value={unitCategory} onChange={e => handleUnitCategoryChange(e.target.value)}>
                          {UNIT_CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                        </select>
                      </div>

                      {currentCatHasUnits && (
                        <div className={styles.field}>
                          <label className={styles.label}>Unit *</label>
                          <select className={styles.select} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                            {currentCat.units.map(u => <option key={u.symbol} value={u.symbol}>{u.label}</option>)}
                          </select>
                        </div>
                      )}

                      {isCustomUnitCat && (
                        <div className={styles.field}>
                          <label className={styles.label}>Custom unit *</label>
                          <input className={styles.input} value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="e.g. medals, clients" />
                        </div>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Tracking frequency</label>
                      <div className={styles.freqRow}>
                        {FREQUENCIES.map(f => (
                          <button
                            key={f} type="button"
                            className={`${styles.freqBtn} ${frequency === f ? styles.freqBtnActive : ''}`}
                            onClick={() => setFrequency(f)}
                            style={frequency === f ? { borderColor: catColor, background: catColor + '15', color: catColor } : {}}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <p className={styles.hint}>Frequency is locked after creation.</p>
                    </div>
                  </>
                )}

                {/* Preview */}
                {trackingType === 'numeric' && targetAmount && displayUnit && (
                  <div className={styles.preview} style={{ borderColor: catColor + '30', background: catColor + '08' }}>
                    <span className={styles.previewLabel}>Preview</span>
                    <span className={styles.previewVal} style={{ color: catColor }}>
                      {displayUnit}{Number(targetAmount).toLocaleString()} target · {frequency}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Schedule ── */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <div className={styles.dateToggleRow}>
                    <div>
                      <div className={styles.label}>Date range</div>
                      <div className={styles.hint} style={{ marginTop: 2 }}>Set a start and end date for this goal</div>
                    </div>
                    <label className={styles.toggleWrap}>
                      <input
                        type="checkbox"
                        checked={hasDateRange}
                        onChange={e => setHasDateRange(e.target.checked)}
                        className={styles.toggleInput}
                      />
                      <div className={`${styles.toggle} ${hasDateRange ? styles.toggleOn : ''}`}
                        style={hasDateRange ? { background: catColor } : {}}>
                        <div className={styles.toggleKnob} />
                      </div>
                    </label>
                  </div>
                </div>

                {hasDateRange && (
                  <div className={styles.twoCol}>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        <Calendar size={12} style={{ marginRight: 4 }} />
                        Start date *
                      </label>
                      <input className={styles.input} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>
                        <Calendar size={12} style={{ marginRight: 4 }} />
                        End date *
                      </label>
                      <input className={styles.input} type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                )}

                {/* Summary card */}
                <div className={styles.summary} style={{ borderColor: catColor + '30' }}>
                  <div className={styles.summaryTitle}>Goal summary</div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Name</span>
                    <span className={styles.summaryVal}>{title || '—'}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Category</span>
                    <span className={styles.summaryVal} style={{ color: catColor, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {(() => { const Icon = CATEGORY_ICONS[category] || Target; return <Icon size={13} color={catColor} strokeWidth={2} /> })()}
                      {category}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryKey}>Tracking</span>
                    <span className={styles.summaryVal}>{trackingType === 'numeric' ? `${displayUnit}${targetAmount} · ${frequency}` : 'Milestone'}</span>
                  </div>
                  {hasDateRange && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryKey}>Timeline</span>
                      <span className={styles.summaryVal}>{startDate} → {endDate || '?'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            {step > 1
              ? <button type="button" className={styles.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>
              : <button type="button" className={styles.backBtn} onClick={onClose}>Cancel</button>
            }
            {step < 3
              ? (
                <button
                  type="button"
                  className={styles.nextBtn}
                  style={{ background: catColor }}
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 ? !step1Valid : !step2Valid}
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  className={styles.nextBtn}
                  style={{ background: catColor }}
                  disabled={loading || !canSubmit}
                >
                  {loading ? 'Creating…' : 'Create goal'}
                </button>
              )
            }
          </div>
        </form>
      </div>
    </div>
  )
}
