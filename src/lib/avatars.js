// 10 placeholder avatars using DiceBear API — swap URLs for real images later
// Just replace the `url` value with your own image path e.g. '/avatars/avatar1.png'

export const AVATARS = [
  // Male
  { id: 'male1',   label: 'Avatar 1',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4' },
  { id: 'male2',   label: 'Avatar 2',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Kingston&backgroundColor=c0aede' },
  { id: 'male3',   label: 'Avatar 3',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jasper&backgroundColor=d1d4f9' },
  { id: 'male4',   label: 'Avatar 4',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Marcus&backgroundColor=ffd5dc' },
  { id: 'male5',   label: 'Avatar 5',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=David&backgroundColor=c1f4c5' },
  { id: 'male6',   label: 'Avatar 6',  gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=James&backgroundColor=b6e3f4' },
  { id: 'male7',   label: 'Avatar 7', gender: 'male',   url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=John&backgroundColor=c0aede' },
  // Female
  { id: 'female1', label: 'Avatar 8',  gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Amara&backgroundColor=ffd5dc' },
  { id: 'female2', label: 'Avatar 9',  gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe&backgroundColor=b6e3f4' },
  { id: 'female3', label: 'Avatar 10', gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sofia&backgroundColor=c0aede' },
  { id: 'female4', label: 'Avatar 11', gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Fatima&backgroundColor=d1f7c4' },
  { id: 'female5', label: 'Avatar 12', gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Olivia&backgroundColor=fff3b0' },
  { id: 'female6', label: 'Avatar 13', gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Emma&backgroundColor=c1f4c5' }, 
  { id: 'female7', label: 'Avatar 14', gender: 'female', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ava&backgroundColor=ffd5dc' },
]

export function getAvatarById(id) {
  return AVATARS.find(a => a.id === id) || null
}
