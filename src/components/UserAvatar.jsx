// Shared avatar component used across Layout, Dashboard, etc.
import { useAuth } from '../context/AuthContext'
import { useAvatar } from '../hooks/useAvatar'
import { getAvatarById } from '../lib/avatars'

export default function UserAvatar({ size = 40, className = '' }) {
  const { user } = useAuth()
  const { avatarId } = useAvatar(user?.uid)
  const avatar = getAvatarById(avatarId)
  const name = user?.displayName || user?.email?.split('@')[0] || '?'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (avatar) {
    return (
      <img
        src={avatar.url}
        alt={avatar.label}
        width={size}
        height={size}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--border-light)',
          background: 'var(--surface-2)',
          flexShrink: 0,
        }}
        className={className}
      />
    )
  }

  // Fallback — letter initials
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c6af7, #3ecf8e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: size * 0.35, color: '#fff', flexShrink: 0,
    }} className={className}>
      {initials}
    </div>
  )
}
