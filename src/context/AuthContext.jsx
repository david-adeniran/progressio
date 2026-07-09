import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE = "service_rdx4vns"
const EMAILJS_WELCOME = "template_b52b9xf"
const EMAILJS_KEY = "GYshRTHCTu1Q3XOoY"
const APP_URL = "https://your-app.vercel.app"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const prevVerified = useRef(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // Detect when emailVerified flips from false to true
      if (u && u.emailVerified && !prevVerified.current) {
        // Send welcome email
        emailjs.send(
          EMAILJS_SERVICE,
          EMAILJS_WELCOME,
          {
            to_name: u.displayName || u.email.split('@')[0],
            email: u.email,
            app_url: APP_URL,
          },
          EMAILJS_KEY
        ).catch(e => console.error('Welcome email error:', e))
      }
      prevVerified.current = u?.emailVerified || false
      setUser(u)
    })
    return unsub
  }, [])

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
