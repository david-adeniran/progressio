import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoals } from "../hooks/useGoals";
import GoalCard from "../components/GoalCard";
import AddGoalModal from "../components/AddGoalModal";
import {
  calcTotalXP, getLevelInfo, getCategoryLevel,
  getUnlockedAchievements, ACHIEVEMENTS,
} from "../lib/xp";
import styles from "./DashboardPage.module.css";
import {
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane,
  Leaf, Zap, Trophy, Flame, Plus, Target, LayoutGrid,
  Rocket, Globe, CheckCircle, Pencil, Lock, Star,
} from "lucide-react";

const CATEGORY_COLORS = {
  Finance: "#7c6af7", Fitness: "#3ecf8e", Learning: "#f0a844",
  Career: "#4ab8f5", Health: "#f25a95", Travel: "#5de0e6",
  Personal: "#b8a0f7", Custom: "#aaa",
};

const SECTION_ICONS = {
  Finance: Wallet, Fitness: Dumbbell, Learning: BookOpen,
  Career: Briefcase, Health: Heart, Travel: Plane,
  Personal: Leaf, Custom: Zap,
};
const ACHIEVEMENT_ICONS = {
  target: Target, pencil: Pencil, check: CheckCircle,
  rocket: Rocket, globe: Globe, flame: Flame,
  zap: Zap, star: Star, trophy: Trophy,
}
function SectionIconComponent({ category, size = 20, color }) {
  const Icon = SECTION_ICONS[category];
  return Icon ? <Icon size={size} color={color} strokeWidth={1.8} /> : null;
}
function AchievementIcon({ icon, unlocked, size = 20 }) {
  const Icon = ACHIEVEMENT_ICONS[icon]
  if (!unlocked) return <Lock size={size} color="var(--text-dim)" />
  return Icon ? <Icon size={size} color="var(--gold)" strokeWidth={1.8} /> : null
}
// ── XP Bar ────────────────────────────────────────────────────────────────────
function XPBar({ levelInfo }) {
  const barRef = useRef(null);
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = "0%";
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${levelInfo.pct}%`;
    }, 400);
    return () => clearTimeout(t);
  }, [levelInfo.pct]);

  return (
    <div className={styles.xpBarWrap}>
      <div className={styles.xpRow}>
        <span className={styles.xpLabel}>XP</span>
        <span className={styles.xpVal}>
          {levelInfo.xpIntoLevel} <span className={styles.xpMax}>/ {levelInfo.xpNeeded}</span>
        </span>
      </div>
      <div className={styles.xpBarTrack}>
        <div ref={barRef} className={styles.xpBarFill} style={{ width: "0%" }} />
      </div>
      {levelInfo.next && (
        <span className={styles.xpNext}>Next: <strong>{levelInfo.next.title}</strong></span>
      )}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ category, goals, color, onClick, isActive }) {
  const catGoals = goals.filter((g) => g.category === category);
  const avg = catGoals.length
    ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length)
    : 0;
  const done = catGoals.filter((g) => g.progress >= 100).length;
  const catLevel = getCategoryLevel(goals, category);

  return (
    <div
      className={`${styles.sectionCard} ${isActive ? styles.sectionCardActive : ""}`}
      style={{ "--cat-color": color }}
      onClick={onClick}
    >
      <div className={styles.sectionCardInner}>
        <div className={styles.sectionIcon}>
          <SectionIconComponent category={category} size={28} color={color} />
        </div>
        <div className={styles.sectionInfo}>
          <span className={styles.sectionName}>{category}</span>
          <span className={styles.sectionStat} style={{ color }}>{avg}%</span>
          <span className={styles.sectionMeta}>{catGoals.length} goal{catGoals.length !== 1 ? "s" : ""} · {done} done</span>
          <span className={styles.sectionTitle} style={{ color }}>{catLevel.title}</span>
        </div>
      </div>
      {isActive && <div className={styles.sectionActiveBar} style={{ background: color }} />}
    </div>
  );
}

// ── Pace badge ────────────────────────────────────────────────────────────────
function getPaceBadge(goal) {
  if (!goal.startDate || !goal.deadline || goal.progress >= 100) return null;
  const start = new Date(goal.startDate + "T00:00:00");
  const end = new Date(goal.deadline + "T00:00:00");
  const now = Date.now();
  const totalDays = (end - start) / 86400000;
  const elapsed = (now - start) / 86400000;
  const expected = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const actual = goal.progress || 0;
  if (actual >= expected + 10) return { label: "Ahead ↑", color: "var(--success)" };
  if (actual < expected - 15) return { label: "Behind ↓", color: "var(--danger)" };
  return { label: "On track", color: "var(--blue)" };
}

// ── Streak ────────────────────────────────────────────────────────────────────
function calcStreak(goals) {
  const allDates = new Set();
  goals.forEach((g) => (g.logs || []).forEach((l) => {
    allDates.add(new Date(l.date).toISOString().split("T")[0]);
  }));
  const sorted = [...allDates].sort().reverse();
  if (!sorted.length) return 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]), b = new Date(sorted[i]);
    if ((a - b) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, deleteGoal } = useGoals(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");
  const [showAchievements, setShowAchievements] = useState(false);
  const [xpFlash, setXpFlash] = useState(false);
  const navigate = useNavigate();

  const name = user?.displayName || user?.email?.split("@")[0] || "there";
  const categories = Object.keys(CATEGORY_COLORS);
  const totalXP = calcTotalXP(goals);
  const levelInfo = getLevelInfo(totalXP);
  const unlockedAchievements = getUnlockedAchievements(goals, totalXP);
  const streak = calcStreak(goals);

  const filtered = filter === "All" ? goals : goals.filter((g) => g.category === filter);
  const completed = filtered.filter((g) => g.progress >= 100).length;
  const active = filtered.filter((g) => g.progress < 100).length;
  const overallPct = filtered.length
    ? Math.round(filtered.reduce((s, g) => s + (g.progress || 0), 0) / filtered.length)
    : 0;

  const prevXP = useRef(totalXP);
  useEffect(() => {
    if (totalXP > prevXP.current) { setXpFlash(true); setTimeout(() => setXpFlash(false), 1200); }
    prevXP.current = totalXP;
  }, [totalXP]);

  return (
    <div className={styles.dashboard}>

      {/* ── Command Center ── */}
      <div className={styles.commandCenter}>
        <div className={styles.avatar}>
          <span>{name[0]?.toUpperCase()}</span>
          <div className={styles.avatarLevel}>Lv.{levelInfo.level}</div>
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.profileName}>
            {name}
            <span className={styles.playerTitle}>{levelInfo.title}</span>
          </div>
          <XPBar levelInfo={levelInfo} />
          <div className={styles.profileStats}>
            <span className={xpFlash ? styles.xpFlash : ""}>
              <strong style={{ color: "var(--gold)" }}>{totalXP}</strong> XP
            </span>
            <span>
              <strong style={{ color: "var(--success)" }}>
                {goals.filter((g) => g.progress >= 100).length}
              </strong> completed
            </span>
            {streak > 0 && (
              <span>
                <strong style={{ color: "var(--danger)", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Flame size={13} color="var(--danger)" /> {streak}
                </strong> day streak
              </span>
            )}
            <span>
              <strong style={{ color: "var(--accent)" }}>{unlockedAchievements.length}</strong> badges
            </span>
          </div>
        </div>
      </div>

      {/* ── Section Cards ── */}
      <div className={styles.sectionRow}>
        {/* All card */}
        <div
          className={`${styles.sectionCard} ${filter === "All" ? styles.sectionCardActive : ""}`}
          style={{ "--cat-color": "var(--accent)" }}
          onClick={() => setFilter("All")}
        >
          <div className={styles.sectionCardInner}>
            <div className={styles.sectionIcon}>
              <LayoutGrid size={28} color="var(--accent)" strokeWidth={1.8} />
            </div>
            <div className={styles.sectionInfo}>
              <span className={styles.sectionName}>All</span>
              <span className={styles.sectionStat} style={{ color: "var(--accent)" }}>
                {goals.length ? Math.round(goals.reduce((s, g) => s + (g.progress || 0), 0) / goals.length) : 0}%
              </span>
              <span className={styles.sectionMeta}>
                {goals.length} goal{goals.length !== 1 ? "s" : ""} · {goals.filter((g) => g.progress >= 100).length} done
              </span>
              <span className={styles.sectionTitle} style={{ color: "var(--accent)" }}>Overview</span>
            </div>
          </div>
          {filter === "All" && <div className={styles.sectionActiveBar} style={{ background: "var(--accent)" }} />}
        </div>

        {categories.map((cat) => (
          <SectionCard
            key={cat}
            category={cat}
            goals={goals}
            color={CATEGORY_COLORS[cat]}
            isActive={filter === cat}
            onClick={() => setFilter(filter === cat ? "All" : cat)}
          />
        ))}
      </div>

      {/* ── Achievements ── */}
      <div className={styles.achievementsWrap}>
        <button className={styles.achievementsToggle} onClick={() => setShowAchievements((v) => !v)}>
          <Trophy size={15} color="var(--gold)" />
          <span>Achievements</span>
          <span style={{ fontSize: "0.75rem", color: "var(--gold)", marginLeft: "6px" }}>
            {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
          </span>
          <span style={{ color: "var(--text-dim)", marginLeft: "auto" }}>{showAchievements ? "▲" : "▼"}</span>
        </button>
        {showAchievements && (
          <div className={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedAchievements.some((u) => u.id === a.id);
              return (
                <div key={a.id} className={`${styles.badge} ${unlocked ? styles.badgeUnlocked : ""}`} title={a.desc}>
                  <AchievementIcon icon={a.icon} unlocked={unlocked} size={22} />
                  <span className={styles.badgeLabel}>{a.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Goals header ── */}
      <div className={styles.goalsHeader}>
        <div className={styles.goalsTitle}>
          {filter === "All" ? "All Goals" : (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SectionIconComponent category={filter} size={20} color={CATEGORY_COLORS[filter]} />
              {filter}
            </span>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: "0.85rem" }}>
          + New goal
        </button>
      </div>

      {/* ── Stats ── */}
      {goals.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{filtered.length}</span>
            <span className={styles.statLabel}>Total goals</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--success)" }}>{completed}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--accent)" }}>{overallPct}%</span>
            <span className={styles.statLabel}>Avg progress</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--blue)" }}>{active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
      )}

      {/* ── Filter pills ── */}
      {goals.length > 0 && (
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === "All" ? styles.filterActive : ""}`}
            onClick={() => setFilter("All")}
          >All</button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${filter === cat ? styles.filterActive : ""}`}
              onClick={() => setFilter(filter === cat ? "All" : cat)}
              style={filter === cat ? { borderColor: CATEGORY_COLORS[cat], color: CATEGORY_COLORS[cat] } : {}}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <SectionIconComponent category={cat} size={12} color={filter === cat ? CATEGORY_COLORS[cat] : "currentColor"} />
                {cat}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Goals grid ── */}
      {loading ? (
        <p className={styles.empty}>Loading your goals…</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {filter !== "All"
              ? <SectionIconComponent category={filter} size={48} color={CATEGORY_COLORS[filter]} />
              : <Target size={48} color="var(--text-dim)" />}
          </div>
          <p>{goals.length === 0 ? "No goals yet. Your journey starts here." : `No ${filter} goals yet.`}</p>
          {(goals.length === 0 || filter !== "All") && (
            <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowAdd(true)}>
              {goals.length === 0 ? "Add your first goal" : `Add a ${filter} goal`}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((goal) => {
            const pace = getPaceBadge(goal);
            return (
              <div key={goal.id} style={{ position: "relative", animation: "fadeInUp 0.3s ease both", "--card-color": CATEGORY_COLORS[goal.category] || "#aaa" }}>
                {pace && (
                  <div style={{
                    position: "absolute", top: "10px", right: "42px", zIndex: 2,
                    fontSize: "0.63rem", fontWeight: 700, padding: "2px 7px",
                    borderRadius: "99px", background: pace.color + "22",
                    color: pace.color, border: `1px solid ${pace.color}44`,
                    letterSpacing: "0.03em", pointerEvents: "none",
                  }}>
                    {pace.label}
                  </div>
                )}
                <GoalCard
                  goal={goal}
                  color={CATEGORY_COLORS[goal.category] || "#aaa"}
                  onClick={() => navigate(`/goal/${goal.id}`)}
                  onDelete={() => deleteGoal(goal.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── FAB ── */}
      <button className={styles.fab} onClick={() => setShowAdd(true)} title="Add goal">
        <Plus size={24} />
        <div className={styles.fabRing} />
      </button>

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => { await addGoal(data); setShowAdd(false); }}
          categories={Object.keys(CATEGORY_COLORS)}
        />
      )}
    </div>
  );
}
