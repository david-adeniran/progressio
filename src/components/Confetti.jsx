import { useEffect, useState } from 'react'
import {
  Target, CheckCircle2, Trophy, Flame, Zap,
  Star, PenLine, Globe2, Rocket,
} from 'lucide-react'
import styles from './Confetti.module.css'

// Progressio's palette only — no random rainbow
const COLORS = ['#7c6af7', '#3ecf8e', '#f0a844', '#4ab8f5', '#b8a0f7']

const TIER_META = {
  legendary: { color: '#f0a844', label: 'Legendary' },
  epic:      { color: '#b8a0f7', label: 'Epic' },
  rare:      { color: '#4ab8f5', label: 'Rare' },
  common:    { color: '#3ecf8e', label: 'Common' },
  hidden:    { color: '#7c6af7', label: 'Secret' },
}

// Same icon set already used across the app — an achievement
// should look like it belongs to Progressio, not a game overlay.
const ICON_MAP = {
  target: Target, check: CheckCircle2, trophy: Trophy, flame: Flame,
  zap: Zap, star: Star, pencil: PenLine, globe: Globe2, rocket: Rocket,
}

// Real confetti falls under gravity with drift and flutter — it doesn't
// burst upward from a point. Mostly thin "paper strip" shapes, a few dots.
function generateParticles(count = 28) {
  return Array.from({ length: count }, (_, i) => {
    const isStrip = i % 4 !== 0
    return {
      id: i,
      left: 4 + Math.random() * 92,
      color: COLORS[i % COLORS.length],
      w: isStrip ? 3 + Math.random() * 2.5 : 4 + Math.random() * 2,
      h: isStrip ? 9 + Math.random() * 6 : 4 + Math.random() * 2,
      isStrip,
      duration: 2.8 + Math.random() * 1.8,
      delay: Math.random() * 0.85,
      drift: -70 + Math.random() * 140,
      rotStart: Math.round(Math.random() * 180 - 90),
      rotEnd: Math.round(360 + Math.random() * 340),
      flutterDur: 0.5 + Math.random() * 0.5,
    }
  })
}

export default function Confetti({ achievement, unlockedCount, totalCount, onDone }) {
  const [out, setOut] = useState(false)
  const [particles] = useState(generateParticles)

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 3800)
    const t2 = setTimeout(onDone, 4300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const tier = TIER_META[achievement.tier] || TIER_META.common
  const Icon = ICON_MAP[achievement.icon] || Trophy
  const desc = achievement.revealedDesc || achievement.desc

  return (
    <>
      {/* Falling confetti — separate layer, unaffected by the plaque's exit */}
      <div className={styles.confettiField} aria-hidden>
        {particles.map(p => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--rot-start': `${p.rotStart}deg`,
              '--rot-end': `${p.rotEnd}deg`,
            }}
          >
            <div
              className={`${styles.particleInner} ${p.isStrip ? styles.strip : styles.dot}`}
              style={{
                width: p.w,
                height: p.h,
                background: p.color,
                animationDuration: `${p.flutterDur}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Milestone plaque */}
      <div className={`${styles.root} ${out ? styles.rootOut : ''}`} aria-live="polite">
        <div className={styles.plaque}>
          <div className={styles.rule} style={{ background: tier.color }} />
          <div className={styles.head}>
            <Icon size={14} strokeWidth={2} style={{ color: tier.color }} />
            <span className={styles.eyebrow} style={{ color: tier.color }}>
              {tier.label} milestone
            </span>
            {totalCount ? (
              <span className={styles.count}>{unlockedCount} / {totalCount}</span>
            ) : null}
          </div>
          <div className={styles.label}>{achievement.label}</div>
          <div className={styles.desc}>{desc}</div>
        </div>
      </div>
    </>
  )
}
