import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Sun, Moon } from "lucide-react";
import styles from "./Layout.module.css";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  async function handleSignOut() {
    await signOut(auth);
    navigate("/auth");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Progressio
        </Link>
        <div className={styles.headerRight}>
          <span className={styles.email}>{user?.email}</span>
          <button
            className={`${styles.themeToggle} ${dark ? styles.dark : ''}`}
            onClick={() => setDark(v => !v)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div className={styles.themeKnob}>
              {dark ? <Moon size={11} color="#fff" /> : <Sun size={11} color="#f0a844" />}
            </div>
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleSignOut}
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
