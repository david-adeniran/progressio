// Shared avatar component used across Layout, Dashboard, etc.
import { useAuth } from '../context/AuthContext'
import { useAvatar } from '../hooks/useAvatar'
import { getAvatarById, getInitials } from '../lib/avatars'

export default function UserAvatar({ size = 40, className = '' }) {
  const { user } = useAuth()
  const { avatarId } = useAvatar(user?.uid)
  const avatar = getAvatarById(avatarId)
  const initials = getInitials(user?.displayName, user?.email)

  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: Math.max(4, Math.round(size * 0.16)),
        background: avatar.bg,
        color: avatar.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: size * 0.36, letterSpacing: '0.01em',
        flexShrink: 0,
        userSelect: 'none',
      }}
      className={className}
    >
      {initials}
    </div>
  )
}
