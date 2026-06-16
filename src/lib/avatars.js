// 10 placeholder avatars using DiceBear API — swap URLs for real images later
// Just replace the `url` value with your own image path e.g. '/avatars/avatar1.png'

export const AVATARS = [
  { id: 'male1',   label: 'Avatar 1',  gender: 'male',   url: '/avatar1.png' },
  { id: 'female1', label: 'Avatar 2',  gender: 'female', url: '/avatar2.png' },
  { id: 'male2',   label: 'Avatar 3',  gender: 'male',   url: '/avatar3.png' },
  { id: 'female2',   label: 'Avatar 4',  gender: 'female',   url: '/avatar4.png' },
  { id: 'male3',   label: 'Avatar 5',  gender: 'male',   url: '/avatar5.png' },
  { id: 'female3',   label: 'Avatar 6',  gender: 'female',   url: '/avatar6.png' },
  { id: 'male4',   label: 'Avatar 7', gender: 'male',   url: '/avatar7.png' },
  { id: 'female4', label: 'Avatar 8',  gender: 'female', url: '/avatar8.png' },
  { id: 'male5', label: 'Avatar 9',  gender: 'male', url: '/avatar9.png' },
  { id: 'female5', label: 'Avatar 10', gender: 'female', url: '/avatar10.png' },
  { id: 'male6', label: 'Avatar 11', gender: 'male', url: '/avatar11.png' },
  { id: 'female6', label: 'Avatar 12', gender: 'female', url: '/avatar12.png' },
  { id: 'male7', label: 'Avatar 13', gender: 'male', url: '/avatar13.png' }, 
  { id: 'female7', label: 'Avatar 14', gender: 'female', url: '/avatar14.png' },
]

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || null
}
