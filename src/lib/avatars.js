// Avatars are generated from the user's initials, not illustrated images —
// keeps the app's monochrome + single-accent identity intact and needs no
// external assets. Each option is just a background/foreground pairing
// pulled from tokens already defined in index.css.
export const AVATARS = [
  { id: 'neutral', label: 'Neutral', bg: 'var(--surface-3)', fg: 'var(--text)' },
  { id: 'accent',  label: 'Cream',   bg: 'var(--accent)',    fg: '#0a0a0a' },
  { id: 'gold',    label: 'Gold',    bg: 'var(--gold)',      fg: '#0a0a0a' },
  { id: 'blue',    label: 'Blue',    bg: 'var(--blue)',      fg: '#0a0a0a' },
  { id: 'success', label: 'Green',   bg: 'var(--success)',   fg: '#0a0a0a' },
  { id: 'danger',  label: 'Red',     bg: 'var(--danger)',    fg: '#0a0a0a' },
]

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0]
}

export function getInitials(name, email) {
  const source = (name || email || '').trim()
  if (!source) return '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}