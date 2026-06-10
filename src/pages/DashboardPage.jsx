import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoals } from "../hooks/useGoals";
import GoalCard from "../components/GoalCard";
import AddGoalModal from "../components/AddGoalModal";
import styles from "./DashboardPage.module.css";

const CATEGORY_COLORS = {
  Finance: "#7c6af7",
  Fitness: "#3ecf8e",
  Learning: "#f0a844",
  Career: "#4ab8f5",
  Health: "#f25a95",
  Travel: "#5de0e6",
  Personal: "#b8a0f7",
  Custom: "#aaa",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, deleteGoal } = useGoals(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const name = user?.displayName || user?.email?.split("@")[0] || "there";
  const categories = ["All", ...Object.keys(CATEGORY_COLORS)];

  const filtered =
    filter === "All" ? goals : goals.filter((g) => g.category === filter);
  const completed = filtered.filter((g) => g.progress >= 100).length;
  const active = filtered.filter((g) => g.progress < 100).length;
  const overallPct = filtered.length
    ? Math.round(
        filtered.reduce((s, g) => s + (g.progress || 0), 0) / filtered.length,
      )
    : 0;

  return (
    <div>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.greeting}>Hey, {name}.</h1>
          <p className={styles.subline}>
            {goals.length === 0
              ? "Add your first goal to get started."
              : `${active} active · ${completed} completed`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + New goal
        </button>
      </div>

      {goals.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{filtered.length}</span>
            <span className={styles.statLabel}>Total goals</span>
          </div>
          <div className={styles.stat}>
            <span
              className={styles.statVal}
              style={{ color: "var(--success)" }}
            >
              {completed}
            </span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal} style={{ color: "var(--accent)" }}>
              {overallPct}%
            </span>
            <span className={styles.statLabel}>Avg progress</span>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className={styles.filters}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={
                styles.filterBtn +
                (filter === cat ? " " + styles.filterActive : "")
              }
              onClick={() => setFilter(cat)}
              style={
                filter === cat && cat !== "All"
                  ? {
                      borderColor: CATEGORY_COLORS[cat],
                      color: CATEGORY_COLORS[cat],
                    }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className={styles.empty}>Loading your goals…</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {goals.length === 0
              ? "No goals yet."
              : "No goals in this category."}
          </p>
          {goals.length === 0 && (
            <button
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              onClick={() => setShowAdd(true)}
            >
              Add your first goal
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              color={CATEGORY_COLORS[goal.category] || "#aaa"}
              onClick={() => navigate(`/goal/${goal.id}`)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onAdd={async (data) => {
            await addGoal(data);
            setShowAdd(false);
          }}
          categories={Object.keys(CATEGORY_COLORS)}
        />
      )}
    </div>
  );
}
