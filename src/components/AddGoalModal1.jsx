import { useState, useEffect, useRef } from 'react'
import { Calendar, X, ChevronRight, Target, TrendingUp, Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane, Leaf, Zap, Check } from 'lucide-react'
import styles from './AddGoalModal.module.css'

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']
const TITLE_MAX = 60

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

// Smart placeholders per category
const CATEGORY_PLACEHOLDERS = {
  Finance: 'e.g. Save ₦500k for rent',
  Fitness: 'e.g. Run 100km this month',
  Learning: 'e.g. Complete React course',
  Career: 'e.g. Land a new role by Q3',
  Health: 'e.g. Lose 10kg by December',
  Travel: 'e.g. Visit 5 countries this year',
  Personal: 'e.g. Read 24 books this year',
  Custom: 'e.g. Name your goal',
}

// Smart unit category suggestions per goal category
const CATEGORY_UNIT_SUGGESTIONS = {
  Finance: 'Currency',
  Fitness: 'Distance',
  Learning: 'Learning',
  Career: 'Productivity',
  Health: 'Fitness & Health',
  Travel: 'Travel',
  Personal: 'Time',
  Custom: 'Custom',
}

// Quick date presets
const DATE_PRESETS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
]

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
  { label: 'Distance', units: [{ label: 'Kilometres (km)', symbol: 'km' }, { label: 'Metres (m)', symbol: 'm' }, { label: 'Miles (mi)', symbol: 'mi' }, { label: 'Steps', symbol: 'steps' }] },
  { label: 'Weight', units: [{ label: 'Kilograms (kg)', symbol: 'kg' }, { label: 'Grams (g)', symbol: 'g' }, { label: 'Pounds (lbs)', symbol: 'lbs' }, { label: 'Ounces (oz)', symbol: 'oz' }, { label: 'Stone (st)', symbol: 'st' }] },
  { label: 'Books Read', units: [{ label: 'Books', symbol: 'books' }, { label: 'Chapters', symbol: 'chapters' }, { label: 'Pages', symbol: 'pages' }] },
  { label: 'Time', units: [{ label: 'Hours (hrs)', symbol: 'hrs' }, { label: 'Minutes (min)', symbol: 'min' }, { label: 'Days', symbol: 'days' }, { label: 'Weeks', symbol: 'weeks' }] },
  { label: 'Fitness & Health', units: [{ label: 'Calories (kcal)', symbol: 'kcal' }, { label: 'Reps', symbol: 'reps' }, { label: 'Sets', symbol: 'sets' }, { label: 'Workouts', symbol: 'workouts' }, { label: 'Litres of water (L)', symbol: 'L' }, { label: 'Hours of sleep (hrs)', symbol: 'hrs sleep' }] },
  { label: 'Productivity', units: [{ label: 'Tasks completed', symbol: 'tasks' }, { label: 'Projects', symbol: 'projects' }, { label: 'Commits (code)', symbol: 'commits' }, { label: 'Words written', symbol: 'words' }, { label: 'Pomodoros', symbol: 'pomodoros' }] },
  { label: 'Learning', units: [{ label: 'Courses', symbol: 'courses' }, { label: 'Lessons', symbol: 'lessons' }, { label: 'Certifications', symbol: 'certs' }, { label: 'Practice sessions', symbol: 'sessions' }] },
  { label: 'Travel', units: [{ label: 'Flights taken', symbol: 'flights' }, { label: 'Countries visited', symbol: 'countries' }, { label: 'Cities visited', symbol: 'cities' }, { label: 'Distance travelled (km)', symbol: 'km' }] },
  { label: 'Social & Habits', units: [{ label: 'Times/occurrences', symbol: 'times' }, { label: 'People met', symbol: 'people' }, { label: 'Posts published', symbol: 'posts' }, { label: 'Calls made', symbol: 'calls' }] },
  { label: 'Custom', units: [] },
]

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().split('T')[0]
}

function formatAmount(val) {
  const n = Number(String(val).replace(/,/g, ''))
  if (isNaN(n) || val === '') return ''
  return n.toLocaleString('en-US')
}

function parseAmount(val) {
  return String(val).replace(/,/g, '')
}

export default function AddGoalModal({ onClose, onAdd, categories }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [trackingType, setTrackingType] = useState('numeric')
  const [targetAmountRaw, setTargetAmountRaw] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [iconKey, setIconKey] = useState(0)
  const [hasDateRange, setHasDateRange] = useState(true)
  const todayStr = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState('')
  const [unitCategory, setUnitCategory] = useState(UNIT_CATEGORIES[0].label)
  const [selectedUnit, setSelectedUnit] = useState(UNIT_CATEGORIES[0].units[0].symbol)
  const [customUnit, setCustomUnit] = useState('')
  const titleRef = useRef(null)

  const catColor = CATEGORY_COLORS[category] || 'var(--accent)'

  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
      if (step === 1 && step1Valid) { e.preventDefault(); setStep(2) }
      if (step === 2 && step2Valid) { e.preventDefault(); setStep(3) }
    }
  }
  const currentCat = UNIT_CATEGORIES.find(c => c.label === unitCategory) ?? null
  const isCustomUnitCat = unitCategory === 'Custom'
  const currentCatHasUnits = !isCustomUnitCat && currentCat && currentCat.units.length > 0
  const displayUnit = isCustomUnitCat ? customUnit : selectedUnit
  const targetAmount = parseAmount(targetAmountRaw)
  const formattedTarget = formatAmount(targetAmountRaw)

  // Auto-match unit category to goal category
  useEffect(() => {
    const suggested = CATEGORY_UNIT_SUGGESTIONS[category]
    if (suggested) {
      const cat = UNIT_CATEGORIES.find(c => c.label === suggested)
      if (cat) {
        setUnitCategory(cat.label)
        setSelectedUnit(cat.units[0]?.symbol || '')
        setCustomUnit('')
      }
    }
  }, [category])

  function handleUnitCategoryChange(catLabel) {
    const cat = UNIT_CATEGORIES.find(c => c.label === catLabel)
    setUnitCategory(catLabel)
    setSelectedUnit(cat?.units[0]?.symbol || '')
    setCustomUnit('')
  }

  function applyDatePreset(months) {
    setEndDate(addMonths(startDate || todayStr, months))
    setHasDateRange(true)
  }

  function handleTitleChange(e) {
    if (e.target.value.length <= TITLE_MAX) setTitle(e.target.value)
  }

  const titleValid = title.trim().length > 0
  const step1Valid = titleValid
  const step2Valid = trackingType === 'milestone' || (targetAmount && displayUnit.trim())
  const canSubmit = step1Valid && step2Valid && (!hasDateRange || (startDate && endDate))

  // Milestone preview
  const milestones = targetAmount > 0 ? [25, 50, 75, 100].map(pct => ({
    pct,
    value: Math.round((pct / 100) * Number(targetAmount)),
  })) : []

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
    setDone(true)
    setTimeout(() => onClose(), 1800)
  }

  // ── Done state ──
  if (done) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal} style={{ borderLeftColor: catColor }}>
          <div className={styles.doneState}>
            <div className={styles.doneIcon} style={{ background: catColor + '20', border: `1px solid ${catColor}40` }}>
              <Check size={28} color={catColor} strokeWidth={2.5} />
            </div>
            <div className={styles.doneTitle}>Goal created</div>
            <div className={styles.doneSub}>{title}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ borderLeftColor: catColor }}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <div key={iconKey} className={styles.headerIcon} style={{ color: catColor, animation: 'iconFade 0.15s ease' }}>
              {(() => { const Icon = CATEGORY_ICONS[category] || Target; return <Icon size={18} color={catColor} strokeWidth={1.8} /> })()}
            </div>
            <div>
              <h2 className={styles.title}>New Goal</h2>
              <p className={styles.subtitle}>
                {step === 1 ? `What are you working towards?` : step === 2 ? 'How will you measure it?' : 'When does this end?'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={15} /></button>
        </div>

        {/* Steps */}
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
                  style={active ? { borderColor: catColor, color: catColor } : done ? { background: catColor, borderColor: catColor, color: '#0a0a0a' } : {}}
                >
                  {done ? '✓' : n}
                </div>
                <span className={styles.stepLabel} style={active ? { color: catColor } : {}}>{s}</span>
                {i < 2 && <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} style={done ? { background: catColor } : {}} />}
              </div>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className={styles.body}>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Goal title *</label>
                    <span className={`${styles.charCount} ${title.length >= TITLE_MAX * 0.9 ? styles.charCountWarn : ''}`}>
                      {title.length}/{TITLE_MAX}
                    </span>
                  </div>
                  <input
                    ref={titleRef}
                    className={styles.input}
                    style={titleValid ? { borderColor: catColor } : {}}
                    value={title}
                    onChange={handleTitleChange}
                    placeholder={CATEGORY_PLACEHOLDERS[category]}
                    autoFocus
                    maxLength={TITLE_MAX}
                  />

                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Category</label>
                  <div className={styles.categoryGrid}>
                    {categories.map(cat => {
                      const color = CATEGORY_COLORS[cat] || '#aaa'
                      const selected = category === cat
                      const Icon = CATEGORY_ICONS[cat] || Target
                      return (
                        <button key={cat} type="button"
                          className={`${styles.catBtn} ${selected ? styles.catBtnActive : ''}`}
                          onClick={() => { setCategory(cat); setIconKey(k => k + 1) }}
                          style={selected ? { background: color + '18', color } : {}}
                        >
                          <Icon size={16} color={selected ? color : 'var(--text-dim)'} strokeWidth={1.8} className={styles.catBtnIcon} />
                          <span className={styles.catBtnLabel}>{cat}</span>
                          {selected && <div className={styles.catBtnDot} style={{ background: color }} />}
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
                    placeholder="Describe what success looks like for you"
                    rows={3}
                  />
                  {!description && title && (
                    <p className={styles.nudge}>Most people skip this and regret it later.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <label className={styles.label}>Tracking type</label>
                  <div className={styles.trackingToggle}>
                    {['numeric', 'milestone'].map(type => (
                      <button key={type} type="button"
                        className={`${styles.trackBtn} ${trackingType === type ? styles.trackBtnActive : ''}`}
                        onClick={() => setTrackingType(type)}
                        style={trackingType === type ? { color: catColor } : {}}
                      >
                        {type === 'numeric'
                          ? <TrendingUp size={18} color={trackingType === type ? catColor : 'var(--text-dim)'} />
                          : <Target size={18} color={trackingType === type ? catColor : 'var(--text-dim)'} />
                        }
                        <span className={styles.trackBtnTitle}>{type === 'numeric' ? 'Numeric' : 'Milestone'}</span>
                        <span className={styles.trackBtnSub}>{type === 'numeric' ? 'Log amounts, auto %' : 'Set % manually'}</span>
                        {trackingType === type && <div className={styles.trackActiveLine} style={{ background: catColor }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {trackingType === 'numeric' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.label}>Target amount *</label>
                      <div className={styles.amountWrap}>
                        {unitCategory === 'Currency' && !isCustomUnitCat && (
                          <span className={styles.unitPrefix}>{displayUnit}</span>
                        )}
                        <input
                          className={`${styles.input} ${unitCategory === 'Currency' && !isCustomUnitCat ? styles.inputWithPrefix : ''}`}
                          value={formattedTarget}
                          onChange={e => {
                            const raw = parseAmount(e.target.value)
                            if (raw.length <= 12) setTargetAmountRaw(raw)
                          }}
                          placeholder={unitCategory === 'Currency' ? '100,000' : 'Enter target'}
                          inputMode="numeric"
                        />
                      </div>
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
                          <input className={styles.input} value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="e.g. medals" />
                        </div>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Frequency</label>
                      <div className={styles.freqRow}>
                        {FREQUENCIES.map(f => (
                          <button key={f} type="button"
                            className={`${styles.freqBtn} ${frequency === f ? styles.freqBtnActive : ''}`}
                            onClick={() => setFrequency(f)}
                            style={frequency === f ? { color: catColor, borderBottomColor: catColor } : {}}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <p className={styles.hint}>This shapes how your streak is tracked — choose carefully.</p>
                    </div>

                    {/* Milestone checkpoint preview */}
                    {milestones.length > 0 && (
                      <div className={styles.milestonePreview}>
                        <div className={styles.milestonePreviewLabel}>You'll hit these along the way</div>
                        <div className={styles.milestoneTrack}>
                          {milestones.map((m, i) => (
                            <div key={m.pct} className={styles.milestonePoint}>
                              <div className={styles.milestoneDot} style={{ background: i === 3 ? catColor : 'var(--border-light)', border: `1px solid ${catColor}` }} />
                              <span className={styles.milestonePct} style={{ color: i === 3 ? catColor : 'var(--text-dim)' }}>{m.pct}%</span>
                              <span className={styles.milestoneVal}>{displayUnit}{m.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetAmount && displayUnit && (
                      <div className={styles.preview} style={{ borderColor: catColor + '40' }}>
                        <span className={styles.previewLabel}>You're tracking</span>
                        <span className={styles.previewVal} style={{ color: catColor }}>
                          {displayUnit}{Number(targetAmount).toLocaleString()} · {frequency}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.field}>
                  <div className={styles.dateToggleRow}>
                    <div>
                      <div className={styles.label}>Date range</div>
                      <div className={styles.hint}>Set a start and end date</div>
                    </div>
                    <label className={styles.toggleWrap}>
                      <input type="checkbox" checked={hasDateRange}
                        onChange={e => setHasDateRange(e.target.checked)} className={styles.toggleInput} />
                      <div className={`${styles.toggle} ${hasDateRange ? styles.toggleOn : ''}`}
                        style={hasDateRange ? { background: catColor } : {}}>
                        <div className={styles.toggleKnob} />
                      </div>
                    </label>
                  </div>
                </div>

                {hasDateRange && (
                  <>
                    {/* Quick date presets */}
                    <div className={styles.field}>
                      <label className={styles.label}>Quick set end date</label>
                      <div className={styles.presetRow}>
                        {DATE_PRESETS.map(p => (
                          <button key={p.label} type="button"
                            className={`${styles.presetBtn} ${endDate === addMonths(startDate || todayStr, p.months) ? styles.presetBtnActive : ''}`}
                            onClick={() => applyDatePreset(p.months)}
                            style={endDate === addMonths(startDate || todayStr, p.months) ? { color: catColor, borderColor: catColor } : {}}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.twoCol}>
                      <div className={styles.field}>
                        <label className={styles.label}>Start date *</label>
                        <input className={styles.input} type="date" value={startDate}
                          onChange={e => setStartDate(e.target.value)} />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>End date *</label>
                        <input className={styles.input} type="date" value={endDate}
                          min={startDate} onChange={e => setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Summary */}
                <div className={styles.summary} style={{ borderLeftColor: catColor }}>
                  <div className={styles.summaryTitle}>Summary</div>
                  {[
                    { key: 'Goal', val: title || '—' },
                    { key: 'Category', val: category, color: catColor },
                    { key: 'Tracking', val: trackingType === 'numeric' ? `${displayUnit}${Number(targetAmount).toLocaleString()} · ${frequency}` : 'Milestone' },
                    hasDateRange && endDate ? { key: 'Timeline', val: `${startDate} → ${endDate}` } : null,
                  ].filter(Boolean).map((row, i) => (
                    <div key={i} className={styles.summaryRow} style={{ animationDelay: `${i * 0.05}s` }}>
                      <span className={styles.summaryKey}>{row.key}</span>
                      <span className={styles.summaryVal} style={row.color ? { color: row.color } : {}}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            {step > 1
              ? <button type="button" className={styles.backBtn} onClick={() => setStep(s => s - 1)}>← Back</button>
              : <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            }
            {step < 3
              ? (
                <button type="button" className={styles.nextBtn} style={{ background: catColor }}
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 ? !step1Valid : !step2Valid}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button type="submit" className={styles.nextBtn} style={{ background: catColor }}
                  disabled={loading || !canSubmit}>
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
