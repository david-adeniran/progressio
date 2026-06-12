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
  TrendingUp, AlertTriangle, CheckSquare,
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
};

function SectionIcon({ category, size = 18, color }) {
  const Icon = SECTION_ICONS[category];
  return Icon ? <Icon size={size} color={color} strokeWidth={1.8} /> : null;
}
function AchievementIcon({ icon, unlocked, size = 22 }) {
  const Icon = ACHIEVEMENT_ICONS[icon];
  if (!unlocked) return <Lock size={size} color="var(--text-dim)" />;
  return Icon ? <Icon size={size} color="var(--gold)" strokeWidth={1.8} /> : null;
}

function calcStreak(goals) {
  const allDates = new Set();
  goals.forEach(g => (g.logs || []).forEach(l => {
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

function getPaceStatus(goal) {
  if (!goal.startDate || !goal.deadline || goal.progress >= 100) return null;
  const start = new Date(goal.startDate + "T00:00:00");
  const end = new Date(goal.deadline + "T00:00:00");
  const totalDays = (end - start) / 86400000;
  const elapsed = (Date.now() - start) / 86400000;
  const expected = Math.min(100, Math.round((elapsed / totalDays) * 100));
  const actual = goal.progress || 0;
  if (actual >= expected + 10) return { label: "On Track", color: "var(--success)", icon: TrendingUp };
  if (actual < expected - 15) return { label: "At Risk", color: "var(--danger)", icon: AlertTriangle };
  return { label: "On Track", color: "var(--success)", icon: TrendingUp };
}

function MotivationalBanner({ name, goals, streak }) {
  const completed = goals.filter(g => g.progress >= 100).length;
  const total = goals.length;
  let message = "Your journey starts with a single goal. Add one now.";
  let sub = "Small consistent actions lead to extraordinary results.";
  if (total > 0 && streak > 0) {
    message = `Keep crushing it, ${name}! 🔥 ${streak}-day streak going strong.`;
    sub = "Small consistent actions lead to extraordinary results. You're doing great!";
  } else if (completed > 0) {
    message = `You've completed ${completed} goal${completed > 1 ? 's' : ''}. Keep the momentum!`;
    sub = "Every completed goal is a step toward the best version of yourself.";
  } else if (total > 0) {
    message = `You have ${total} active goal${total > 1 ? 's' : ''}. Stay focused!`;
    sub = "Consistency beats intensity. Keep showing up every day.";
  }
  return (
    <div className={styles.banner}>
      <div className={styles.bannerIcon}>✨</div>
      <div>
        <div className={styles.bannerMsg}>{message}</div>
        <div className={styles.bannerSub}>{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, deleteGoal } = useGoals(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");
  const [goalFilter, setGoalFilter] = useState("All"); // All / On Track / At Risk / Completed
  const navigate = useNavigate();

  const name = user?.displayName || user?.email?.split("@")[0] || "there";
  const categories = Object.keys(CATEGORY_COLORS);
  const totalXP = calcTotalXP(goals);
  const levelInfo = getLevelInfo(totalXP);
  const unlockedAchievements = getUnlockedAchievements(goals, totalXP);
  const streak = calcStreak(goals);
  const completedGoals = goals.filter(g => g.progress >= 100);
  const completionRate = goals.length
    ? Math.round((completedGoals.length / goals.length) * 100) : 0;

  // Category filter
  const categoryFiltered = filter === "All" ? goals : goals.filter(g => g.category === filter);

  // Goal status filter
  const filtered = categoryFiltered.filter(g => {
    if (goalFilter === "Completed") return g.progress >= 100;
    if (goalFilter === "At Risk") {
      const pace = getPaceStatus(g);
      return pace?.label === "At Risk";
    }
    if (goalFilter === "On Track") {
      if (g.progress >= 100) return false;
      const pace = getPaceStatus(g);
      return !pace || pace.label === "On Track";
    }
    return true;
  });

  return (
    <div className={styles.dashboard}>

      {/* ── Command Center ── */}
      <div className={styles.commandCenter}>
        <div className={styles.ccLeft}>
          <div className={styles.ccLabel}>COMMAND CENTER</div>
          <div className={styles.ccProfile}>
            <div className={styles.ccAvatar}>
              <span>{name[0]?.toUpperCase()}</span>
              <div className={styles.ccLevel}>Lv.{levelInfo.level}</div>
            </div>
            <div>
              <div className={styles.ccName}>{name}</div>
              <div className={styles.ccTitle}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>{levelInfo.title}</span>
                <Zap size={13} color="var(--gold)" style={{ marginLeft: 4 }} />
              </div>
              {streak > 0 && (
                <div className={styles.ccStreak}>
                  <Flame size={13} color="var(--danger)" /> Keep crushing your goals!
                </div>
              )}
            </div>
          </div>
          {/* XP bar */}
          <div className={styles.ccXP}>
            <div className={styles.ccXPRow}>
              <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "1rem" }}>{totalXP.toLocaleString()}</span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>/ {levelInfo.next?.xpRequired?.toLocaleString() || "MAX"} XP</span>
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>Level {levelInfo.level}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>→ Level {levelInfo.level + 1}</span>
            </div>
            <div className={styles.ccXPTrack}>
              <div className={styles.ccXPFill} style={{ width: `${levelInfo.pct}%` }} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className={styles.ccStats}>
          <div className={styles.ccStat}>
            <div className={styles.ccStatIcon} style={{ background: "rgba(242,90,90,0.15)" }}>
              <Flame size={20} color="var(--danger)" />
            </div>
            <div className={styles.ccStatVal}>{streak}</div>
            <div className={styles.ccStatLabel}>Day Streak</div>
            <div className={styles.ccStatSub}>🔥 Best: {streak} days</div>
          </div>
          <div className={styles.ccStat}>
            <div className={styles.ccStatIcon} style={{ background: "rgba(124,106,247,0.15)" }}>
              <Target size={20} color="var(--accent)" />
            </div>
            <div className={styles.ccStatVal}>{completedGoals.length}</div>
            <div className={styles.ccStatLabel}>Goals Completed</div>
            <div className={styles.ccStatSub}>🎯 Keep it up!</div>
          </div>
          <div className={styles.ccStat}>
            <div className={styles.ccStatIcon} style={{ background: "rgba(240,168,68,0.15)" }}>
              <Trophy size={20} color="var(--gold)" />
            </div>
            <div className={styles.ccStatVal}>{unlockedAchievements.length}</div>
            <div className={styles.ccStatLabel}>Achievements</div>
            <div className={styles.ccStatSub}>🏆 {ACHIEVEMENTS.length - unlockedAchievements.length} to unlock</div>
          </div>
          <div className={styles.ccStat}>
            <div className={styles.ccStatIcon} style={{ background: "rgba(74,184,245,0.15)" }}>
              <TrendingUp size={20} color="var(--blue)" />
            </div>
            <div className={styles.ccStatVal}>{completionRate}%</div>
            <div className={styles.ccStatLabel}>Completion Rate</div>
            <div className={styles.ccStatSub}>📈 +{completionRate > 0 ? completionRate : 0}% this month</div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.mainLeft}>

          {/* ── Categories ── */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Your Categories</span>
              <button className={styles.viewAll} onClick={() => setFilter("All")}>View all</button>
            </div>
            <div className={styles.catGrid}>
              {categories.map(cat => {
                const catGoals = goals.filter(g => g.category === cat);
                const avg = catGoals.length
                  ? Math.round(catGoals.reduce((s, g) => s + (g.progress || 0), 0) / catGoals.length) : 0;
                const catLevel = getCategoryLevel(goals, cat);
                const color = CATEGORY_COLORS[cat];
                const r = 20, circ = 2 * Math.PI * r;
                const dash = (avg / 100) * circ;
                const active = filter === cat;
                return (
                  <div
                    key={cat}
                    className={`${styles.catCard} ${active ? styles.catCardActive : ""}`}
                    style={{ "--cat-color": color }}
                    onClick={() => setFilter(active ? "All" : cat)}
                  >
                    <div className={styles.catCardTop}>
                      <div className={styles.catIconWrap} style={{ background: color + "22" }}>
                        <SectionIcon category={cat} size={16} color={color} />
                      </div>
                      <span className={styles.catName}>{cat}</span>
                      {/* Mini ring */}
                      <div className={styles.catRing}>
                        <svg width="48" height="48" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
                          <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3.5"
                            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
                        </svg>
                        <span className={styles.catPct} style={{ color }}>{avg}%</span>
                      </div>
                    </div>
                    <div className={styles.catLevel}>Level {Math.min(5, catLevel.score + 1)} · {catLevel.title}</div>
                    <div className={styles.catGoalCount}>{catGoals.length} goal{catGoals.length !== 1 ? "s" : ""}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Goals ── */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>
                {filter === "All" ? "Your Goals" : `${filter} Goals`}
              </span>
              <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ fontSize: "0.8rem", padding: "0.4rem 0.9rem" }}>
                <Plus size={14} /> New Goal
              </button>
            </div>

            {/* Status filter tabs */}
            <div className={styles.goalTabs}>
              {["All", "On Track", "At Risk", "Completed"].map(tab => (
                <button
                  key={tab}
                  className={`${styles.goalTab} ${goalFilter === tab ? styles.goalTabActive : ""}`}
                  onClick={() => setGoalFilter(tab)}
                >
                  {tab === "On Track" && <TrendingUp size={11} />}
                  {tab === "At Risk" && <AlertTriangle size={11} />}
                  {tab === "Completed" && <CheckSquare size={11} />}
                  {tab}
                </button>
              ))}
            </div>

            {loading ? (
              <p className={styles.empty}>Loading…</p>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <SectionIcon category={filter} size={40} color={CATEGORY_COLORS[filter] || "var(--text-dim)"} />
                </div>
                <p>{goals.length === 0 ? "No goals yet. Your journey starts here." : `No goals match this filter.`}</p>
                <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowAdd(true)}>
                  Add a goal
                </button>
              </div>
            ) : (
              <div className={styles.goalsGrid}>
                {filtered.map(goal => {
                  const pace = getPaceStatus(goal);
                  return (
                    <div key={goal.id} style={{ position: "relative" }}>
                      {pace && (
                        <div className={styles.paceBadge} style={{ color: pace.color, background: pace.color + "18", border: `1px solid ${pace.color}44` }}>
                          <pace.icon size={10} />
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

            {filtered.length > 0 && goals.length > 0 && (
              <button className={styles.createMore} onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Create New Goal
              </button>
            )}
          </div>

          {/* ── Motivational Banner ── */}
          <MotivationalBanner name={name} goals={goals} streak={streak} />
        </div>

        {/* ── Right Panel: Achievements ── */}
        <div className={styles.rightPanel}>
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Achievements</span>
              <button className={styles.viewAll} onClick={() => navigate("/achievements")}>
                View all ({ACHIEVEMENTS.length})
              </button>
            </div>
            <div className={styles.achieveGrid}>
              {ACHIEVEMENTS.slice(0, 10).map(a => {
                const unlocked = unlockedAchievements.some(u => u.id === a.id);
                return (
                  <div key={a.id} className={`${styles.achieveBadge} ${unlocked ? styles.achieveUnlocked : ""}`} title={a.desc}>
                    <div className={styles.achieveHex}>
                      <AchievementIcon icon={a.icon} unlocked={unlocked} size={20} />
                    </div>
                    <span className={styles.achieveLabel}>{a.label}</span>
                    <span className={styles.achieveDesc}>{a.desc}</span>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost" onClick={() => navigate("/achievements")} style={{ width: "100%", marginTop: "0.85rem", justifyContent: "center", fontSize: "0.82rem" }}>
              <Trophy size={14} /> See all {ACHIEVEMENTS.length} achievements · {unlockedAchievements.length} unlocked
            </button>
          </div>
        </div>
      </div>

      {/* ── FAB ── */}
      <button className={styles.fab} onClick={() => setShowAdd(true)} title="Add goal">
        <Plus size={22} />
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
