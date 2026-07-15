import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useGoals } from "../hooks/useGoals";
import { calcTotalXP, getLevelInfo, getUnlockedAchievements, ACHIEVEMENTS } from "../lib/xp";
import {
  LayoutDashboard, Target, LayoutGrid, Trophy,
  BarChart2, Settings, LogOut, Sun, Moon, Menu, X,
} from "lucide-react";
import styles from "./Layout.module.css";
import UserAvatar from "./UserAvatar";
import Confetti from "./Confetti";

const NAV_PRIMARY = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/",            shortcut: "D" },
  { label: "Goals",     icon: Target,          path: "/goals",       shortcut: "G" },
  { label: "Categories",icon: LayoutGrid,      path: "/categories",  shortcut: "C" },
]
const NAV_SECONDARY = [
  { label: "Achievements", icon: Trophy,   path: "/achievements", shortcut: "A" },
  { label: "Stats",        icon: BarChart2,path: "/stats",        shortcut: "S" },
  { label: "Settings",     icon: Settings, path: "/settings",     shortcut: null },
]

export default function Layout() {
  const { user } = useAuth();
  const { goals, achievementXP } = useGoals(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  const [confettiQueue, setConfettiQueue] = useState([])
  const [activeConfetti, setActiveConfetti] = useState(null)
  const seenAchievements = useRef(new Set())
  const seenLoaded = useRef(false)

  const totalXP = calcTotalXP(goals) + (achievementXP || 0);
  const levelInfo = getLevelInfo(totalXP);
  const name = user?.displayName || user?.email?.split("@")[0] || "there";

  // Check for new achievements to show dot
  const unlocked = getUnlockedAchievements(goals, totalXP);
  const hasNewAchievement = unlocked.length > 0;

  // Load which achievements this user has already seen, so reopening the
  // app doesn't replay confetti for achievements unlocked in a past session.
  useEffect(() => {
    seenLoaded.current = false
    seenAchievements.current = new Set()
    if (!user?.uid) return
    try {
      const stored = JSON.parse(localStorage.getItem(`progressio_seen_achievements_${user.uid}`) || "[]")
      seenAchievements.current = new Set(stored)
    } catch {}
    seenLoaded.current = true
  }, [user?.uid])

  // Detect newly unlocked achievements
  useEffect(() => {
    if (!goals.length || !seenLoaded.current) return
    const newlyUnlocked = []
    for (const a of ACHIEVEMENTS) {
      if (seenAchievements.current.has(a.id)) continue
      try {
        if (a.condition(goals, totalXP)) {
          seenAchievements.current.add(a.id)
          newlyUnlocked.push(a)
        }
      } catch {}
    }
    if (newlyUnlocked.length > 0) {
      // Snapshot how many were unlocked before this batch, so each queued
      // popup shows its own running count (1/100, 2/100, ...) as it's
      // revealed, instead of every popup in the batch showing the same
      // already-final total.
      const baseline = seenAchievements.current.size - newlyUnlocked.length
      const queued = newlyUnlocked.map((a, i) => ({
        achievement: a,
        unlockedCount: baseline + i + 1,
      }))
      setConfettiQueue(q => [...q, ...queued])
      if (user?.uid) {
        try {
          localStorage.setItem(
            `progressio_seen_achievements_${user.uid}`,
            JSON.stringify([...seenAchievements.current])
          )
        } catch {}
      }
    }
  }, [goals, totalXP, user?.uid])

  // Drain queue one at a time
  useEffect(() => {
    if (!activeConfetti && confettiQueue.length > 0) {
      setActiveConfetti(confettiQueue[0])
      setConfettiQueue(q => q.slice(1))
    }
  }, [confettiQueue, activeConfetti])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => { setSidebarOpen(false); setUserPopoverOpen(false); }, [location.pathname]);

  // Close popover on outside click
  useEffect(() => {
    if (!userPopoverOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-user-popover]')) setUserPopoverOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userPopoverOpen]);

  async function handleSignOut() {
    await signOut(auth);
    navigate("/auth");
  }

  // Current page label for mobile topbar
  const allNav = [...NAV_PRIMARY, ...NAV_SECONDARY];
  const currentPage = allNav.find(n => n.path === location.pathname)?.label || 'Progressio';

  function NavItem({ label, icon: Icon, path, shortcut, showDot }) {
    const active = location.pathname === path;
    return (
      <Link to={path} className={`${styles.navItem} ${active ? styles.navActive : ""}`}>
        <Icon size={16} strokeWidth={active ? 2 : 1.6} />
        <span>{label}</span>
        {showDot && !active && <span className={styles.navDot} />}
        {shortcut && !showDot && <span className={styles.navShortcut}>{shortcut}</span>}
      </Link>
    );
  }

  return (
    <div className={styles.shell}>
      {/* Achievement confetti */}
      {activeConfetti && (
        <Confetti
          achievement={activeConfetti.achievement}
          unlockedCount={activeConfetti.unlockedCount}
          totalCount={ACHIEVEMENTS.length}
          onDone={() => setActiveConfetti(null)}
        />
      )}

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        {/* Logo */}
        <Link to="/" className={styles.sidebarLogo}>
          <img src="https://res.cloudinary.com/f3z9dqhr/image/upload/f_auto/q_auto/Gemini_Generated_Image_s9gwums9gwums9gw-removebg-preview_cfktxv.png" alt="Progressio" className={styles.logoImg}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
          <div className={styles.logoIcon} style={{ display: 'none' }}>P</div>
          <span className={styles.logoText}>Progressio</span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_PRIMARY.map(item => <NavItem key={item.path} {...item} />)}
          <div className={styles.navDivider} />
          {NAV_SECONDARY.map(item => (
            <NavItem key={item.path} {...item}
              showDot={item.path === '/achievements' && hasNewAchievement} />
          ))}
        </nav>

        {/* Bottom */}
        <div className={styles.sidebarBottom}>
          {/* User row with popover */}
          <div className={styles.sidebarUser} data-user-popover
            onClick={() => setUserPopoverOpen(v => !v)}>
            <UserAvatar size={30} />
            <div className={styles.sidebarUserInfo}>
              <span className={styles.sidebarUserName}>{name}</span>
              <span className={styles.sidebarUserEmail}>{user?.email}</span>
            </div>

            {userPopoverOpen && (
              <div className={styles.userPopover}>
                <div className={styles.userPopoverName}>{name}</div>
                <div className={styles.userPopoverEmail}>{user?.email}</div>
                <button className={styles.userPopoverSignOut} onClick={handleSignOut}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.sidebarActions}>
            <button
              className={`${styles.themeToggle} ${dark ? styles.dark : ""}`}
              onClick={() => setDark(v => !v)}
              title={dark ? "Light mode" : "Dark mode"}
            >
              <div className={styles.themeKnob} />
            </button>
            <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className={styles.topbarTitle}>{currentPage}</span>
          <div style={{ width: 28 }} />
        </div>
        <div className={styles.content}>
            <Outlet context={{ dark, setDark }} />
        </div>
      </div>
    </div>
  );
}
