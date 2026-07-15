// Shared streak calculation, used by both DashboardPage and StatsPage so
// there's exactly one copy of this logic to fix/maintain instead of two
// copies that can silently drift out of sync.
//
// Returns { current, best } where:
//   current = the active streak right now (0 if the last log wasn't
//             today or yesterday, i.e. the streak has already broken)
//   best    = the longest run of consecutive logged days across all history
export function calcStreak(goals) {
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