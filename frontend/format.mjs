export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function percentOf(value, total) {
  const denominator = Number(total);
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return clamp((Number(value) || 0) / denominator * 100);
}

export function formatMoney(value) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function formatMinutes(minutes) {
  const rounded = Math.max(0, Math.round(minutes));
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

export function formatWeight(kg) {
  return `${Number(kg).toFixed(Number(kg) % 1 ? 1 : 0)} kg`;
}

export function formatGoalLabel(goal) {
  const labels = {
    maintain: "Maintain",
    lose: "Lose fat",
    gain: "Build muscle",
    performance: "Performance",
  };
  return labels[goal] || "Maintain";
}

export function formatActivityLabel(activityLevel) {
  const labels = {
    light: "Light activity",
    moderate: "Moderate activity",
    active: "Active routine",
    athlete: "Athlete mode",
  };
  return labels[activityLevel] || "Moderate activity";
}

export function getTailoredGoals({ weightKg, primaryGoal, activityLevel }) {
  const activityMultipliers = { light: 28, moderate: 31, active: 34, athlete: 38 };
  const goalAdjustments = { lose: -350, maintain: 0, gain: 250, performance: 150 };
  const calories = Math.round(((Number(weightKg) || 78) * (activityMultipliers[activityLevel] || 31) + (goalAdjustments[primaryGoal] || 0)) / 50) * 50;
  const proteinMultiplier = primaryGoal === "gain" || primaryGoal === "performance" ? 1.9 : primaryGoal === "lose" ? 1.8 : 1.6;
  const weeklyWorkouts = activityLevel === "athlete" ? 5 : activityLevel === "active" ? 4 : primaryGoal === "performance" ? 4 : 3;
  return {
    calorieGoal: clamp(calories, 1400, 4200),
    proteinGoal: Math.round((Number(weightKg) || 78) * proteinMultiplier),
    hydrationGoal: Math.round(((Number(weightKg) || 78) * 35) / 50) * 50,
    weeklyWorkouts,
  };
}

export function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SP";
}

