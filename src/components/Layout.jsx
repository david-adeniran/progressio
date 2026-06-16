import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useGoals } from "../hooks/useGoals";
import { calcTotalXP, getLevelInfo } from "../lib/xp";
import {
  LayoutDashboard, Target, LayoutGrid, Trophy,
  BarChart2, Settings, LogOut, Sun, Moon, Menu, X, ChevronRight,
} from "lucide-react";
import styles from "./Layout.module.css";
import UserAvatar from "./UserAvatar";


const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Goals", icon: Target, path: "/goals" },
  { label: "Categories", icon: LayoutGrid, path: "/categories" },
  { label: "Achievements", icon: Trophy, path: "/achievements" },
  { label: "Stats", icon: BarChart2, path: "/stats" },
  { label: "Settings", icon: Settings, path: "/settings" },
]

export default function Layout() {
  const { user } = useAuth();
  const { goals } = useGoals(user?.uid);
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalXP = calcTotalXP(goals);
  const levelInfo = getLevelInfo(totalXP);
  const name = user?.displayName || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  async function handleSignOut() {
    await signOut(auth);
    navigate("/auth");
  }

  return (
    <div className={styles.shell}>
      {/* Overlay for mobile */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        {/* Logo */}
        <Link to="/" className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>P</div>
          <span className={styles.logoText}>Progressio</span>
        </Link>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
                {active && <ChevronRight size={14} className={styles.navChevron} />}
              </Link>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        <div className={styles.sidebarBottom}>
          {/* XP mini bar */}
          <div className={styles.sidebarXP}>
            <div className={styles.sidebarXPTop}>
              <span className={styles.sidebarXPLabel}>Level {levelInfo.level} · {levelInfo.title}</span>
              <span className={styles.sidebarXPVal}>{totalXP} XP</span>
            </div>
            <div className={styles.sidebarXPTrack}>
              <div className={styles.sidebarXPFill} style={{ width: `${levelInfo.pct}%` }} />
            </div>
          </div>

          <div className={styles.sidebarUser}>
          <Link to ="/settings">
          <UserAvatar size={36} />
          </Link>
            <div className={styles.sidebarUserInfo}>
              <span className={styles.sidebarUserName}>{name}</span>
              <span className={styles.sidebarUserEmail}>{user?.email}</span>
            </div>
          </div>

          <div className={styles.sidebarActions}>
            <button
              className={`${styles.themeToggle} ${dark ? styles.dark : ""}`}
              onClick={() => setDark(v => !v)}
              title={dark ? "Light mode" : "Dark mode"}
            >
              <div className={styles.themeKnob}>
                {dark ? <Moon size={10} color="#fff" /> : <Sun size={10} color="#f0a844" />}
              </div>
            </button>
            <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.main}>
        {/* Mobile topbar */}
        <div className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/" className={styles.topbarLogo}>Progressio</Link>
          <div style={{ width: 36 }} />
        </div>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
