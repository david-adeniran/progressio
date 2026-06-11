import { useState } from 'react'
import { Calendar } from 'lucide-react'
import styles from './Modal.module.css'

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']

// ─── UNIT CATEGORIES ────────────────────────────────────────────────────────
export const UNIT_CATEGORIES = [
  {
    label: 'Currency',
    units: [
      { label: 'Nigerian Naira (₦)', symbol: '₦', code: 'NGN' },
      { label: 'US Dollar ($)', symbol: '$', code: 'USD' },
      { label: 'Euro (€)', symbol: '€', code: 'EUR' },
      { label: 'British Pound (£)', symbol: '£', code: 'GBP' },
      // Rest of world currencies alphabetically
      { label: 'Afghan Afghani (AFN)', symbol: '؋', code: 'AFN' },
      { label: 'Albanian Lek (ALL)', symbol: 'L', code: 'ALL' },
      { label: 'Algerian Dinar (DZD)', symbol: 'دج', code: 'DZD' },
      { label: 'Argentine Peso (ARS)', symbol: '$', code: 'ARS' },
      { label: 'Armenian Dram (AMD)', symbol: '֏', code: 'AMD' },
      { label: 'Australian Dollar (AUD)', symbol: 'A$', code: 'AUD' },
      { label: 'Azerbaijani Manat (AZN)', symbol: '₼', code: 'AZN' },
      { label: 'Bahraini Dinar (BHD)', symbol: '.د.ب', code: 'BHD' },
      { label: 'Bangladeshi Taka (BDT)', symbol: '৳', code: 'BDT' },
      { label: 'Belarusian Ruble (BYN)', symbol: 'Br', code: 'BYN' },
      { label: 'Belize Dollar (BZD)', symbol: 'BZ$', code: 'BZD' },
      { label: 'Bolivian Boliviano (BOB)', symbol: 'Bs.', code: 'BOB' },
      { label: 'Brazilian Real (BRL)', symbol: 'R$', code: 'BRL' },
      { label: 'Brunei Dollar (BND)', symbol: 'B$', code: 'BND' },
      { label: 'Bulgarian Lev (BGN)', symbol: 'лв', code: 'BGN' },
      { label: 'Burundian Franc (BIF)', symbol: 'Fr', code: 'BIF' },
      { label: 'Cambodian Riel (KHR)', symbol: '៛', code: 'KHR' },
      { label: 'Canadian Dollar (CAD)', symbol: 'CA$', code: 'CAD' },
      { label: 'Cape Verdean Escudo (CVE)', symbol: '$', code: 'CVE' },
      { label: 'Central African CFA Franc (XAF)', symbol: 'Fr', code: 'XAF' },
      { label: 'Chilean Peso (CLP)', symbol: '$', code: 'CLP' },
      { label: 'Chinese Yuan (CNY)', symbol: '¥', code: 'CNY' },
      { label: 'Colombian Peso (COP)', symbol: '$', code: 'COP' },
      { label: 'Congolese Franc (CDF)', symbol: 'Fr', code: 'CDF' },
      { label: 'Costa Rican Colón (CRC)', symbol: '₡', code: 'CRC' },
      { label: 'Croatian Kuna (HRK)', symbol: 'kn', code: 'HRK' },
      { label: 'Cuban Peso (CUP)', symbol: '$', code: 'CUP' },
      { label: 'Czech Koruna (CZK)', symbol: 'Kč', code: 'CZK' },
      { label: 'Danish Krone (DKK)', symbol: 'kr', code: 'DKK' },
      { label: 'Dominican Peso (DOP)', symbol: 'RD$', code: 'DOP' },
      { label: 'Egyptian Pound (EGP)', symbol: '£', code: 'EGP' },
      { label: 'Ethiopian Birr (ETB)', symbol: 'Br', code: 'ETB' },
      { label: 'Fijian Dollar (FJD)', symbol: 'FJ$', code: 'FJD' },
      { label: 'Ghanaian Cedi (GHS)', symbol: '₵', code: 'GHS' },
      { label: 'Guatemalan Quetzal (GTQ)', symbol: 'Q', code: 'GTQ' },
      { label: 'Guinean Franc (GNF)', symbol: 'Fr', code: 'GNF' },
      { label: 'Haitian Gourde (HTG)', symbol: 'G', code: 'HTG' },
      { label: 'Honduran Lempira (HNL)', symbol: 'L', code: 'HNL' },
      { label: 'Hong Kong Dollar (HKD)', symbol: 'HK$', code: 'HKD' },
      { label: 'Hungarian Forint (HUF)', symbol: 'Ft', code: 'HUF' },
      { label: 'Icelandic Króna (ISK)', symbol: 'kr', code: 'ISK' },
      { label: 'Indian Rupee (INR)', symbol: '₹', code: 'INR' },
      { label: 'Indonesian Rupiah (IDR)', symbol: 'Rp', code: 'IDR' },
      { label: 'Iranian Rial (IRR)', symbol: '﷼', code: 'IRR' },
      { label: 'Iraqi Dinar (IQD)', symbol: 'ع.د', code: 'IQD' },
      { label: 'Israeli New Shekel (ILS)', symbol: '₪', code: 'ILS' },
      { label: 'Jamaican Dollar (JMD)', symbol: 'J$', code: 'JMD' },
      { label: 'Japanese Yen (JPY)', symbol: '¥', code: 'JPY' },
      { label: 'Jordanian Dinar (JOD)', symbol: 'JD', code: 'JOD' },
      { label: 'Kazakhstani Tenge (KZT)', symbol: '₸', code: 'KZT' },
      { label: 'Kenyan Shilling (KES)', symbol: 'KSh', code: 'KES' },
      { label: 'Kuwaiti Dinar (KWD)', symbol: 'KD', code: 'KWD' },
      { label: 'Kyrgyzstani Som (KGS)', symbol: 'с', code: 'KGS' },
      { label: 'Laotian Kip (LAK)', symbol: '₭', code: 'LAK' },
      { label: 'Lebanese Pound (LBP)', symbol: 'ل.ل', code: 'LBP' },
      { label: 'Libyan Dinar (LYD)', symbol: 'LD', code: 'LYD' },
      { label: 'Macanese Pataca (MOP)', symbol: 'MOP$', code: 'MOP' },
      { label: 'Malagasy Ariary (MGA)', symbol: 'Ar', code: 'MGA' },
      { label: 'Malawian Kwacha (MWK)', symbol: 'MK', code: 'MWK' },
      { label: 'Malaysian Ringgit (MYR)', symbol: 'RM', code: 'MYR' },
      { label: 'Maldivian Rufiyaa (MVR)', symbol: 'Rf', code: 'MVR' },
      { label: 'Mauritanian Ouguiya (MRU)', symbol: 'UM', code: 'MRU' },
      { label: 'Mauritian Rupee (MUR)', symbol: '₨', code: 'MUR' },
      { label: 'Mexican Peso (MXN)', symbol: 'MX$', code: 'MXN' },
      { label: 'Moldovan Leu (MDL)', symbol: 'L', code: 'MDL' },
      { label: 'Mongolian Tögrög (MNT)', symbol: '₮', code: 'MNT' },
      { label: 'Moroccan Dirham (MAD)', symbol: 'MAD', code: 'MAD' },
      { label: 'Mozambican Metical (MZN)', symbol: 'MT', code: 'MZN' },
      { label: 'Myanmar Kyat (MMK)', symbol: 'K', code: 'MMK' },
      { label: 'Namibian Dollar (NAD)', symbol: 'N$', code: 'NAD' },
      { label: 'Nepalese Rupee (NPR)', symbol: '₨', code: 'NPR' },
      { label: 'New Zealand Dollar (NZD)', symbol: 'NZ$', code: 'NZD' },
      { label: 'Nicaraguan Córdoba (NIO)', symbol: 'C$', code: 'NIO' },
      { label: 'Norwegian Krone (NOK)', symbol: 'kr', code: 'NOK' },
      { label: 'Omani Rial (OMR)', symbol: 'ر.ع.', code: 'OMR' },
      { label: 'Pakistani Rupee (PKR)', symbol: '₨', code: 'PKR' },
      { label: 'Panamanian Balboa (PAB)', symbol: 'B/.', code: 'PAB' },
      { label: 'Paraguayan Guaraní (PYG)', symbol: '₲', code: 'PYG' },
      { label: 'Peruvian Sol (PEN)', symbol: 'S/.', code: 'PEN' },
      { label: 'Philippine Peso (PHP)', symbol: '₱', code: 'PHP' },
      { label: 'Polish Zloty (PLN)', symbol: 'zł', code: 'PLN' },
      { label: 'Qatari Riyal (QAR)', symbol: 'QR', code: 'QAR' },
      { label: 'Romanian Leu (RON)', symbol: 'lei', code: 'RON' },
      { label: 'Russian Ruble (RUB)', symbol: '₽', code: 'RUB' },
      { label: 'Rwandan Franc (RWF)', symbol: 'Fr', code: 'RWF' },
      { label: 'Saudi Riyal (SAR)', symbol: '﷼', code: 'SAR' },
      { label: 'Serbian Dinar (RSD)', symbol: 'din', code: 'RSD' },
      { label: 'Sierra Leonean Leone (SLL)', symbol: 'Le', code: 'SLL' },
      { label: 'Singapore Dollar (SGD)', symbol: 'S$', code: 'SGD' },
      { label: 'Somali Shilling (SOS)', symbol: 'Sh', code: 'SOS' },
      { label: 'South African Rand (ZAR)', symbol: 'R', code: 'ZAR' },
      { label: 'South Korean Won (KRW)', symbol: '₩', code: 'KRW' },
      { label: 'Sri Lankan Rupee (LKR)', symbol: '₨', code: 'LKR' },
      { label: 'Sudanese Pound (SDG)', symbol: '£', code: 'SDG' },
      { label: 'Swedish Krona (SEK)', symbol: 'kr', code: 'SEK' },
      { label: 'Swiss Franc (CHF)', symbol: 'Fr', code: 'CHF' },
      { label: 'Syrian Pound (SYP)', symbol: '£', code: 'SYP' },
      { label: 'Taiwanese Dollar (TWD)', symbol: 'NT$', code: 'TWD' },
      { label: 'Tajikistani Somoni (TJS)', symbol: 'SM', code: 'TJS' },
      { label: 'Tanzanian Shilling (TZS)', symbol: 'Sh', code: 'TZS' },
      { label: 'Thai Baht (THB)', symbol: '฿', code: 'THB' },
      { label: 'Trinidad & Tobago Dollar (TTD)', symbol: 'TT$', code: 'TTD' },
      { label: 'Tunisian Dinar (TND)', symbol: 'DT', code: 'TND' },
      { label: 'Turkish Lira (TRY)', symbol: '₺', code: 'TRY' },
      { label: 'Ugandan Shilling (UGX)', symbol: 'USh', code: 'UGX' },
      { label: 'Ukrainian Hryvnia (UAH)', symbol: '₴', code: 'UAH' },
      { label: 'United Arab Emirates Dirham (AED)', symbol: 'د.إ', code: 'AED' },
      { label: 'Uruguayan Peso (UYU)', symbol: '$U', code: 'UYU' },
      { label: 'Uzbekistani Som (UZS)', symbol: 'лв', code: 'UZS' },
      { label: 'Venezuelan Bolívar (VES)', symbol: 'Bs.S', code: 'VES' },
      { label: 'Vietnamese Dong (VND)', symbol: '₫', code: 'VND' },
      { label: 'West African CFA Franc (XOF)', symbol: 'Fr', code: 'XOF' },
      { label: 'Yemeni Rial (YER)', symbol: '﷼', code: 'YER' },
      { label: 'Zambian Kwacha (ZMW)', symbol: 'ZK', code: 'ZMW' },
      { label: 'Zimbabwean Dollar (ZWL)', symbol: 'Z$', code: 'ZWL' },
    ],
  },
  {
    label: 'Distance',
    units: [
      { label: 'Kilometres (km)', symbol: 'km' },
      { label: 'Metres (m)', symbol: 'm' },
      { label: 'Centimetres (cm)', symbol: 'cm' },
      { label: 'Millimetres (mm)', symbol: 'mm' },
      { label: 'Miles (mi)', symbol: 'mi' },
      { label: 'Steps', symbol: 'steps' },
    ],
  },
  {
    label: 'Weight',
    units: [
      { label: 'Kilograms (kg)', symbol: 'kg' },
      { label: 'Grams (g)', symbol: 'g' },
      { label: 'Milligrams (mg)', symbol: 'mg' },
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
      { label: 'Seconds (sec)', symbol: 'sec' },
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
      { label: 'Millilitres (mL)', symbol: 'mL' },
      { label: 'Hours of sleep (hrs)', symbol: 'hrs sleep' },
      { label: 'Heartbeats per min (bpm)', symbol: 'bpm' },
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
      { label: 'Emails sent', symbol: 'emails' },
      { label: 'Meetings', symbol: 'meetings' },
    ],
  },
  {
    label: 'Learning',
    units: [
      { label: 'Courses', symbol: 'courses' },
      { label: 'Lessons', symbol: 'lessons' },
      { label: 'Certifications', symbol: 'certs' },
      { label: 'Practice sessions', symbol: 'sessions' },
      { label: 'Flashcards', symbol: 'flashcards' },
    ],
  },
  {
    label: 'Social & Habits',
    units: [
      { label: 'Days streak', symbol: 'days' },
      { label: 'Times/occurrences', symbol: 'times' },
      { label: 'People met', symbol: 'people' },
      { label: 'Calls made', symbol: 'calls' },
      { label: 'Posts published', symbol: 'posts' },
    ],
  },
  {
    label: 'Custom',
    units: [],
  },
]

export default function AddGoalModal({ onClose, onAdd, categories }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [trackingType, setTrackingType] = useState('numeric')
  const [targetAmount, setTargetAmount] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [loading, setLoading] = useState(false)

  // Dates
  const [hasDateRange, setHasDateRange] = useState(true)
  const todayStr = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState('')

  // Unit picker
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

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    if (trackingType === 'numeric' && !targetAmount) return
    if (trackingType === 'numeric' && !displayUnit.trim()) return
    if (hasDateRange && (!startDate || !endDate)) return
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

  const canSubmit = title.trim() &&
    (trackingType !== 'numeric' || targetAmount) &&
    (trackingType !== 'numeric' || displayUnit.trim()) &&
    (!hasDateRange || (startDate && endDate))

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>New goal</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Goal title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Save up for rent" required autoFocus />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Tracking type */}
          <div className="form-group">
            <label>Tracking type</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {['numeric', 'milestone'].map(type => (
                <button
                  key={type} type="button"
                  onClick={() => setTrackingType(type)}
                  style={{
                    flex: 1, padding: '0.6rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${trackingType === type ? 'var(--accent)' : 'var(--border)'}`,
                    background: trackingType === type ? 'var(--accent-dim)' : 'var(--surface-2)',
                    color: trackingType === type ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s', textAlign: 'center',
                  }}
                >
                  {type === 'numeric' ? 'Numeric' : 'Milestone'}
                  <div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.75 }}>
                    {type === 'numeric' ? 'Log amounts, auto % calc' : 'Set % manually'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {trackingType === 'numeric' && (
            <>
              {/* Target amount */}
              <div className="form-group">
                <label>Target amount *</label>
                <input
                  type="number" min="1"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  required
                />
              </div>

              {/* Unit category + unit picker */}
              <div className="form-group">
                <label>Unit category *</label>
                <select value={unitCategory} onChange={e => handleUnitCategoryChange(e.target.value)}>
                  {UNIT_CATEGORIES.map(c => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              {currentCatHasUnits && (
                <div className="form-group">
                  <label>Unit *</label>
                  <select key={unitCategory} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} required>
                    {currentCat.units.map(u => (
                      <option key={u.symbol} value={u.symbol}>{u.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {isCustomUnitCat && (
                <div className="form-group">
                  <label>Custom unit *</label>
                  <input
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    placeholder="e.g. medals, clients, pull-ups"
                    required
                  />
                </div>
              )}

              {/* Frequency — locked to choice */}
              <div className="form-group">
                <label>Tracking frequency</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {FREQUENCIES.map(f => (
                    <button
                      key={f} type="button"
                      onClick={() => setFrequency(f)}
                      style={{
                        flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${frequency === f ? 'var(--accent)' : 'var(--border)'}`,
                        background: frequency === f ? 'var(--accent-dim)' : 'var(--surface-2)',
                        color: frequency === f ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '5px' }}>
                  Frequency is locked after creation — daily goals stay daily, weekly stay weekly, etc.
                </p>
              </div>
            </>
          )}

          {/* Description */}
          <div className="form-group">
            <label>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What does achieving this look like?" />
          </div>

          {/* Date range */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="var(--text-muted)" /> Date range
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!hasDateRange}
                  onChange={e => setHasDateRange(!e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }}
                />
                No set dates
              </label>
            </div>

            {hasDateRange && (
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Start date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required={hasDateRange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>End date *</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    required={hasDateRange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !canSubmit}>
              {loading ? 'Adding…' : 'Add goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
