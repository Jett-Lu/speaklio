const STORAGE_KEY = "speaklio-state-v3";
const SESSION_KEY = "speaklio-auth-session-v1";
const config = window.SPEAKLIO_CONFIG || {};
const API_BASE_URL = config.API_BASE_URL || "http://localhost:3000";
const SUPABASE_URL = config.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_PUBLISHABLE_KEY = config.SUPABASE_PUBLISHABLE_KEY || "";

let authSession = loadSession();

const iconPaths = {
  home: '<path d="M3 10.5 10 4l7 6.5"/><path d="M5 9.5V17h10V9.5"/><path d="M8.5 17v-5h3v5"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.8"/>',
  grid: '<rect x="3" y="3" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1"/>',
  user: '<circle cx="10" cy="7" r="3"/><path d="M4 17c.7-2.7 2.7-4 6-4s5.3 1.3 6 4"/>',
  settings: '<circle cx="10" cy="10" r="2.7"/><path d="M17 10c0-.36-.03-.71-.08-1.05l1.44-1.12-1.6-2.77-1.72.7a6.7 6.7 0 0 0-1.84-1.06L12.95 2h-5.9L6.8 4.7a6.7 6.7 0 0 0-1.84 1.06l-1.72-.7-1.6 2.77 1.44 1.12A7.4 7.4 0 0 0 3 10c0 .36.03.71.08 1.05l-1.44 1.12 1.6 2.77 1.72-.7a6.7 6.7 0 0 0 1.84 1.06l.25 2.7h5.9l.25-2.7a6.7 6.7 0 0 0 1.84-1.06l1.72.7 1.6-2.77-1.44-1.12c.05-.34.08-.69.08-1.05Z"/>',
  calendar: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M6.5 3v3M13.5 3v3M3 8h14"/>',
  "chevron-down": '<path d="m6 8 4 4 4-4"/>',
  "chevron-right": '<path d="m8 5 5 5-5 5"/>',
  apple: '<path d="M10 7c-1.5-1.5-4-1.4-5.2.4C2.5 10.8 5.7 16.7 8 17c1 .1 1.2-.5 2-.5s1 .6 2 .5c2.3-.3 5.5-6.2 3.2-9.6C14 5.6 11.5 5.5 10 7Z"/><path d="M10 6c.1-1.7 1.1-2.7 3-3"/>',
  wallet: '<path d="M3 6.5h13a1 1 0 0 1 1 1V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/><path d="M13 11.5h4"/><circle cx="13" cy="11.5" r=".6"/>',
  moon: '<path d="M16.5 12.4A6.8 6.8 0 0 1 7.6 3.5 6.8 6.8 0 1 0 16.5 12.4Z"/>',
  bolt: '<path d="m11.5 2-7 10h5l-1 6 7-10h-5l1-6Z"/>',
  "arrow-right": '<path d="M4 10h12M12 6l4 4-4 4"/>',
  "arrow-up": '<path d="M10 16V4M6 8l4-4 4 4"/>',
  sparkles: '<path d="m10 2 1.3 4.7L16 8l-4.7 1.3L10 14l-1.3-4.7L4 8l4.7-1.3L10 2Z"/><path d="m16.5 13 .5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5ZM3.5 13l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z"/>',
  mic: '<path d="M10 13a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"/><path d="M5 10a5 5 0 0 0 10 0M10 15v3M7 18h6"/>',
  x: '<path d="M5 5l10 10M15 5 5 15"/>',
  bell: '<path d="M15 8a5 5 0 0 0-10 0c0 6-2 6-2 7h14c0-1-2-1-2-7M8 18h4"/>',
  shield: '<path d="M10 18s6-2.6 6-8V5l-6-2-6 2v5c0 5.4 6 8 6 8Z"/><path d="m7.5 10 1.7 1.7 3.4-3.4"/>',
  droplet: '<path d="M10 2.5s5 5.3 5 9a5 5 0 0 1-10 0c0-3.7 5-9 5-9Z"/>',
  heart: '<path d="M10 17s-6-3.6-6-8a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 16 9c0 4.4-6 8-6 8Z"/>',
  camera: '<path d="M6.5 6.5 8 4.5h4l1.5 2H16a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2h2.5Z"/><circle cx="10" cy="11.5" r="3"/>',
  watch: '<rect x="6" y="5" width="8" height="10" rx="3"/><path d="M8 5 8.5 2.5h3L12 5M8 15l.5 2.5h3L12 15"/><path d="M9 10.5h2"/>',
  link: '<path d="M8.2 12.4 7 13.6a3 3 0 0 1-4.2-4.2L4 8.2"/><path d="m11.8 7.6 1.2-1.2a3 3 0 0 1 4.2 4.2L16 11.8"/><path d="m7.5 12.5 5-5"/>',
  "log-out": '<path d="M8 4H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M12 6l4 4-4 4M16 10H7"/>',
};

let plugins = [
  { id: "nutrition", name: "Nutrition", icon: "apple", description: "Track meals, calories, and daily macros." },
  { id: "finance", name: "Finance", icon: "wallet", description: "Log expenses and keep an eye on your budget." },
  { id: "sleep", name: "Sleep", icon: "moon", description: "Understand your rest and sleep patterns." },
  { id: "workout", name: "Workout", icon: "bolt", description: "Plan sessions and follow your weekly progress." },
  { id: "hydration", name: "Hydration", icon: "droplet", description: "Stay consistent with your daily water goal." },
  { id: "mindfulness", name: "Mindfulness", icon: "heart", description: "Make space for calm moments in your day." },
];

const pluginUiConfig = {
  finance: {
    categories: ["Dining", "Groceries", "Transport", "Bills", "Other"],
  },
  sleep: {
    qualityOptions: ["Great", "Good", "Fair", "Poor"],
  },
  hydration: {
    presetsMl: [250, 500, 750],
  },
  mindfulness: {
    presetsMinutes: [5, 10, 15],
  },
};

const integrationCatalog = {
  "apple-health": {
    name: "Apple Health",
    icon: "watch",
    color: "workout",
    panelCopy: "Steps, workouts, heart rate, sleep, and mindful minutes.",
    detailCopy: "Apple Health sync is not connected yet. Speaklio needs a native app or HealthKit bridge before these permissions can be requested.",
    permissions: {
      read: "Steps, workouts, heart rate, sleep, active energy, mindful minutes.",
      write: "Nutrition summaries, water, workouts, and mindful moments when enabled.",
    },
  },
  "apple-watch": {
    name: "Apple Watch",
    icon: "link",
    color: "hydration",
    panelCopy: "Activity rings and workout recovery through Apple Health.",
    detailCopy: "Apple Watch data will flow through Apple Health once native HealthKit sync exists.",
    permissions: {
      read: "Activity rings, workouts, heart rate, sleep, recovery signals.",
      write: "No direct Watch writes planned for this prototype.",
    },
  },
};

let pluginMap = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]));

function firstName(name) {
  return String(name || "there").trim().split(/\s+/)[0] || "there";
}

function starterChatText(name) {
  return `Hi ${firstName(name)}. Tell me what you ate, spent, drank, or want to plan.`;
}

function syncStarterChatGreeting(targetState) {
  const starterPattern = /^Hi .+\. Tell me what you ate, spent, drank, or want to plan\.$/;
  const firstChat = targetState.chats?.[0];
  if (firstChat?.sender === "assistant" && starterPattern.test(firstChat.text)) {
    firstChat.text = starterChatText(targetState.profile.name);
  }
}

function makeDefaultState() {
  return {
    authenticated: Boolean(authSession?.access_token),
    profile: {
      name: "there",
      email: "",
      timezone: "America/Toronto",
      units: "Metric",
      notifications: true,
      weeklySummary: true,
      assistantInsights: true,
      compactCards: false,
      personal: {
        age: 29,
        heightCm: 178,
        weightKg: 78,
        activityLevel: "moderate",
      },
      goals: {
        primaryGoal: "maintain",
        targetWeightKg: 75,
        calorieGoal: 2100,
        proteinGoal: 120,
        hydrationGoal: 2700,
        weeklyWorkouts: 4,
      },
    },
    nutrition: { calories: 0, goal: 2100, protein: 0, carbs: 0, fats: 0 },
    finance: { spending: 0, budget: 2000 },
    sleep: { minutes: 0, quality: "Not logged", week: [0, 0, 0, 0, 0, 0, 0] },
    workout: { title: "No workout planned", time: "Not scheduled", duration: 0, completed: 0, goal: 4 },
    hydration: { ml: 0, goal: 2700 },
    mindfulness: { count: 0, title: "Mindful moment", duration: 10 },
    installedPlugins: new Set(),
    currentView: "home",
    activityFilter: "all",
    activitySearch: "",
    activities: [],
    chats: [
      { sender: "assistant", text: starterChatText("there") },
    ],
  };
}

function loadState() {
  const defaults = makeDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaults;

    if (authSession?.access_token) {
      return {
        ...defaults,
        currentView: typeof saved.currentView === "string" ? saved.currentView : defaults.currentView,
        activityFilter: typeof saved.activityFilter === "string" ? saved.activityFilter : defaults.activityFilter,
        activitySearch: typeof saved.activitySearch === "string" ? saved.activitySearch : defaults.activitySearch,
        chats: Array.isArray(saved.chats) && saved.chats.length ? saved.chats : defaults.chats,
      };
    }

    return {
      ...defaults,
      ...saved,
      authenticated: false,
      profile: {
        ...defaults.profile,
        ...saved.profile,
        personal: { ...defaults.profile.personal, ...saved.profile?.personal },
        goals: { ...defaults.profile.goals, ...saved.profile?.goals },
      },
      nutrition: { ...defaults.nutrition, ...saved.nutrition },
      finance: { ...defaults.finance, ...saved.finance },
      sleep: { ...defaults.sleep, ...saved.sleep },
      workout: { ...defaults.workout, ...saved.workout },
      hydration: { ...defaults.hydration, ...saved.hydration },
      mindfulness: { ...defaults.mindfulness, ...saved.mindfulness },
      installedPlugins: new Set(saved.installedPlugins || [...defaults.installedPlugins]),
      currentView: typeof saved.currentView === "string" ? saved.currentView : defaults.currentView,
      activityFilter: typeof saved.activityFilter === "string" ? saved.activityFilter : defaults.activityFilter,
      activitySearch: typeof saved.activitySearch === "string" ? saved.activitySearch : defaults.activitySearch,
      activities: Array.isArray(saved.activities) ? saved.activities : defaults.activities,
      chats: Array.isArray(saved.chats) && saved.chats.length ? saved.chats : defaults.chats,
    };
  } catch {
    return defaults;
  }
}

let state = loadState();
syncStarterChatGreeting(state);

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".nav-item");
const assistantPanel = document.getElementById("assistant-panel");
const overlay = document.getElementById("overlay");
const input = document.getElementById("assistant-input");
const chatStream = document.getElementById("chat-stream");
const micButton = document.getElementById("mic-button");
const toast = document.getElementById("toast");
const modal = document.getElementById("app-modal");
const modalEyebrow = document.getElementById("modal-eyebrow");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const activitySearch = document.getElementById("activity-search");
const assistantPreviewTitle = document.getElementById("assistant-preview-title");
const assistantPreviewCopy = document.getElementById("assistant-preview-copy");
const backendStatus = document.getElementById("backend-status");
const backendStatusCopy = document.getElementById("backend-status-copy");
let pendingAssistantPreview = null;
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const otpPanel = document.getElementById("otp-panel");
const otpForm = document.getElementById("otp-form");
const loginCode = document.getElementById("login-code");
const authStatus = document.getElementById("auth-status");
const accountSetupPanel = document.getElementById("account-setup-panel");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatMoney(value) {
  return Number(value).toLocaleString(undefined, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

function formatMinutes(minutes) {
  const rounded = Math.max(0, Math.round(minutes));
  return `${Math.floor(rounded / 60)}h ${rounded % 60}m`;
}

function formatWeight(kg) {
  return `${Number(kg).toFixed(Number(kg) % 1 ? 1 : 0)} kg`;
}

function formatGoalLabel(goal) {
  const labels = {
    maintain: "Maintain",
    lose: "Lose fat",
    gain: "Build muscle",
    performance: "Performance",
  };
  return labels[goal] || "Maintain";
}

function formatActivityLabel(activityLevel) {
  const labels = {
    light: "Light activity",
    moderate: "Moderate activity",
    active: "Active routine",
    athlete: "Athlete mode",
  };
  return labels[activityLevel] || "Moderate activity";
}

function optionMarkup(value, label, selectedValue) {
  return `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function optionsMarkup(values, selectedValue) {
  return values.map((value) => optionMarkup(value, value, selectedValue)).join("");
}

function presetButtons(values, action, formatter) {
  return values
    .map((value) => `<button class="preset-button" data-modal-action="${escapeHtml(action)}" data-amount="${value}">${escapeHtml(formatter(value))}</button>`)
    .join("");
}

function integrationCardMarkup(integrationId) {
  const integration = integrationCatalog[integrationId];
  if (!integration) return "";

  return `
    <article class="integration-card">
      <span class="plugin-icon ${escapeHtml(integration.color)}">${iconMarkup(integration.icon)}</span>
      <div>
        <strong>${escapeHtml(integration.name)}</strong>
        <small>${escapeHtml(integration.panelCopy)}</small>
      </div>
      <button class="store-detail-button" type="button" data-integration-action="${escapeHtml(integrationId)}">Coming soon</button>
    </article>
  `;
}

function accountEmailField() {
  if (!state.authenticated) {
    return `<label>Email<input required name="email" type="email" value="${escapeHtml(state.profile.email)}" /></label>`;
  }

  return `
    <label>Email<input name="email" type="email" value="${escapeHtml(state.profile.email)}" readonly aria-describedby="account-email-note" /></label>
    <p class="field-note" id="account-email-note">This is your sign-in email. Email change confirmation is not available yet.</p>
  `;
}

function getTailoredGoals({ weightKg, primaryGoal, activityLevel }) {
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

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "JM";
}

function iconMarkup(name) {
  return `<span class="icon"><svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[name] || ""}</svg></span>`;
}

function installStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((element) => {
    element.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[element.dataset.icon] || ""}</svg>`;
  });
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session) {
  authSession = session;
  if (session?.access_token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function authHeaders() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

function apiHeaders() {
  return {
    Authorization: `Bearer ${authSession?.access_token || ""}`,
    "Content-Type": "application/json",
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.error || payload?.message || "Request failed");
  }
  return payload;
}

async function requestOtp(email) {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase publishable key. Restart the frontend server after local Supabase is running.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      create_user: true,
      data: { display_name: state.profile.name },
    }),
  });
  await parseJsonResponse(response);
}

async function verifyOtp(email, token) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, token, type: "email" }),
  });
  return parseJsonResponse(response);
}

async function apiRequest(path, options = {}) {
  if (!authSession?.access_token) throw new Error("Please sign in first.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  });
  return parseJsonResponse(response);
}

function setPluginCatalog(nextPlugins) {
  if (!Array.isArray(nextPlugins) || nextPlugins.length === 0) return;
  plugins = nextPlugins.map((plugin) => ({
    id: String(plugin.id),
    name: String(plugin.name),
    icon: String(plugin.icon || "sparkles"),
    description: String(plugin.description || ""),
    enabled: Boolean(plugin.enabled),
  }));
  pluginMap = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]));
}

function formatEntryDay(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatEntryTime(value) {
  const date = new Date(value);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function isSameDay(value, date = new Date()) {
  return new Date(value).toDateString() === date.toDateString();
}

function isSameMonth(value, date = new Date()) {
  const entryDate = new Date(value);
  return entryDate.getMonth() === date.getMonth() && entryDate.getFullYear() === date.getFullYear();
}

function isThisWeek(value) {
  const entryDate = new Date(value);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return entryDate >= weekStart && entryDate <= now;
}

function entryToActivity(entry) {
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
  const pluginId = entry.pluginId || "speaklio";
  const entryType = String(entry.entryType || "entry");

  if (entryType === "log_food") {
    const food = metadata.food || "food";
    return {
      id: entry.id,
      plugin: pluginId,
      title: `Logged ${food}`,
      detail: `${metadata.meal || "Meal"}${metadata.calories ? ` - ${metadata.calories} cal` : ""}`,
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  if (entryType === "log_expense") {
    return {
      id: entry.id,
      plugin: pluginId,
      title: `Added ${metadata.note || metadata.category || "expense"}`,
      detail: `${metadata.category || "Expense"} - $${Number(entry.value || 0).toFixed(2)}`,
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  if (entryType === "log_hydration") {
    return {
      id: entry.id,
      plugin: pluginId,
      title: "Added water",
      detail: `${Number(entry.value || 0)} ${entry.unit || "ml"}`,
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  if (entryType === "log_sleep") {
    return {
      id: entry.id,
      plugin: pluginId,
      title: "Updated sleep summary",
      detail: `${formatMinutes(Number(entry.value || 0))} - ${metadata.quality || "Logged"} quality`,
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  if (entryType === "log_workout") {
    const exercise = metadata.exercise || metadata.title || "workout";
    return {
      id: entry.id,
      plugin: pluginId,
      title: `Logged ${exercise}`,
      detail: [metadata.sets ? `${metadata.sets} sets` : null, metadata.duration ? `${metadata.duration} min` : null].filter(Boolean).join(" - ") || "Workout logged",
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  if (entryType === "log_mindfulness") {
    return {
      id: entry.id,
      plugin: pluginId,
      title: "Completed mindful moment",
      detail: `${Number(entry.value || 0)} minutes`,
      day: formatEntryDay(entry.occurredAt),
      time: formatEntryTime(entry.occurredAt),
    };
  }

  return {
    id: entry.id,
    plugin: pluginId,
    title: `Logged ${entryType.replaceAll("_", " ")}`,
    detail: entry.unit ? `${entry.value ?? ""} ${entry.unit}`.trim() : "Entry added",
    day: formatEntryDay(entry.occurredAt),
    time: formatEntryTime(entry.occurredAt),
  };
}

function backendActivityToTimelineItem(activity) {
  return {
    id: activity.id,
    plugin: activity.pluginId || "speaklio",
    title: activity.title || "Activity",
    detail: activity.detail || "Updated",
    day: formatEntryDay(activity.occurredAt || activity.createdAt),
    time: formatEntryTime(activity.occurredAt || activity.createdAt),
  };
}

function applyActivities(activities) {
  state.activities = Array.isArray(activities)
    ? activities.map(backendActivityToTimelineItem)
    : [];
}

function applyEntries(entries) {
  const defaults = makeDefaultState();
  state.nutrition = { ...defaults.nutrition, goal: state.profile.goals.calorieGoal, calories: 0, protein: 0, carbs: 0, fats: 0 };
  state.finance = { ...defaults.finance, spending: 0 };
  state.sleep = { ...defaults.sleep };
  state.workout = { ...defaults.workout, completed: 0, goal: state.profile.goals.weeklyWorkouts };
  state.hydration = { ...defaults.hydration, ml: 0, goal: state.profile.goals.hydrationGoal };
  state.mindfulness = { ...defaults.mindfulness, count: 0 };

  entries.forEach((entry) => {
    const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
    const occurredAt = entry.occurredAt || entry.createdAt;
    const happenedToday = isSameDay(occurredAt);
    const happenedThisWeek = isThisWeek(occurredAt);

    if (entry.entryType === "log_food" && happenedToday) {
      state.nutrition.calories += Number(metadata.calories || entry.value || 0);
      state.nutrition.protein += Number(metadata.protein || 0);
      state.nutrition.carbs += Number(metadata.carbs || 0);
      state.nutrition.fats += Number(metadata.fats || 0);
    }
    if (entry.entryType === "log_calories" && happenedToday) state.nutrition.calories += Number(entry.value || 0);
    if (entry.entryType === "log_expense" && isSameMonth(occurredAt)) state.finance.spending += Number(entry.value || 0);
    if (entry.entryType === "log_hydration" && happenedToday) state.hydration.ml += Number(entry.value || 0);
    if (entry.entryType === "log_mindfulness" && happenedThisWeek) state.mindfulness.count += 1;
    if (entry.entryType === "log_sleep") {
      state.sleep.minutes = Number(entry.value || state.sleep.minutes);
      state.sleep.quality = String(metadata.quality || state.sleep.quality);
      state.sleep.week[state.sleep.week.length - 1] = state.sleep.minutes;
    }
    if (entry.entryType === "log_workout") {
      state.workout.completed += metadata.completed && happenedThisWeek ? 1 : 0;
      state.workout.title = String(metadata.exercise || metadata.title || state.workout.title);
      state.workout.duration = Number(metadata.duration || state.workout.duration);
    }
  });

  state.activities = entries.map(entryToActivity);
}

function applyDashboardSummary(payload) {
  const defaults = makeDefaultState();
  const summary = payload && typeof payload === "object" ? payload : {};

  state.nutrition = {
    ...defaults.nutrition,
    goal: state.profile.goals.calorieGoal,
    ...(summary.nutrition && typeof summary.nutrition === "object" ? summary.nutrition : {}),
  };
  state.finance = {
    ...defaults.finance,
    ...(summary.finance && typeof summary.finance === "object" ? summary.finance : {}),
  };
  state.sleep = {
    ...defaults.sleep,
    ...(summary.sleep && typeof summary.sleep === "object" ? summary.sleep : {}),
  };
  state.workout = {
    ...defaults.workout,
    goal: state.profile.goals.weeklyWorkouts,
    ...(summary.workout && typeof summary.workout === "object" ? summary.workout : {}),
  };
  state.hydration = {
    ...defaults.hydration,
    goal: state.profile.goals.hydrationGoal,
    ...(summary.hydration && typeof summary.hydration === "object" ? summary.hydration : {}),
  };
  state.mindfulness = {
    ...defaults.mindfulness,
    ...(summary.mindfulness && typeof summary.mindfulness === "object" ? summary.mindfulness : {}),
  };
}

function applyRemoteProfile(payload) {
  const displayName = payload.profile?.display_name || payload.user?.email?.split("@")[0] || state.profile.name;
  state.profile.name = displayName;
  state.profile.email = payload.user?.email || payload.profile?.email || state.profile.email;
  state.profile.timezone = payload.profile?.timezone || state.profile.timezone;
  state.profile.personal = {
    ...state.profile.personal,
    ...(payload.profile?.personal_data && typeof payload.profile.personal_data === "object" ? payload.profile.personal_data : {}),
  };
  state.profile.goals = {
    ...state.profile.goals,
    ...(payload.profile?.goals && typeof payload.profile.goals === "object" ? payload.profile.goals : {}),
  };
  state.profile = {
    ...state.profile,
    ...(payload.profile?.preferences && typeof payload.profile.preferences === "object" ? payload.profile.preferences : {}),
  };
  syncStarterChatGreeting(state);
}

async function loadBackendData() {
  const [me, pluginPayload, summaryPayload, activityPayload] = await Promise.all([
    apiRequest("/me"),
    apiRequest("/plugins"),
    apiRequest("/dashboard/summary"),
    apiRequest("/activities?limit=100"),
  ]);
  applyRemoteProfile(me);
  setPluginCatalog(pluginPayload.plugins || []);
  state.installedPlugins = new Set((pluginPayload.plugins || []).filter((plugin) => plugin.enabled).map((plugin) => plugin.id));
  applyDashboardSummary(summaryPayload.summary);
  applyActivities(activityPayload.activities || []);
  state.authenticated = true;
  clearBackendStatus();
  saveState();
  renderAll();
}

async function createBackendEntry(entry) {
  const payload = await apiRequest("/entries", {
    method: "POST",
    body: JSON.stringify({
      occurredAt: new Date().toISOString(),
      ...entry,
    }),
  });
  await loadBackendData();
  return payload;
}

function currentProfilePayload() {
  return {
    displayName: state.profile.name,
    timezone: state.profile.timezone,
    personal: state.profile.personal,
    goals: state.profile.goals,
    preferences: {
      units: state.profile.units,
      notifications: state.profile.notifications,
      weeklySummary: state.profile.weeklySummary,
      assistantInsights: state.profile.assistantInsights,
      compactCards: state.profile.compactCards,
    },
  };
}

async function saveProfileSettings(overrides = {}) {
  if (!state.authenticated || !authSession?.access_token) return null;
  const payload = {
    ...currentProfilePayload(),
    ...overrides,
  };
  const result = await apiRequest("/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  applyRemoteProfile({ profile: result.profile });
  saveState();
  renderAll();
  return result.profile;
}

function saveState() {
  try {
    if (state.authenticated && authSession?.access_token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scope: "local-ui",
        currentView: state.currentView,
        activityFilter: state.activityFilter,
        activitySearch: state.activitySearch,
        chats: state.chats,
      }));
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      installedPlugins: [...state.installedPlugins],
    }));
  } catch {
    showToast("This browser could not save the latest update.");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function clearBackendStatus() {
  if (backendStatus) backendStatus.hidden = true;
}

function showBackendLoadError(error) {
  const detail = error instanceof Error ? error.message : "Backend request failed";
  if (backendStatusCopy) {
    backendStatusCopy.textContent = `Your session is still saved. ${detail}`;
  }
  if (backendStatus) backendStatus.hidden = false;
  showToast("Unable to refresh backend data");
}

window.addEventListener("unhandledrejection", (event) => {
  showToast(event.reason?.message || "Something went wrong");
});

function updateDateAndProfile() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = state.profile.name.split(/\s+/)[0] || "there";
  const { personal, goals } = state.profile;
  document.getElementById("current-date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase();
  document.getElementById("greeting").textContent = `${greeting}, ${firstName}.`;
  document.getElementById("profile-name").textContent = state.profile.name;
  document.getElementById("profile-email").textContent = state.profile.email;
  document.querySelector(".mini-profile strong").textContent = state.profile.name;
  if (loginEmail) loginEmail.value = state.profile.email;
  document.getElementById("profile-weight").textContent = formatWeight(personal.weightKg);
  document.getElementById("profile-height").textContent = `${personal.heightCm} cm tall`;
  document.getElementById("profile-goal").textContent = formatGoalLabel(goals.primaryGoal);
  document.getElementById("profile-target-weight").textContent = `Target ${formatWeight(goals.targetWeightKg)}`;
  document.getElementById("profile-calorie-goal").textContent = `${goals.calorieGoal.toLocaleString()} cal`;
  document.getElementById("profile-protein-goal").textContent = `${goals.proteinGoal}g protein`;
  document.getElementById("profile-age").textContent = `${personal.age} years old`;
  document.getElementById("profile-activity-level").textContent = formatActivityLabel(personal.activityLevel);
  document.getElementById("profile-workout-goal").textContent = `${goals.weeklyWorkouts} workouts weekly`;
  document.getElementById("profile-hydration-goal").textContent = `${(goals.hydrationGoal / 1000).toFixed(1)} L water daily.`;
  document.querySelectorAll(".avatar, .large-avatar").forEach((avatar) => {
    avatar.textContent = initials(state.profile.name);
  });
}

function syncProfileGoalsToDashboard() {
  state.nutrition.goal = state.profile.goals.calorieGoal;
  state.workout.goal = state.profile.goals.weeklyWorkouts;
  state.hydration.goal = state.profile.goals.hydrationGoal;
}

function updateDailyBalance() {
  if (state.authenticated && state.activities.length === 0) {
    document.getElementById("balance-score").textContent = "0";
    document.getElementById("balance-ring").style.strokeDasharray = "0 100";
    document.getElementById("balance-ring-wrap").setAttribute("aria-label", "Daily balance score 0");
    document.getElementById("balance-title").textContent = "Start with one logged update";
    document.getElementById("balance-copy").textContent = "Your real progress appears after your first entry.";
    return;
  }

  const metrics = [
    clamp((state.nutrition.calories / state.nutrition.goal) * 100),
    state.finance.spending <= state.finance.budget ? 100 : clamp((state.finance.budget / state.finance.spending) * 100),
    clamp((state.sleep.minutes / 480) * 100),
    clamp((state.workout.completed / state.workout.goal) * 100),
  ];
  if (state.installedPlugins.has("hydration")) metrics.push(clamp((state.hydration.ml / state.hydration.goal) * 100));
  const score = Math.round(metrics.reduce((total, metric) => total + metric, 0) / metrics.length);
  const onTrack = metrics.filter((metric) => metric >= 70).length;
  document.getElementById("balance-score").textContent = score;
  document.getElementById("balance-ring").style.strokeDasharray = `${score} 100`;
  document.getElementById("balance-ring-wrap").setAttribute("aria-label", `Daily balance score ${score}`);
  document.getElementById("balance-title").textContent = score >= 75 ? "You are doing well today" : "A few small wins will help";
  document.getElementById("balance-copy").textContent = `${onTrack} of ${metrics.length} daily goals are on track.`;
}

function updateInsightPanel() {
  const hasEntries = state.activities.length > 0;
  const proteinLeft = Math.max(0, state.profile.goals.proteinGoal - state.nutrition.protein);
  const budgetLeft = state.finance.budget - state.finance.spending;
  const sleepAverage = state.sleep.week.reduce((sum, value) => sum + value, 0) / state.sleep.week.length;
  const readiness = sleepAverage >= 420 && state.workout.completed >= Math.max(1, state.workout.goal - 1) ? "Good" : "Steady";

  document.getElementById("next-action-title").textContent = !hasEntries
    ? "Log your first update"
    : proteinLeft
    ? "Plan protein before dinner"
    : "Keep dinner light and simple";
  document.getElementById("next-action-copy").textContent = !hasEntries
    ? "Try a meal, expense, sleep, workout, water, or mindfulness entry."
    : proteinLeft
    ? `${proteinLeft}g protein left keeps today's nutrition balanced.`
    : "You are on pace for nutrition today.";
  document.getElementById("readiness-score").textContent = hasEntries ? readiness : "Not logged";
  document.getElementById("streak-count").textContent = `${Math.min(7, state.activities.length)} days`;
  document.getElementById("attention-nutrition-title").textContent = !hasEntries ? "No meals logged" : proteinLeft ? "Protein target" : "Nutrition pacing";
  document.getElementById("attention-nutrition-copy").textContent = !hasEntries
    ? "Nutrition insights appear after you log food or calories."
    : proteinLeft
    ? `${proteinLeft}g left to reach today's goal.`
    : "Macros are in a healthy range today.";
  document.getElementById("attention-finance-title").textContent = budgetLeft >= 0 ? "Budget pace" : "Budget overrun";
  document.getElementById("attention-finance-copy").textContent = budgetLeft >= 0
    ? `$${formatMoney(budgetLeft)} left this month.`
    : `$${formatMoney(Math.abs(budgetLeft))} over budget.`;
  document.getElementById("agenda-workout-title").textContent = state.workout.title;
  document.getElementById("agenda-workout-meta").textContent = state.workout.duration
    ? `${state.workout.duration} minute workout`
    : "No workout scheduled";
}

function updateMetrics() {
  const nutritionPercent = Math.round((state.nutrition.calories / state.nutrition.goal) * 100);
  document.getElementById("calorie-count").textContent = state.nutrition.calories.toLocaleString();
  document.getElementById("nutrition-percent").textContent = `${nutritionPercent}%`;
  document.getElementById("nutrition-ring").style.strokeDasharray = `${clamp(nutritionPercent)} 100`;
  document.getElementById("protein-count").textContent = `${state.nutrition.protein}g`;
  document.getElementById("carbs-count").textContent = `${state.nutrition.carbs}g`;
  document.getElementById("fats-count").textContent = `${state.nutrition.fats}g`;

  const budgetLeft = state.finance.budget - state.finance.spending;
  const financePercent = Math.round((state.finance.spending / state.finance.budget) * 100);
  document.getElementById("spending-count").textContent = `$${formatMoney(state.finance.spending)}`;
  document.getElementById("budget-left").textContent = budgetLeft >= 0 ? `$${formatMoney(budgetLeft)} left` : `$${formatMoney(Math.abs(budgetLeft))} over`;
  document.getElementById("finance-progress").style.width = `${clamp(financePercent)}%`;
  const trend = document.getElementById("finance-trend");
  trend.textContent = budgetLeft >= 0 ? `${100 - financePercent}% left` : `${financePercent - 100}% over`;
  trend.classList.toggle("negative", budgetLeft < 0);

  document.getElementById("sleep-count").textContent = formatMinutes(state.sleep.minutes);
  document.getElementById("sleep-quality").textContent = state.sleep.quality;
  const hasSleepData = state.sleep.week.some((minutes) => minutes > 0);
  document.querySelectorAll(".sleep-bars span").forEach((bar, index) => {
    bar.style.height = hasSleepData ? `${clamp((state.sleep.week[index] / 540) * 100, 20, 100)}%` : "0%";
  });

  document.getElementById("workout-title").textContent = state.workout.title;
  document.getElementById("workout-time").textContent = state.workout.duration
    ? `${state.workout.time} - ${state.workout.duration} min`
    : state.workout.time;
  document.getElementById("workout-goal").textContent = `${state.workout.completed} of ${state.workout.goal} sessions`;

  const hydrationPercent = Math.round((state.hydration.ml / state.hydration.goal) * 100);
  const hydrationLeft = Math.max(0, state.hydration.goal - state.hydration.ml);
  document.getElementById("hydration-count").textContent = `${(state.hydration.ml / 1000).toFixed(1)} L`;
  document.getElementById("hydration-goal-copy").textContent = `of ${(state.hydration.goal / 1000).toFixed(1)} L today`;
  document.getElementById("hydration-percent").textContent = `${hydrationPercent}%`;
  document.getElementById("hydration-progress").style.width = `${clamp(hydrationPercent)}%`;
  document.getElementById("hydration-left").textContent = hydrationLeft ? `${(hydrationLeft / 1000).toFixed(1)} L left` : "Goal reached";

  document.getElementById("mindfulness-title").textContent = state.mindfulness.title;
  document.getElementById("mindfulness-time").textContent = `${state.mindfulness.duration}-minute guided breathing`;
  document.getElementById("mindfulness-count").textContent = `${state.mindfulness.count} mindful moments`;

  document.body.classList.toggle("compact-mode", state.profile.compactCards);
  updateInsightPanel();
  updateDailyBalance();
}

function activityMarkup(item) {
  const plugin = pluginMap[item.plugin] || { icon: "sparkles", name: "Speaklio" };
  return `
    <article class="activity-item">
      <span class="plugin-icon ${escapeHtml(item.plugin)}">${iconMarkup(plugin.icon)}</span>
      <div class="activity-item-copy">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </div>
      <span class="activity-time">${escapeHtml(item.time)}</span>
    </article>
  `;
}

function renderActivity() {
  const searchTerm = state.activitySearch.trim().toLowerCase();
  if (activitySearch && activitySearch.value !== state.activitySearch) {
    activitySearch.value = state.activitySearch;
  }

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === state.activityFilter);
  });
  document.getElementById("home-activity-list").innerHTML = state.activities.length
    ? state.activities.slice(0, 3).map(activityMarkup).join("")
    : '<p class="empty-state">Your latest updates will appear here.</p>';

  const byPlugin = state.activityFilter === "all"
    ? state.activities
    : state.activities.filter((item) => item.plugin === state.activityFilter);
  const filtered = searchTerm
    ? byPlugin.filter((item) => `${item.title} ${item.detail} ${item.plugin}`.toLowerCase().includes(searchTerm))
    : byPlugin;
  const grouped = filtered.reduce((groups, item) => {
    groups[item.day] ||= [];
    groups[item.day].push(item);
    return groups;
  }, {});

  document.getElementById("activity-timeline").innerHTML = Object.entries(grouped)
    .map(([day, items]) => `
      <section class="timeline-group">
        <p class="timeline-date">${escapeHtml(day.toUpperCase())}</p>
        ${items.map(activityMarkup).join("")}
      </section>
    `)
    .join("") || '<p class="empty-state">No activity for this filter yet.</p>';
  updateActivitySummary();
}

function updateActivitySummary() {
  const todayCount = state.activities.filter((item) => item.day === "Today").length;
  const countsByPlugin = state.activities.reduce((counts, item) => {
    counts[item.plugin] = (counts[item.plugin] || 0) + 1;
    return counts;
  }, {});
  const topPluginId = Object.entries(countsByPlugin).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topPlugin = topPluginId ? pluginMap[topPluginId]?.name || "Speaklio" : "None";

  document.getElementById("activity-today-count").textContent = todayCount;
  document.getElementById("activity-week-count").textContent = state.activities.length;
  document.getElementById("activity-top-plugin").textContent = topPlugin;
}

function renderPlugins() {
  document.getElementById("plugin-installed-count").textContent = `${state.installedPlugins.size} of ${plugins.length} active`;
  document.getElementById("plugin-store-grid").innerHTML = plugins.map((plugin) => {
    const installed = state.installedPlugins.has(plugin.id);
    return `
      <article class="store-card">
        <div class="store-card-top">
          <span class="plugin-icon ${plugin.id}">${iconMarkup(plugin.icon)}</span>
          <div>
            <h3>${plugin.name}</h3>
            <small>${installed ? "On your dashboard" : "Available"}</small>
          </div>
        </div>
        <p>${plugin.description}</p>
        <div class="store-card-meta">
          <span>${installed ? "Configured" : "Ready to add"}</span>
          <span>${plugin.id === "finance" ? "Private" : "Daily"}</span>
        </div>
        <div class="store-card-actions">
          ${installed ? `<button class="store-detail-button" data-plugin-open="${plugin.id}">Open</button>` : ""}
          <button class="install-button ${installed ? "installed" : ""}" data-plugin-toggle="${plugin.id}">
            ${installed ? "Remove" : "Add plugin"}
          </button>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-plugin-card]").forEach((card) => {
    card.hidden = !state.installedPlugins.has(card.dataset.pluginCard);
  });
}

function renderChats() {
  chatStream.innerHTML = `<div class="chat-day">TODAY</div>${state.chats.map((message) => `
    <div class="chat-bubble ${escapeHtml(message.sender)}">
      ${message.sender === "assistant" ? `<div class="bot-mark">${iconMarkup("sparkles")}</div>` : ""}
      <p>${escapeHtml(message.text)}</p>
    </div>
  `).join("")}`;
  chatStream.scrollTop = chatStream.scrollHeight;
}

function renderAuthState() {
  document.body.classList.toggle("signed-out", !state.authenticated);
  if (loginEmail) loginEmail.value = state.profile.email;
  if (otpPanel && state.authenticated) otpPanel.hidden = true;
  if (authStatus && state.authenticated) authStatus.textContent = "";
}

function renderAll() {
  renderAuthState();
  syncProfileGoalsToDashboard();
  updateDateAndProfile();
  updateMetrics();
  renderActivity();
  renderPlugins();
  renderChats();
}

async function signIn(email) {
  const cleanEmail = String(email || "").trim();
  if (!cleanEmail) return;
  state.profile.email = cleanEmail;
  await requestOtp(cleanEmail);
  if (otpPanel) otpPanel.hidden = false;
  if (authStatus) authStatus.textContent = `Code sent to ${cleanEmail}. Open Mailpit at http://127.0.0.1:54324.`;
  loginCode?.focus();
  saveState();
  showToast("Sign-in code sent");
}

async function completeSignIn(code) {
  const sessionPayload = await verifyOtp(state.profile.email, String(code || "").trim());
  saveSession(sessionPayload);
  state.authenticated = true;
  hideAccountSetup();
  try {
    await loadBackendData();
    openView("home");
    showToast("Signed in to Speaklio");
  } catch (error) {
    saveState();
    renderAll();
    showBackendLoadError(error);
  }
}

function signOut() {
  saveSession(null);
  state = makeDefaultState();
  pendingAssistantPreview = null;
  clearBackendStatus();
  closeModal();
  hideAssistant();
  openView("home");
  hideAccountSetup();
  saveState();
  renderAll();
}

function showAccountSetup() {
  accountSetupPanel.hidden = false;
}

function hideAccountSetup() {
  accountSetupPanel.hidden = true;
}

function addActivity(activity) {
  state.activities.unshift({
    id: Date.now(),
    ...activity,
    day: "Today",
    time: "Just now",
  });
  saveState();
  renderActivity();
}

function addMessage(text, sender) {
  state.chats.push({ sender, text });
  if (state.chats.length > 20) state.chats = state.chats.slice(-20);
  saveState();
  renderChats();
}

function setAssistantPreview(title, copy) {
  assistantPreviewTitle.textContent = title;
  assistantPreviewCopy.textContent = copy;
}

function pluginLabel(pluginId) {
  return pluginMap[pluginId]?.name || pluginId || "Speaklio";
}

function normalizePreviewEntry(entry) {
  const occurredAt = entry.occurredAt ? new Date(entry.occurredAt) : null;
  return {
    pluginId: entry.pluginId ?? null,
    entryType: entry.entryType,
    value: entry.value ?? null,
    unit: entry.unit ?? null,
    metadata: entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {},
    ...(occurredAt && !Number.isNaN(occurredAt.getTime()) ? { occurredAt: occurredAt.toISOString() } : {}),
  };
}

function describePreviewEntry(entry) {
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
  const label = pluginLabel(entry.pluginId);
  if (entry.entryType === "log_food") {
    return `${label}: ${metadata.food || "food"}${entry.value ? `, ${entry.value} ${entry.unit || "cal"}` : ""}`;
  }
  if (entry.entryType === "log_calories") {
    return `${label}: ${entry.value || 0} ${entry.unit || "cal"}`;
  }
  if (entry.entryType === "log_workout") {
    return `${label}: ${metadata.exercise || metadata.title || "workout"}`;
  }
  if (entry.entryType === "log_expense") {
    return `${label}: $${formatMoney(Number(entry.value || 0))} ${metadata.category || "expense"}`;
  }
  if (entry.entryType === "log_sleep") {
    return `${label}: ${formatMinutes(Number(entry.value || 0))}${metadata.quality ? `, ${metadata.quality}` : ""}`;
  }
  if (entry.entryType === "log_hydration") {
    return `${label}: ${entry.value || 0} ${entry.unit || "ml"}`;
  }
  if (entry.entryType === "log_mindfulness") {
    return `${label}: ${entry.value || 0} min${metadata.title ? `, ${metadata.title}` : ""}`;
  }
  if (entry.entryType === "log_weight") {
    return `${label}: ${entry.value || 0} ${entry.unit || ""}`.trim();
  }
  return `${label}: ${entry.entryType.replaceAll("_", " ")}`;
}

async function previewBackendAssistantRequest(text) {
  try {
    const payload = await apiRequest("/ai/preview-entry", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const previews = Array.isArray(payload.previews) ? payload.previews : [];
    const entries = previews
      .map((preview) => preview.entry)
      .filter(Boolean)
      .map(normalizePreviewEntry);

    if (entries.length === 0) {
      pendingAssistantPreview = null;
      return false;
    }

    pendingAssistantPreview = { entries, previews, text };
    const descriptions = entries.map(describePreviewEntry);
    setAssistantPreview(
      `${entries.length} action${entries.length === 1 ? "" : "s"} ready`,
      `${descriptions.join(" - ")}. Confirm to save ${entries.length === 1 ? "it" : "them"}.`,
    );
    addMessage(payload.message || `I prepared ${entries.length === 1 ? "an entry" : `${entries.length} entries`} for review. Confirm when it looks right.`, "assistant");
    return true;
  } catch (error) {
    pendingAssistantPreview = null;
    setAssistantPreview("Assistant fallback", "Local AI is unavailable, so Speaklio will use the basic logger for this request.");
    return false;
  }
}

async function confirmAssistantPreview() {
  if (!pendingAssistantPreview?.entries?.length) {
    showToast("No pending assistant action");
    return;
  }

  const payload = await apiRequest("/ai/confirm-actions", {
    method: "POST",
    body: JSON.stringify({ entries: pendingAssistantPreview.entries }),
  });
  const count = payload.entries?.length || pendingAssistantPreview.entries.length;
  pendingAssistantPreview = null;
  setAssistantPreview("No pending action", "Ask Speaklio to log something and this panel will prepare a structured update for your review.");
  await loadBackendData();
  addMessage(`Saved ${count} ${count === 1 ? "entry" : "entries"} to your dashboard.`, "assistant");
  showToast("Assistant action saved");
}

function editAssistantPreview() {
  const entry = pendingAssistantPreview?.entries?.[0];
  if (!entry) {
    showToast("No pending assistant action");
    return;
  }

  if (entry.pluginId && pluginMap[entry.pluginId]) {
    openPlugin(entry.pluginId);
    addMessage(`Opened ${pluginLabel(entry.pluginId)} so you can adjust the details before saving.`, "assistant");
    return;
  }

  showToast("This assistant action is not editable yet");
}

function previewAssistantRequest(text) {
  const lower = text.toLowerCase();
  if (/(water|drank|hydrate|hydration)/.test(lower)) {
    setAssistantPreview("Hydration entry", "Ready to add this amount to today's water total after confirmation.");
    return;
  }

  if (/(spent|expense|paid|bought)/.test(lower)) {
    setAssistantPreview("Finance entry", "Ready to create an expense with amount, category, and note.");
    return;
  }

  if (/(sleep|slept|last night)/.test(lower)) {
    setAssistantPreview("Sleep update", "Ready to update last night's duration and quality.");
    return;
  }

  if (/(workout|exercise|training)/.test(lower)) {
    setAssistantPreview("Workout plan", "Ready to save the workout name, time, and duration.");
    return;
  }

  if (/(calories|nutrition|macros|eggs|toast|breakfast|lunch|dinner|snack|ate|meal)/.test(lower)) {
    setAssistantPreview("Nutrition entry", "Ready to log the meal details and update today's nutrition totals.");
    return;
  }

  setAssistantPreview("Needs review", "Speaklio needs one more detail before saving anything.");
}

function openView(viewName) {
  const targetView = document.getElementById(`${viewName}-view`) ? viewName : "home";
  state.currentView = targetView;
  views.forEach((view) => view.classList.toggle("active", view.id === `${targetView}-view`));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === targetView));
  if (window.innerWidth <= 980) hideAssistant();
  window.scrollTo({ top: 0, behavior: "smooth" });
  saveState();
}

function showAssistant() {
  assistantPanel.classList.add("open");
  overlay.classList.add("show");
  setTimeout(() => input.focus(), 220);
}

function hideAssistant() {
  assistantPanel.classList.remove("open");
  overlay.classList.remove("show");
}

function openModal({ eyebrow = "SPEAKLIO", title, body }) {
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  if (typeof modal.showModal === "function") modal.showModal();
  else modal.setAttribute("open", "");
}

function closeModal() {
  if (!modal.open && !modal.hasAttribute("open")) return;
  if (typeof modal.close === "function") modal.close();
  else modal.removeAttribute("open");
}

function recentPluginActivity(pluginId) {
  const items = state.activities.filter((item) => item.plugin === pluginId).slice(0, 3);
  return items.length
    ? `<div class="modal-activity-list">${items.map(activityMarkup).join("")}</div>`
    : '<p class="empty-state">No updates logged yet.</p>';
}

function stat(label, value) {
  return `<div class="modal-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function insightNote(title, copy) {
  return `
    <div class="modal-insight">
      ${iconMarkup("sparkles")}
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(copy)}</p>
      </div>
    </div>
  `;
}

function nutritionScanPanel() {
  return `
    <div class="scan-panel">
      <div>
        <p class="eyebrow">COMPUTER VISION</p>
        <h3>Meal scanner coming soon</h3>
        <p>Camera capture will need a real vision service before it can estimate foods and portions.</p>
      </div>
      <button class="wide-action-button" type="button" data-modal-action="open-nutrition-scan">
        ${iconMarkup("camera")} Review status
      </button>
    </div>
  `;
}

function openNutritionScan() {
  openModal({
    eyebrow: "NUTRITION SCAN",
    title: "Meal scanner coming soon",
    body: `
      <div class="scan-modal-grid">
        <section class="camera-frame" aria-label="Camera scanner preview">
          <span class="scan-corner top-left"></span>
          <span class="scan-corner top-right"></span>
          <span class="scan-corner bottom-left"></span>
          <span class="scan-corner bottom-right"></span>
          ${iconMarkup("camera")}
          <strong>Vision service not connected</strong>
          <p>Speaklio needs a real camera and food-recognition service before meal scanning can save entries.</p>
        </section>
        <section class="scan-review">
          <p class="eyebrow">PLANNED FLOW</p>
          <div class="scan-mode-row">
            <button class="preset-button active" type="button">Meal photo</button>
            <button class="preset-button" type="button">Nutrition label</button>
            <button class="preset-button" type="button">Barcode</button>
          </div>
          <div class="permission-list">
            <div><strong>Capture</strong><span>Open camera or upload a meal photo.</span></div>
            <div><strong>Review</strong><span>Confirm foods, portions, calories, and macros.</span></div>
            <div><strong>Save</strong><span>Create the same backend nutrition entry as manual logging.</span></div>
          </div>
          <div class="stacked-actions">
            <button class="primary-button" type="button" data-modal-action="close">Done</button>
          </div>
        </section>
      </div>
    `,
  });
}

function openIntegration(integrationId) {
  const integration = integrationCatalog[integrationId];
  if (!integration) return;

  openModal({
    eyebrow: "CONNECTED HEALTH",
    title: integration.name,
    body: `
      <div class="integration-detail">
        <span class="plugin-icon ${escapeHtml(integration.color)}">${iconMarkup(integration.icon)}</span>
        <div>
          <h3>${escapeHtml(integration.name)} sync is coming soon</h3>
          <p>${escapeHtml(integration.detailCopy)}</p>
        </div>
      </div>
      <div class="permission-grid">
        ${stat("Activity", "Steps, rings")}
        ${stat("Workouts", "Sessions")}
        ${stat("Recovery", "Sleep, heart")}
      </div>
      <div class="permission-list">
        <div><strong>Planned read permissions</strong><span>${escapeHtml(integration.permissions.read)}</span></div>
        <div><strong>Planned write permissions</strong><span>${escapeHtml(integration.permissions.write)}</span></div>
      </div>
      <div class="stacked-actions">
        <button class="primary-button" type="button" data-modal-action="close">Done</button>
      </div>
    `,
  });
}

function applyAccountSetup(data) {
  const name = String(data.get("name") || state.profile.name).trim() || state.profile.name;
  const email = state.authenticated
    ? state.profile.email
    : String(data.get("email") || state.profile.email).trim() || state.profile.email;
  const age = Number(data.get("age") || state.profile.personal.age);
  const heightCm = Number(data.get("heightCm") || state.profile.personal.heightCm);
  const weightKg = Number(data.get("weightKg") || state.profile.personal.weightKg);
  const activityLevel = String(data.get("activityLevel") || state.profile.personal.activityLevel);
  const primaryGoal = String(data.get("primaryGoal") || state.profile.goals.primaryGoal);
  const tailored = getTailoredGoals({ weightKg, primaryGoal, activityLevel });
  const targetWeightKg = primaryGoal === "lose"
    ? Math.max(30, weightKg - 5)
    : primaryGoal === "gain"
      ? weightKg + 3
      : weightKg;

  state.profile.name = name;
  state.profile.email = email;
  state.profile.personal = { age, heightCm, weightKg, activityLevel };
  state.profile.goals = {
    primaryGoal,
    targetWeightKg,
    calorieGoal: tailored.calorieGoal,
    proteinGoal: tailored.proteinGoal,
    hydrationGoal: tailored.hydrationGoal,
    weeklyWorkouts: tailored.weeklyWorkouts,
  };
}

function openPlugin(pluginId) {
  const plugin = pluginMap[pluginId];
  if (!plugin) return;
  if (!state.installedPlugins.has(pluginId)) {
    showToast(`Add ${plugin.name} before opening it`);
    return;
  }

  const removeButton = `<button class="text-danger-button" data-plugin-toggle="${plugin.id}">Remove plugin</button>`;
  const footer = `<div class="modal-section"><div class="modal-section-title"><h3>Recent activity</h3>${removeButton}</div>${recentPluginActivity(pluginId)}</div>`;
  const content = {
    nutrition: `
      <div class="modal-stats">
        ${stat("Calories today", `${state.nutrition.calories.toLocaleString()} / ${state.nutrition.goal.toLocaleString()}`)}
        ${stat("Protein", `${state.nutrition.protein}g`)}
        ${stat("Carbs", `${state.nutrition.carbs}g`)}
      </div>
      ${insightNote("Protein is the lever", "A protein-forward dinner would make today's nutrition feel complete without pushing calories too high.")}
      ${nutritionScanPanel()}
      <form class="quick-form" data-form="meal">
        <h3>Log a meal</h3>
        <label>Meal description<input required name="description" placeholder="Eggs and toast" /></label>
        <div class="form-grid">
          <label>Calories<input required name="calories" type="number" min="1" placeholder="320" /></label>
          <label>Protein (g)<input name="protein" type="number" min="0" placeholder="18" /></label>
          <label>Carbs (g)<input name="carbs" type="number" min="0" placeholder="32" /></label>
          <label>Fats (g)<input name="fats" type="number" min="0" placeholder="12" /></label>
        </div>
        <button class="primary-button" type="submit">Add meal</button>
      </form>${footer}`,
    finance: `
      <div class="modal-stats">
        ${stat("Spent this month", `$${formatMoney(state.finance.spending)}`)}
        ${stat("Monthly budget", `$${formatMoney(state.finance.budget)}`)}
        ${stat("Remaining", `$${formatMoney(state.finance.budget - state.finance.spending)}`)}
      </div>
      ${insightNote("Budget pace looks stable", "You are still under budget. Keep dining entries specific so weekly summaries stay useful.")}
      <form class="quick-form" data-form="expense">
        <h3>Log an expense</h3>
        <div class="form-grid">
          <label>Amount<input required name="amount" type="number" min="0.01" step="0.01" placeholder="25.00" /></label>
          <label>Category<select name="category">${optionsMarkup(pluginUiConfig.finance.categories)}</select></label>
        </div>
        <label>Note<input name="note" placeholder="Lunch" /></label>
        <button class="primary-button" type="submit">Add expense</button>
      </form>${footer}`,
    sleep: `
      <div class="modal-stats">
        ${stat("Last night", formatMinutes(state.sleep.minutes))}
        ${stat("Quality", state.sleep.quality)}
        ${stat("Weekly average", formatMinutes(state.sleep.week.reduce((sum, value) => sum + value, 0) / state.sleep.week.length))}
      </div>
      ${insightNote("Consistency beats perfection", "Your best nights cluster around similar bedtimes. Speaklio can use that rhythm for smarter reminders.")}
      <form class="quick-form" data-form="sleep">
        <h3>Log last night's sleep</h3>
        <div class="form-grid">
          <label>Hours slept<input required name="hours" type="number" min="0" max="16" step="0.1" value="${(state.sleep.minutes / 60).toFixed(1)}" /></label>
          <label>Quality<select name="quality">${optionsMarkup(pluginUiConfig.sleep.qualityOptions, state.sleep.quality)}</select></label>
        </div>
        <button class="primary-button" type="submit">Save sleep</button>
      </form>${footer}`,
    workout: `
      <div class="modal-stats">
        ${stat("Next workout", state.workout.title)}
        ${stat("When", state.workout.time)}
        ${stat("Weekly progress", `${state.workout.completed} / ${state.workout.goal}`)}
      </div>
      ${insightNote("One session to go", "Completing the next workout will close your weekly goal and lift the balance score.")}
      <button class="wide-action-button" data-modal-action="complete-workout">${iconMarkup("bolt")} Mark current workout complete</button>
      <form class="quick-form" data-form="workout">
        <h3>Plan your next workout</h3>
        <label>Workout name<input required name="title" value="${escapeHtml(state.workout.title)}" /></label>
        <div class="form-grid">
          <label>When<input required name="time" value="${escapeHtml(state.workout.time)}" /></label>
          <label>Minutes<input required name="duration" type="number" min="5" value="${state.workout.duration}" /></label>
        </div>
        <button class="primary-button" type="submit">Save workout</button>
      </form>${footer}`,
    hydration: `
      <div class="modal-stats">
        ${stat("Water today", `${(state.hydration.ml / 1000).toFixed(1)} L`)}
        ${stat("Daily goal", `${(state.hydration.goal / 1000).toFixed(1)} L`)}
        ${stat("Remaining", `${(Math.max(0, state.hydration.goal - state.hydration.ml) / 1000).toFixed(1)} L`)}
      </div>
      ${insightNote("Small sips count", "Quick presets make this plugin feel fast now and easy to wire to real entries later.")}
      <div class="quick-form">
        <h3>Add water</h3>
        <div class="preset-row">
          ${presetButtons(pluginUiConfig.hydration.presetsMl, "add-water", (value) => `+ ${value} ml`)}
        </div>
      </div>${footer}`,
    mindfulness: `
      <div class="modal-stats">
        ${stat("This week", `${state.mindfulness.count} moments`)}
        ${stat("Suggested", state.mindfulness.title)}
        ${stat("Default session", `${state.mindfulness.duration} min`)}
      </div>
      ${insightNote("Keep it lightweight", "Mindfulness should stay low-friction: choose a duration, complete it, and move on.")}
      <div class="quick-form">
        <h3>Complete a mindful moment</h3>
        <p>Choose a short breathing session. Speaklio will log it as completed.</p>
        <div class="preset-row">
          ${presetButtons(pluginUiConfig.mindfulness.presetsMinutes, "complete-mindfulness", (value) => `${value} min`)}
        </div>
      </div>${footer}`,
  };

  openModal({ eyebrow: plugin.name.toUpperCase(), title: plugin.name, body: content[pluginId] });
}

async function togglePlugin(pluginId) {
  const plugin = pluginMap[pluginId];
  if (!plugin) return;
  const installed = state.installedPlugins.has(pluginId);

  if (state.authenticated && authSession?.access_token) {
    await apiRequest(`/plugins/${encodeURIComponent(pluginId)}/enable`, {
      method: installed ? "DELETE" : "PUT",
    });
    await loadBackendData();
    closeModal();
    showToast(`${plugin.name} ${installed ? "removed from" : "added to"} your dashboard`);
    return;
  }

  if (installed) {
    state.installedPlugins.delete(pluginId);
    closeModal();
    showToast(`${plugin.name} removed from your dashboard`);
  } else {
    state.installedPlugins.add(pluginId);
    showToast(`${plugin.name} added to your dashboard`);
  }
  saveState();
  renderAll();
}

async function logWater(amount) {
  if (state.authenticated && authSession?.access_token) {
    await createBackendEntry({
      pluginId: "hydration",
      entryType: "log_hydration",
      value: amount,
      unit: "ml",
      metadata: {},
    });
    showToast(`${amount} ml added to Hydration`);
    return;
  }

  state.hydration.ml += amount;
  addActivity({ plugin: "hydration", title: "Added water", detail: `${amount} ml - ${state.hydration.ml} ml today` });
  saveState();
  renderAll();
  showToast(`${amount} ml added to Hydration`);
}

async function logMindfulness(minutes) {
  if (state.authenticated && authSession?.access_token) {
    await createBackendEntry({
      pluginId: "mindfulness",
      entryType: "log_mindfulness",
      value: minutes,
      unit: "min",
      metadata: {},
    });
    showToast("Mindful moment completed");
    return;
  }

  state.mindfulness.count += 1;
  addActivity({ plugin: "mindfulness", title: "Completed mindful moment", detail: `${minutes}-minute guided breathing` });
  saveState();
  renderAll();
  showToast("Mindful moment completed");
}

async function completeWorkout() {
  if (state.authenticated && authSession?.access_token) {
    await createBackendEntry({
      pluginId: "workout",
      entryType: "log_workout",
      metadata: {
        exercise: state.workout.title,
        duration: state.workout.duration,
        completed: true,
      },
    });
    showToast("Workout marked complete");
    return;
  }

  state.workout.completed += 1;
  addActivity({ plugin: "workout", title: `Completed ${state.workout.title.toLowerCase()}`, detail: `${state.workout.duration} minutes - Session ${state.workout.completed} of ${state.workout.goal}` });
  saveState();
  renderAll();
  showToast("Workout marked complete");
}

function openWeekSummary() {
  openModal({
    eyebrow: "WEEKLY SUMMARY",
    title: "A steady week",
    body: `
      <div class="summary-hero">
        <strong>${document.getElementById("balance-score").textContent}</strong>
        <div><h3>Your balance score</h3><p>You are building consistent habits across your dashboard.</p></div>
      </div>
      <div class="modal-stats">
        ${stat("Nutrition", `${state.nutrition.calories.toLocaleString()} cal today`)}
        ${stat("Budget", `$${formatMoney(state.finance.budget - state.finance.spending)} left`)}
        ${stat("Workouts", `${state.workout.completed} sessions`)}
        ${stat("Sleep", `${formatMinutes(state.sleep.minutes)} last night`)}
      </div>
      <button class="primary-button" data-modal-action="close">Done</button>
    `,
  });
}

function openProfileAction(action) {
  if (action === "edit") {
    openModal({
      eyebrow: "PROFILE",
      title: "Edit your profile",
      body: `
        <form class="quick-form" data-form="profile">
          <label>Name<input required name="name" value="${escapeHtml(state.profile.name)}" /></label>
          ${accountEmailField()}
          <button class="primary-button" type="submit">Save profile</button>
        </form>
      `,
    });
  }

  if (action === "personal-data") {
    const { personal } = state.profile;
    openModal({
      eyebrow: "PROFILE",
      title: "Personal data",
      body: `
        <form class="quick-form" data-form="personal-data">
          <div class="form-grid">
            <label>Age<input required name="age" type="number" min="13" max="120" value="${personal.age}" /></label>
            <label>Activity level<select name="activityLevel">
              ${optionMarkup("light", "Light", personal.activityLevel)}
              ${optionMarkup("moderate", "Moderate", personal.activityLevel)}
              ${optionMarkup("active", "Active", personal.activityLevel)}
              ${optionMarkup("athlete", "Athlete", personal.activityLevel)}
            </select></label>
            <label>Height (cm)<input required name="heightCm" type="number" min="100" max="240" value="${personal.heightCm}" /></label>
            <label>Weight (kg)<input required name="weightKg" type="number" min="30" max="250" step="0.1" value="${personal.weightKg}" /></label>
          </div>
          <button class="primary-button" type="submit">Save personal data</button>
        </form>
      `,
    });
  }

  if (action === "goals") {
    const { goals } = state.profile;
    openModal({
      eyebrow: "GOALS",
      title: "Goals and targets",
      body: `
        <form class="quick-form" data-form="goals">
          <label>Primary goal<select name="primaryGoal">
            ${optionMarkup("maintain", "Maintain weight", goals.primaryGoal)}
            ${optionMarkup("lose", "Lose fat", goals.primaryGoal)}
            ${optionMarkup("gain", "Build muscle", goals.primaryGoal)}
            ${optionMarkup("performance", "Improve performance", goals.primaryGoal)}
          </select></label>
          <div class="form-grid">
            <label>Target weight (kg)<input required name="targetWeightKg" type="number" min="30" max="250" step="0.1" value="${goals.targetWeightKg}" /></label>
            <label>Calories<input required name="calorieGoal" type="number" min="1000" max="6000" step="50" value="${goals.calorieGoal}" /></label>
            <label>Protein (g)<input required name="proteinGoal" type="number" min="20" max="350" value="${goals.proteinGoal}" /></label>
            <label>Water (ml)<input required name="hydrationGoal" type="number" min="1000" max="6000" step="50" value="${goals.hydrationGoal}" /></label>
            <label>Weekly workouts<input required name="weeklyWorkouts" type="number" min="1" max="14" value="${goals.weeklyWorkouts}" /></label>
          </div>
          <button class="primary-button" type="submit">Save goals</button>
        </form>
      `,
    });
  }

  if (action === "account-setup") {
    const { personal, goals } = state.profile;
    openModal({
      eyebrow: "TAILORED PLAN",
      title: "Retune your plan",
      body: `
        <form class="quick-form" data-form="account-setup">
          <div class="form-grid">
            <label>Name<input required name="name" value="${escapeHtml(state.profile.name)}" /></label>
            ${accountEmailField()}
            <label>Age<input required name="age" type="number" min="13" max="120" value="${personal.age}" /></label>
            <label>Activity level<select name="activityLevel">
              ${optionMarkup("light", "Light", personal.activityLevel)}
              ${optionMarkup("moderate", "Moderate", personal.activityLevel)}
              ${optionMarkup("active", "Active", personal.activityLevel)}
              ${optionMarkup("athlete", "Athlete", personal.activityLevel)}
            </select></label>
            <label>Height (cm)<input required name="heightCm" type="number" min="100" max="240" value="${personal.heightCm}" /></label>
            <label>Weight (kg)<input required name="weightKg" type="number" min="30" max="250" step="0.1" value="${personal.weightKg}" /></label>
          </div>
          <label>Primary goal<select name="primaryGoal">
            ${optionMarkup("maintain", "Maintain weight", goals.primaryGoal)}
            ${optionMarkup("lose", "Lose fat", goals.primaryGoal)}
            ${optionMarkup("gain", "Build muscle", goals.primaryGoal)}
            ${optionMarkup("performance", "Improve performance", goals.primaryGoal)}
          </select></label>
          <button class="primary-button" type="submit">Create my plan</button>
        </form>
      `,
    });
  }

  if (action === "notifications") {
    openModal({
      eyebrow: "SETTINGS",
      title: "Notifications",
      body: `
        <form class="quick-form" data-form="notifications">
          <label class="toggle-row"><span><strong>Daily reminders</strong><small>A gentle reminder to check in with Speaklio.</small></span><input name="notifications" type="checkbox" ${state.profile.notifications ? "checked" : ""} /></label>
          <label class="toggle-row"><span><strong>Weekly summary</strong><small>See your progress at the end of each week.</small></span><input name="weeklySummary" type="checkbox" ${state.profile.weeklySummary ? "checked" : ""} /></label>
          <button class="primary-button" type="submit">Save preferences</button>
        </form>
      `,
    });
  }

  if (action === "privacy") {
    openModal({
      eyebrow: "PRIVACY",
      title: "Privacy and data",
      body: `
        <div class="modal-notice">
          <strong>You control what Speaklio can use.</strong>
          <p>Review export, reset, and connected-app controls for your account data.</p>
        </div>
        <div class="stacked-actions">
          <button class="wide-action-button" data-modal-action="export-data">Export my data</button>
          <button class="danger-button" data-modal-action="confirm-reset">Reset account data</button>
        </div>
      `,
    });
  }

  if (action === "integrations") {
    openModal({
      eyebrow: "CONNECTED HEALTH",
      title: "Apps and devices",
      body: `
        <div class="integration-grid modal-integration-grid">
          ${integrationCardMarkup("apple-health")}
          ${integrationCardMarkup("apple-watch")}
        </div>
      `,
    });
  }

  if (action === "preferences") {
    openModal({
      eyebrow: "SETTINGS",
      title: "Preferences",
      body: `
        <form class="quick-form" data-form="preferences">
          <div class="form-grid">
            <label>Timezone<input name="timezone" value="${escapeHtml(state.profile.timezone)}" /></label>
            <label>Units<select name="units">
              ${optionMarkup("Metric", "Metric", state.profile.units)}
              ${optionMarkup("Imperial", "Imperial", state.profile.units)}
            </select></label>
          </div>
          <label class="toggle-row"><span><strong>Assistant insights</strong><small>Let Speaklio offer simple proactive suggestions.</small></span><input name="assistantInsights" type="checkbox" ${state.profile.assistantInsights ? "checked" : ""} /></label>
          <label class="toggle-row"><span><strong>Compact dashboard cards</strong><small>Reduce spacing when you want a denser overview.</small></span><input name="compactCards" type="checkbox" ${state.profile.compactCards ? "checked" : ""} /></label>
          <button class="primary-button" type="submit">Save preferences</button>
        </form>
        <button class="store-link-button" data-modal-action="open-store">Manage dashboard plugins</button>
      `,
    });
  }
}

function exportData() {
  const payload = JSON.stringify({ ...state, installedPlugins: [...state.installedPlugins] }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "speaklio-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Speaklio data exported");
}

function resetAccountData() {
  state = makeDefaultState();
  saveState();
  renderAll();
  closeModal();
  showToast("Account data reset");
}

function ensureInstalled(pluginId) {
  if (state.installedPlugins.has(pluginId)) return true;
  addMessage(`${pluginMap[pluginId].name} is not installed yet. Add it from the plugin store and I can track that for you.`, "assistant");
  showToast(`${pluginMap[pluginId].name} plugin is not installed`);
  return false;
}

function classifyExpense(text) {
  const categories = pluginUiConfig.finance.categories;
  if (/(grocery|groceries|supermarket)/.test(text)) return categories.includes("Groceries") ? "Groceries" : categories[0];
  if (/(gas|uber|taxi|bus|transport)/.test(text)) return categories.includes("Transport") ? "Transport" : categories[0];
  if (/(bill|rent|phone|internet)/.test(text)) return categories.includes("Bills") ? "Bills" : categories[0];
  if (/(lunch|dinner|coffee|restaurant|breakfast)/.test(text)) return categories.includes("Dining") ? "Dining" : categories[0];
  return categories.includes("Other") ? "Other" : categories[0];
}

function processRequest(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  if (!text) return;
  addMessage(text, "user");
  previewAssistantRequest(text);
  input.value = "";

  setTimeout(async () => {
    if (state.authenticated && authSession?.access_token && await previewBackendAssistantRequest(text)) {
      return;
    }

    const waterMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ml|milliliters?|l|liters?)/);
    if (/(water|drank|hydrate|hydration)/.test(lower) && waterMatch) {
      if (!ensureInstalled("hydration")) return;
      const amount = waterMatch[2].startsWith("l") ? Number(waterMatch[1]) * 1000 : Number(waterMatch[1]);
      await logWater(amount);
      addMessage(`Logged ${amount} ml of water. You are at ${(state.hydration.ml / 1000).toFixed(1)} L of your ${(state.hydration.goal / 1000).toFixed(1)} L goal.`, "assistant");
      return;
    }

    if (/(water|hydrate|hydration)/.test(lower)) {
      if (!ensureInstalled("hydration")) return;
      addMessage(`You are at ${(state.hydration.ml / 1000).toFixed(1)} L of your ${(state.hydration.goal / 1000).toFixed(1)} L water goal today.`, "assistant");
      return;
    }

    if (/(meditat|mindful|breathing)/.test(lower)) {
      if (!ensureInstalled("mindfulness")) return;
      const minutes = Number((lower.match(/(\d+)\s*(?:minute|min)/) || [0, state.mindfulness.duration])[1]);
      await logMindfulness(minutes);
      addMessage(`Nice work. I logged a ${minutes}-minute mindful moment.`, "assistant");
      return;
    }

    if (/(sleep|slept|last night)/.test(lower)) {
      if (!ensureInstalled("sleep")) return;
      const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
      if (hoursMatch && /(slept|log|had)/.test(lower)) {
        const minutes = Number(hoursMatch[1]) * 60;
        const quality = minutes >= 420 ? "Good" : "Fair";
        if (state.authenticated && authSession?.access_token) {
          await createBackendEntry({
            pluginId: "sleep",
            entryType: "log_sleep",
            value: minutes,
            unit: "min",
            metadata: { quality },
          });
          addMessage(`Logged ${formatMinutes(minutes)} of sleep. I marked the quality as ${quality.toLowerCase()}.`, "assistant");
          return;
        }
        state.sleep.minutes = Number(hoursMatch[1]) * 60;
        state.sleep.week[state.sleep.week.length - 1] = state.sleep.minutes;
        state.sleep.quality = state.sleep.minutes >= 420 ? "Good" : "Fair";
        addActivity({ plugin: "sleep", title: "Updated sleep summary", detail: `${formatMinutes(state.sleep.minutes)} - ${state.sleep.quality} quality` });
        saveState();
        renderAll();
        addMessage(`Logged ${formatMinutes(state.sleep.minutes)} of sleep. I marked the quality as ${state.sleep.quality.toLowerCase()}.`, "assistant");
      } else {
        addMessage(`You slept for ${formatMinutes(state.sleep.minutes)} last night. Your sleep quality was ${state.sleep.quality.toLowerCase()}.`, "assistant");
      }
      return;
    }

    if (/(budget|how much.*spent|spending|money.*left)/.test(lower)) {
      if (!ensureInstalled("finance")) return;
      addMessage(`You have spent $${formatMoney(state.finance.spending)} of your $${formatMoney(state.finance.budget)} monthly budget.`, "assistant");
      return;
    }

    if (/(spent|expense|paid|bought)/.test(lower)) {
      if (!ensureInstalled("finance")) return;
      const amountMatch = lower.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
      if (!amountMatch) {
        addMessage('Tell me the amount and I will add that expense. For example: "I spent $18 on groceries."', "assistant");
        return;
      }
      const amount = Number(amountMatch[1]);
      const category = classifyExpense(lower);
      if (state.authenticated && authSession?.access_token) {
        await createBackendEntry({
          pluginId: "finance",
          entryType: "log_expense",
          value: amount,
          unit: "usd",
          metadata: { category, note: category },
        });
        addMessage(`Done. I added $${amount.toFixed(2)} to ${category.toLowerCase()}. You have $${formatMoney(state.finance.budget - state.finance.spending)} left in this month's budget.`, "assistant");
        showToast("Expense added to Finance");
        return;
      }
      state.finance.spending += amount;
      addActivity({ plugin: "finance", title: `Added ${category.toLowerCase()} expense`, detail: `${category} - $${amount.toFixed(2)}` });
      saveState();
      renderAll();
      addMessage(`Done. I added $${amount.toFixed(2)} to ${category.toLowerCase()}. You have $${formatMoney(state.finance.budget - state.finance.spending)} left in this month's budget.`, "assistant");
      showToast("Expense added to Finance");
      return;
    }

    if (/(complete|finished|did).*(workout|exercise|training)/.test(lower)) {
      if (!ensureInstalled("workout")) return;
      await completeWorkout();
      addMessage(`Logged. That brings you to ${state.workout.completed} of ${state.workout.goal} workouts this week.`, "assistant");
      return;
    }

    if (/(workout|exercise|training|tomorrow)/.test(lower)) {
      if (!ensureInstalled("workout")) return;
      if (state.authenticated && authSession?.access_token) {
        await createBackendEntry({
          pluginId: "workout",
          entryType: "log_workout",
          metadata: { exercise: "Full body mobility", title: "Full body mobility", plannedTime: "Tomorrow, 7:30 AM", duration: 35, completed: false },
        });
        addMessage("I planned a 35-minute full body mobility workout for tomorrow at 7:30 AM. It is now on your dashboard.", "assistant");
        showToast("Workout added to your plan");
        return;
      }
      state.workout = { ...state.workout, title: "Full body mobility", time: "Tomorrow, 7:30 AM", duration: 35 };
      addActivity({ plugin: "workout", title: "Planned full body mobility", detail: "Tomorrow, 7:30 AM - 35 min" });
      saveState();
      renderAll();
      addMessage("I planned a 35-minute full body mobility workout for tomorrow at 7:30 AM. It is now on your dashboard.", "assistant");
      showToast("Workout added to your plan");
      return;
    }

    if (/(calories|nutrition|macros)/.test(lower) && /(how|total|today|many)/.test(lower)) {
      if (!ensureInstalled("nutrition")) return;
      addMessage(`You are at ${state.nutrition.calories.toLocaleString()} of ${state.nutrition.goal.toLocaleString()} calories today, with ${state.nutrition.protein}g of protein.`, "assistant");
      return;
    }

    if (/(eggs|toast|breakfast|lunch|dinner|snack|ate|meal)/.test(lower)) {
      if (!ensureInstalled("nutrition")) return;
      const calorieMatch = lower.match(/(\d+)\s*(?:cal|calories)/);
      const calories = calorieMatch ? Number(calorieMatch[1]) : 320;
      if (state.authenticated && authSession?.access_token) {
        await createBackendEntry({
          pluginId: "nutrition",
          entryType: "log_food",
          value: calories,
          unit: "cal",
          metadata: { food: "meal from assistant", meal: "Meal", calories, protein: 18, carbs: 32, fats: 12 },
        });
        addMessage(`Logged that meal at an estimated ${calories} calories. Your daily total is now ${state.nutrition.calories.toLocaleString()} calories.`, "assistant");
        showToast("Meal added to Nutrition");
        return;
      }
      state.nutrition.calories += calories;
      state.nutrition.protein += 18;
      state.nutrition.carbs += 32;
      state.nutrition.fats += 12;
      addActivity({ plugin: "nutrition", title: "Logged meal from assistant", detail: `Meal - ${calories} cal` });
      saveState();
      renderAll();
      addMessage(`Logged that meal at an estimated ${calories} calories. Your daily total is now ${state.nutrition.calories.toLocaleString()} calories.`, "assistant");
      showToast("Meal added to Nutrition");
      return;
    }

    if (/(help|what can you do)/.test(lower)) {
      addMessage("I can log meals, expenses, sleep, workouts, water, and mindful moments. I can also summarize your calories, spending, and sleep.", "assistant");
      return;
    }

    addMessage("I can help with meals, expenses, sleep, workouts, water, and mindful moments. Ask for a summary or tell me what to log.", "assistant");
  }, 350);
}

document.addEventListener("click", async (event) => {
  const backendAction = event.target.closest("[data-backend-action]");
  if (backendAction?.dataset.backendAction === "retry") {
    try {
      await loadBackendData();
      showToast("Backend data refreshed");
    } catch (error) {
      showBackendLoadError(error);
    }
    return;
  }

  const authAction = event.target.closest("[data-auth-action]");
  if (authAction?.dataset.authAction === "sign-out") signOut();
  if (authAction?.dataset.authAction === "start-setup") showAccountSetup();
  if (authAction?.dataset.authAction === "back-to-login") hideAccountSetup();

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) openView(viewButton.dataset.view);

  const viewTrigger = event.target.closest("[data-view-trigger]");
  if (viewTrigger) openView(viewTrigger.dataset.viewTrigger);

  const pluginToggle = event.target.closest("[data-plugin-toggle]");
  if (pluginToggle) await togglePlugin(pluginToggle.dataset.pluginToggle);

  const pluginOpen = event.target.closest("[data-plugin-open]");
  if (pluginOpen) openPlugin(pluginOpen.dataset.pluginOpen);

  const pluginAction = event.target.closest("[data-plugin-action]");
  if (pluginAction?.dataset.pluginAction === "mindfulness-start") {
    await logMindfulness(state.mindfulness.duration);
    openPlugin("mindfulness");
  }
  if (pluginAction?.dataset.pluginAction === "nutrition-scan") {
    openNutritionScan();
  }

  const integrationAction = event.target.closest("[data-integration-action]");
  if (integrationAction) openIntegration(integrationAction.dataset.integrationAction);

  const profileAction = event.target.closest("[data-profile-action]");
  if (profileAction) openProfileAction(profileAction.dataset.profileAction);

  const assistantAction = event.target.closest("[data-assistant-action]");
  if (assistantAction) {
    if (assistantAction.dataset.assistantAction === "confirm") {
      try {
        await confirmAssistantPreview();
      } catch (error) {
        showToast(error.message || "Unable to save assistant action");
      }
    }
    if (assistantAction.dataset.assistantAction === "edit") editAssistantPreview();
  }

  const modalAction = event.target.closest("[data-modal-action]");
  if (!modalAction) return;
  const action = modalAction.dataset.modalAction;
  if (action === "close") closeModal();
  if (action === "add-water") {
    await logWater(Number(modalAction.dataset.amount));
    openPlugin("hydration");
  }
  if (action === "complete-mindfulness") {
    await logMindfulness(Number(modalAction.dataset.amount));
    openPlugin("mindfulness");
  }
  if (action === "complete-workout") {
    await completeWorkout();
    openPlugin("workout");
  }
  if (action === "open-nutrition-scan") openNutritionScan();
  if (action === "open-store") {
    closeModal();
    openView("plugins");
  }
  if (action === "export-data") exportData();
  if (action === "confirm-reset") {
    openModal({
      eyebrow: "RESET DATA",
      title: "Start fresh?",
      body: `
        <div class="modal-notice"><p>This clears your account timeline and restores the starter dashboard.</p></div>
        <div class="stacked-actions">
          <button class="danger-button" data-modal-action="reset-account-data">Reset account data</button>
          <button class="secondary-button" data-modal-action="close">Keep my data</button>
        </div>
      `,
    });
  }
  if (action === "reset-account-data") resetAccountData();
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  let shouldOpenHome = false;

  if (form.dataset.form === "meal") {
    const calories = Number(data.get("calories"));
    const protein = Number(data.get("protein") || 0);
    const carbs = Number(data.get("carbs") || 0);
    const fats = Number(data.get("fats") || 0);
    const food = String(data.get("description") || "meal");
    if (state.authenticated && authSession?.access_token) {
      await createBackendEntry({
        pluginId: "nutrition",
        entryType: "log_food",
        value: calories,
        unit: "cal",
        metadata: { food, meal: "Meal", calories, protein, carbs, fats },
      });
      showToast("Meal added to Nutrition");
      openPlugin("nutrition");
      return;
    }

    state.nutrition.calories += calories;
    state.nutrition.protein += protein;
    state.nutrition.carbs += carbs;
    state.nutrition.fats += fats;
    addActivity({ plugin: "nutrition", title: `Logged ${food}`, detail: `Meal - ${calories} cal` });
    showToast("Meal added to Nutrition");
    openPlugin("nutrition");
  }

  if (form.dataset.form === "expense") {
    const amount = Number(data.get("amount"));
    const category = String(data.get("category"));
    const note = String(data.get("note") || category);
    if (state.authenticated && authSession?.access_token) {
      await createBackendEntry({
        pluginId: "finance",
        entryType: "log_expense",
        value: amount,
        unit: "usd",
        metadata: { category, note },
      });
      showToast("Expense added to Finance");
      openPlugin("finance");
      return;
    }

    state.finance.spending += amount;
    addActivity({ plugin: "finance", title: `Added ${note}`, detail: `${category} - $${amount.toFixed(2)}` });
    showToast("Expense added to Finance");
    openPlugin("finance");
  }

  if (form.dataset.form === "sleep") {
    const minutes = Number(data.get("hours")) * 60;
    const quality = String(data.get("quality"));
    if (state.authenticated && authSession?.access_token) {
      await createBackendEntry({
        pluginId: "sleep",
        entryType: "log_sleep",
        value: minutes,
        unit: "min",
        metadata: { quality },
      });
      showToast("Sleep summary updated");
      openPlugin("sleep");
      return;
    }

    state.sleep.minutes = minutes;
    state.sleep.quality = quality;
    state.sleep.week[state.sleep.week.length - 1] = state.sleep.minutes;
    addActivity({ plugin: "sleep", title: "Updated sleep summary", detail: `${formatMinutes(state.sleep.minutes)} - ${state.sleep.quality} quality` });
    showToast("Sleep summary updated");
    openPlugin("sleep");
  }

  if (form.dataset.form === "workout") {
    const title = String(data.get("title"));
    const time = String(data.get("time"));
    const duration = Number(data.get("duration"));
    if (state.authenticated && authSession?.access_token) {
      await createBackendEntry({
        pluginId: "workout",
        entryType: "log_workout",
        metadata: { exercise: title, title, plannedTime: time, duration, completed: false },
      });
      showToast("Workout plan updated");
      openPlugin("workout");
      return;
    }

    state.workout.title = title;
    state.workout.time = time;
    state.workout.duration = duration;
    addActivity({ plugin: "workout", title: `Planned ${state.workout.title.toLowerCase()}`, detail: `${state.workout.time} - ${state.workout.duration} min` });
    showToast("Workout plan updated");
    openPlugin("workout");
  }

  if (form.dataset.form === "profile") {
    state.profile.name = String(data.get("name") || state.profile.name).trim() || state.profile.name;
    await saveProfileSettings({ displayName: state.profile.name });
    closeModal();
    showToast("Profile updated");
  }

  if (form.dataset.form === "personal-data") {
    const age = Number(data.get("age"));
    const heightCm = Number(data.get("heightCm"));
    const weightKg = Number(data.get("weightKg"));
    const activityLevel = String(data.get("activityLevel"));
    const tailored = getTailoredGoals({ weightKg, primaryGoal: state.profile.goals.primaryGoal, activityLevel });
    state.profile.personal = { age, heightCm, weightKg, activityLevel };
    state.profile.goals = {
      ...state.profile.goals,
      calorieGoal: tailored.calorieGoal,
      proteinGoal: tailored.proteinGoal,
      hydrationGoal: tailored.hydrationGoal,
      weeklyWorkouts: tailored.weeklyWorkouts,
    };
    await saveProfileSettings({
      personal: state.profile.personal,
      goals: state.profile.goals,
    });
    closeModal();
    showToast("Personal data updated");
  }

  if (form.dataset.form === "goals") {
    state.profile.goals = {
      ...state.profile.goals,
      primaryGoal: String(data.get("primaryGoal")),
      targetWeightKg: Number(data.get("targetWeightKg")),
      calorieGoal: Number(data.get("calorieGoal")),
      proteinGoal: Number(data.get("proteinGoal")),
      hydrationGoal: Number(data.get("hydrationGoal")),
      weeklyWorkouts: Number(data.get("weeklyWorkouts")),
    };
    await saveProfileSettings({ goals: state.profile.goals });
    closeModal();
    showToast("Goals updated");
  }

  if (form.dataset.form === "account-setup") {
    applyAccountSetup(data);
    hideAccountSetup();
    if (authSession?.access_token) {
      await saveProfileSettings();
      closeModal();
      shouldOpenHome = true;
      showToast("Your plan is ready");
    } else {
      await signIn(state.profile.email);
      showToast("Your plan is ready. Verify your sign-in code.");
    }
  }

  if (form.dataset.form === "notifications") {
    state.profile.notifications = data.has("notifications");
    state.profile.weeklySummary = data.has("weeklySummary");
    await saveProfileSettings();
    closeModal();
    showToast("Notification settings saved");
  }

  if (form.dataset.form === "preferences") {
    state.profile.timezone = String(data.get("timezone") || state.profile.timezone);
    state.profile.units = String(data.get("units") || state.profile.units);
    state.profile.assistantInsights = data.has("assistantInsights");
    state.profile.compactCards = data.has("compactCards");
    await saveProfileSettings();
    closeModal();
    showToast("Dashboard preferences saved");
  }

  saveState();
  renderAll();
  if (shouldOpenHome) openView("home");
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.activityFilter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    saveState();
    renderActivity();
  });
});

activitySearch.addEventListener("input", () => {
  state.activitySearch = activitySearch.value;
  saveState();
  renderActivity();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  try {
    await signIn(String(data.get("email") || state.profile.email));
  } catch (error) {
    showToast(error.message || "Unable to send sign-in code");
  }
});

otpForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(otpForm);
  try {
    await completeSignIn(String(data.get("code") || ""));
    otpForm.reset();
  } catch (error) {
    showToast(error.message || "Unable to verify sign-in code");
  }
});

document.querySelectorAll(".suggestion-chip").forEach((button) => {
  button.addEventListener("click", () => processRequest(button.textContent));
});

document.getElementById("assistant-form").addEventListener("submit", (event) => {
  event.preventDefault();
  processRequest(input.value);
});

document.getElementById("open-assistant").addEventListener("click", showAssistant);
document.getElementById("close-assistant").addEventListener("click", hideAssistant);
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("week-summary-button").addEventListener("click", openWeekSummary);
document.getElementById("clear-activity-button").addEventListener("click", () => {
  if (state.authenticated && authSession?.access_token) {
    openModal({
      eyebrow: "ACTIVITY",
      title: "Activity follows your entries",
      body: `
        <div class="modal-notice"><p>Timeline items are created from saved entries. Entry deletion support will handle activity cleanup from the backend.</p></div>
        <button class="primary-button" data-modal-action="close">Done</button>
      `,
    });
    return;
  }

  openModal({
    eyebrow: "ACTIVITY",
    title: "Clear activity history?",
    body: `
      <div class="modal-notice"><p>This removes your activity timeline updates. Your dashboard totals will stay the same.</p></div>
      <div class="stacked-actions">
        <button class="danger-button" data-modal-action="clear-activity">Clear activity</button>
        <button class="secondary-button" data-modal-action="close">Cancel</button>
      </div>
    `,
  });
});
document.addEventListener("click", (event) => {
  const action = event.target.closest('[data-modal-action="clear-activity"]');
  if (!action) return;
  state.activities = [];
  saveState();
  renderAll();
  closeModal();
  showToast("Activity history cleared");
});
overlay.addEventListener("click", hideAssistant);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

micButton.addEventListener("click", () => {
  if (micButton.classList.contains("listening")) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  micButton.classList.add("listening");
  input.placeholder = "Listening...";

  if (!SpeechRecognition) {
    micButton.classList.remove("listening");
    input.placeholder = "Ask Speaklio anything...";
    showToast("Voice input is unavailable in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => processRequest(event.results[0][0].transcript);
  recognition.onerror = () => showToast("I could not hear that. Try typing your request.");
  recognition.onend = () => {
    micButton.classList.remove("listening");
    input.placeholder = "Ask Speaklio anything...";
  };
  recognition.start();
});

installStaticIcons();

async function initializeApp() {
  renderAll();
  openView(state.currentView || "home");
  if (!authSession?.access_token) return;

  try {
    await loadBackendData();
  } catch (error) {
    state.authenticated = true;
    saveState();
    renderAll();
    showBackendLoadError(error);
  }
}

initializeApp();
