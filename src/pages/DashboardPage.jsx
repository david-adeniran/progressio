import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoals } from "../hooks/useGoals";
import GoalCard from "../components/GoalCard";
import AddGoalModal from "../components/AddGoalModal";
import {
  calcTotalXP, getLevelInfo, getCategoryLevel, ACHIEVEMENTS,
} from "../lib/xp";
import styles from "./DashboardPage.module.css";
import UserAvatar from "../components/UserAvatar";
import {
  Wallet, Dumbbell, BookOpen, Briefcase, Heart, Plane,
  Leaf, Zap, Trophy, Flame, Plus, Target, LayoutGrid,
  Rocket, Globe, CheckCircle, Pencil, Lock, Star,
  TrendingUp, AlertTriangle, CheckSquare, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

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

const GREETINGS = ["Howfar", "How you dey", "Wagwan", "Hey", "What's up"];

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
  if (!allDates.size) return { current: 0, best: 0 };

  const ascending = [...allDates].sort();

  // Best streak ever: longest run of consecutive days across all history
  let best = 1, run = 1;
  for (let i = 1; i < ascending.length; i++) {
    const a = new Date(ascending[i - 1]), b = new Date(ascending[i]);
    if ((b - a) / 86400000 === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  // Current streak: only counts if it's still active (last log was today or yesterday)
  const descending = [...ascending].reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let current = 0;
  if (descending[0] === today || descending[0] === yesterday) {
    current = 1;
    for (let i = 1; i < descending.length; i++) {
      const a = new Date(descending[i - 1]), b = new Date(descending[i]);
      if ((a - b) / 86400000 === 1) current++;
      else break;
    }
  }

  return { current, best: Math.max(best, current) };
}

// Finds the real date a goal first crossed 100%, by scanning its own log
// history (logEntry and logMilestone both record `progress` per entry).
// Returns null if the goal isn't complete or has no logs to date it from.
function getCompletionDate(goal) {
  if (goal.progress < 100 || !goal.logs?.length) return null;
  const sorted = [...goal.logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHit = sorted.find(l => l.progress >= 100);
  return firstHit ? firstHit.date : null;
}

// Real month-over-month comparison: goals completed in the last 30 days
// vs. the 30 days before that. Returns null if there's no dated completion
// history yet to compare against (rather than faking a trend).
function calcMonthlyCompletionDelta(goals) {
  const day = 86400000;
  const now = Date.now();
  let thisMonth = 0, lastMonth = 0, anyDated = false;
  goals.forEach(g => {
    const date = getCompletionDate(g);
    if (!date) return;
    anyDated = true;
    const daysAgo = (now - new Date(date).getTime()) / day;
    if (daysAgo >= 0 && daysAgo < 30) thisMonth++;
    else if (daysAgo >= 30 && daysAgo < 60) lastMonth++;
  });
  if (!anyDated) return null;
  return { thisMonth, lastMonth, delta: thisMonth - lastMonth };
}

// Pace thresholds scale with how far through the goal's timeline you are.
// Early on, a gap between expected and actual progress isn't alarming — there's
// plenty of runway left to recover. As the deadline nears, the same size gap
// becomes far more serious. So the "at risk" and "ahead" buffers both start
// generous and tighten as the goal progresses.
//
// The tightening uses an ease-in curve (t²) rather than a straight line,
// because most goals aren't logged in a perfectly smooth line — people batch
// progress on weekends, take a few days off, etc. A linear buffer bottoms out
// too early and starts flagging that normal lumpiness as "At Risk" well before
// the deadline actually justifies it. Easing keeps the buffer close to its
// starting value through most of the timeline, then tightens quickly only in
// the final stretch, which is when a gap actually becomes urgent.
const RISK_BUFFER_START = 20;  // % behind allowed near the start of the goal
const RISK_BUFFER_END = 10;    // % behind allowed right before the deadline
const AHEAD_BUFFER_START = 15; // % ahead needed to count as "Ahead" early on
const AHEAD_BUFFER_END = 10;   // % ahead needed near the deadline

function getPaceStatus(goal) {
  if (!goal.startDate || !goal.deadline || goal.progress >= 100) return null;
  const start = new Date(goal.startDate + "T00:00:00");
  const end = new Date(goal.deadline + "T00:00:00");
  const totalDays = (end - start) / 86400000;
  if (totalDays <= 0) return null;

  const elapsed = (Date.now() - start) / 86400000;
  const elapsedFraction = Math.min(1, Math.max(0, elapsed / totalDays));
  const expected = Math.min(100, Math.round(elapsedFraction * 100));
  const actual = goal.progress || 0;

  // Ease-in curve: stays close to 0 for most of the timeline, then rises
  // sharply as elapsedFraction approaches 1 (deadline is near).
  const eased = elapsedFraction * elapsedFraction;
  const riskBuffer = RISK_BUFFER_START - (RISK_BUFFER_START - RISK_BUFFER_END) * eased;
  const aheadBuffer = AHEAD_BUFFER_START - (AHEAD_BUFFER_START - AHEAD_BUFFER_END) * eased;

  if (actual >= expected + aheadBuffer) return { label: "Ahead", color: "var(--accent)", icon: Rocket };
  if (actual < expected - riskBuffer) return { label: "At Risk", color: "var(--danger)", icon: AlertTriangle };
  return { label: "On Track", color: "var(--success)", icon: TrendingUp };
}

// Defined quote pools per banner state. "normal" is a general-purpose pool
// that gets blended into whichever specific state applies below, so every
// category still gets some plain, always-true encouragement mixed in with
// its more specific lines.
const QUOTES = {
  noGoals: [
    "Every big win starts with one small decision to begin.",
    "The best time to start was yesterday. The next best time is now.",
    "You don't need a plan. You need a first step.",
  ],
  completedHistory: [
    "You've done this before. You know you can do it again.",
    "That achievement history isn't gone. Add a goal and keep building on it.",
    "You've proven you can finish. What's next?",
  ],
  streak: [
    "That streak isn't luck. That's you showing up.",
    "This is what discipline looks like from the outside.",
    "The streak is proof, not pressure. Keep going.",
  ],
  active: [
    "You don't need a big day. You need today.",
    "Progress is quiet. Keep making it anyway.",
    "Nobody's watching but you. Keep going.",
  ],
  completed: [
    "That's not nothing. Look at what you just did.",
    "One down. You know exactly what it takes now.",
    "Completed goals don't lie. You're capable of this.",
  ],
  normal: [
    "Consistency beats intensity.",
    "Small consistent actions lead to extraordinary results.",
    "Showing up is the whole game.",
  ],
};

// Rotates by calendar day rather than on every render/mount — same pick
// holds steady all day, then changes tomorrow. Deterministic, no repeats
// flickering on refresh, and every user on the same day sees the same one.
function dayOfYearIndex() {
  return Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
}

function pickQuote(category) {
  const pool = [...QUOTES[category], ...QUOTES.normal];
  return pool[dayOfYearIndex() % pool.length];
}

// Message templates per condition. Each one is a function so it can plug in
// the real, live numbers (streak count, completed count, active count) at
// the moment it's chosen — nothing here is a rotating text variant, only
// which condition gets shown rotates.
const MESSAGES = {
  noGoals: () => "Your journey starts with a single goal. Add one now.",
  completedHistory: () => "You've completed goals before. Ready to start your next one?",
  streak: ({ name, streak }) => `Keep crushing it, ${name}! ${streak.current}-day streak going strong.`,
  completed: ({ completed }) => `You've completed ${completed} goal${completed > 1 ? 's' : ''}. Keep the momentum!`,
  active: ({ activeCount }) => `You have ${activeCount} active goal${activeCount > 1 ? 's' : ''}. Stay focused!`,
};

// Every condition below is an equal citizen in one rotation pool — nothing
// is a fixed special case. If a user has a streak AND completed goals AND
// active goals right now, all three qualify and the banner rotates between
// them day to day. If they have 0 goals right now but genuine completion
// history (proven by unlocked achievements / achievement XP, which persist
// in Firestore even after every goal is deleted), "no goals" and "you've
// done this before" both qualify and alternate. Only a truly brand-new
// user — 0 goals, 0 history — ends up with just one qualifying condition,
// which is why that specific case looks "fixed": there's nothing else true
// to rotate against yet.
function MotivationalBanner({ name, goals, streak, hasCompletionHistory }) {
  const completed = goals.filter(g => g.progress >= 100).length;
  const total = goals.length;
  const activeCount = total - completed;

  const qualifying = [];
  if (total === 0) {
    qualifying.push("noGoals");
    if (hasCompletionHistory) qualifying.push("completedHistory");
  } else {
    if (streak.current > 0) qualifying.push("streak");
    if (completed > 0) qualifying.push("completed");
    if (activeCount > 0) qualifying.push("active");
  }

  const category = qualifying[dayOfYearIndex() % qualifying.length];
  const message = MESSAGES[category]({ name, streak, completed, activeCount });
  const sub = pickQuote(category);

  return (
    <div className={styles.banner}>
      <div className={styles.bannerIcon}><Sparkles size={22} color="var(--accent)" /></div>
      <div>
        <div className={styles.bannerMsg}>{message}</div>
        <div className={styles.bannerSub}>{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, deleteGoal, getUnlockedAchievements, achievementXP } = useGoals(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [filter, setFilter] = useState("All");
  const [goalFilter, setGoalFilter] = useState("All"); // All / On Track / At Risk / Completed
  const navigate = useNavigate();

  const name = user?.displayName || user?.email?.split("@")[0] || "there";
  const categories = Object.keys(CATEGORY_COLORS);
  const totalXP = calcTotalXP(goals, achievementXP);
  const levelInfo = getLevelInfo(totalXP);
  const unlockedIds = getUnlockedAchievements();
  const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id));
  const streak = calcStreak(goals);
  const completedGoals = goals.filter(g => g.progress >= 100);
  const completionRate = goals.length
    ? Math.round((completedGoals.length / goals.length) * 100) : 0;
  const monthlyDelta = calcMonthlyCompletionDelta(goals);

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
              <Link to="/settings">
                <UserAvatar size={60} />
              </Link>
              <div className={styles.ccLevel}>Lv.{levelInfo.level}</div>
            </div>
            <div>
              <div className={styles.ccName}>{greeting}, {name}</div>
              <div className={styles.ccTitle}>
                <span className={styles.ccTitleAccent}>{levelInfo.title}</span>
                <Zap size={13} color="var(--gold)" className={styles.ccTitleZap} />
              </div>
              {streak.current > 0 && (
                <div className={styles.ccStreak}>
                  <Flame size={13} color="var(--danger)" /> Keep crushing your goals!
                </div>
              )}
            </div>
          </div>
          {/* XP bar */}
          <div className={styles.ccXP}>
            <div className={styles.ccXPRow}>
              <span className={styles.ccXPValue}>{totalXP.toLocaleString()}</span>
              <span className={styles.ccXPTotal}>/ {levelInfo.next?.xpRequired?.toLocaleString() || "MAX"} XP</span>
              <span className={styles.ccXPLevelCurrent}>Level {levelInfo.level}</span>
              <span className={styles.ccXPLevelNext}>→ Level {levelInfo.level + 1}</span>
            </div>
            <div className={styles.ccXPTrack}>
              <div className={styles.ccXPFill} style={{ width: `${levelInfo.pct}%` }} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className={styles.ccStats}>
          <div className={styles.ccStat}>
            <div className={`${styles.ccStatIcon} ${styles.ccStatIconDanger}`}>
              <Flame size={20} color="var(--danger)" />
            </div>
            <div className={styles.ccStatVal}>{streak.current}</div>
            <div className={styles.ccStatLabel}>Day Streak</div>
            <div className={styles.ccStatSub}>
              <Flame size={11} color="var(--danger)" /> Best: {streak.best} days
            </div>
          </div>
          <div className={styles.ccStat}>
            <div className={`${styles.ccStatIcon} ${styles.ccStatIconAccent}`}>
              <Target size={20} color="var(--accent)" />
            </div>
            <div className={styles.ccStatVal}>{completedGoals.length}</div>
            <div className={styles.ccStatLabel}>Goals Completed</div>
            <div className={styles.ccStatSub}>
              <CheckCircle size={11} color="var(--success)" /> Keep it up!
            </div>
          </div>
          <div className={styles.ccStat}>
            <div className={`${styles.ccStatIcon} ${styles.ccStatIconGold}`}>
              <Trophy size={20} color="var(--gold)" />
            </div>
            <div className={styles.ccStatVal}>{unlockedAchievements.length}</div>
            <div className={styles.ccStatLabel}>Achievements</div>
            <div className={styles.ccStatSub}><Trophy size={11} color="var(--gold)" /> {ACHIEVEMENTS.length - unlockedAchievements.length} to unlock</div>
          </div>
          <div className={styles.ccStat}>
            <div className={`${styles.ccStatIcon} ${styles.ccStatIconBlue}`}>
              <TrendingUp size={20} color="var(--blue)" />
            </div>
            <div className={styles.ccStatVal}>{completionRate}%</div>
            <div className={styles.ccStatLabel}>Completion Rate</div>
            {monthlyDelta && (
              <div className={styles.ccStatSub}>
                <TrendingUp size={11} color="var(--blue)" />
                {monthlyDelta.delta > 0 ? `+${monthlyDelta.delta}` : monthlyDelta.delta} this month
              </div>
            )}
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
                        <svg width="48" height="48" viewBox="0 0 48 48" style={{ overflow: 'hidden' }}>
                          <circle cx="24" cy="24" r={16} fill="none" stroke="var(--surface-3)" strokeWidth="3" />
                          <circle cx="24" cy="24" r={16} fill="none" stroke={color} strokeWidth="3"
                            strokeDasharray={`${(avg / 100) * 2 * Math.PI * 16} ${2 * Math.PI * 16}`}
                            strokeLinecap="round" transform="rotate(-90 24 24)" />
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
              <button className={`btn btn-primary ${styles.newGoalBtn}`} onClick={() => setShowAdd(true)}>
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
                <button className={`btn btn-primary ${styles.addGoalBtn}`} onClick={() => setShowAdd(true)}>
                  Add a goal
                </button>
              </div>
            ) : (
              <div className={styles.goalsGrid}>
                {filtered.map(goal => {
                  const pace = getPaceStatus(goal);
                  return (
                    <div key={goal.id} className={styles.goalCardWrap}>
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
          <MotivationalBanner
            name={name}
            goals={goals}
            streak={streak}
            hasCompletionHistory={unlockedAchievements.length > 0 || achievementXP > 0}
          />
        </div>

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
            <button className={`btn btn-ghost ${styles.seeAllBtn}`} onClick={() => navigate("/achievements")}>
              <Trophy size={14} /> See all · {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
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
