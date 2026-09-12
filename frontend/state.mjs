const STORAGE_KEY = "speaklio-state-v3";

function firstName(name) {
  return String(name || "there").trim().split(/\s+/)[0] || "there";
}

function starterChatText(name) {
  return `Hi ${firstName(name)}. Tell me what you ate, spent, drank, or want to plan.`;
}

export function syncStarterChatGreeting(targetState) {
  const starterPattern = /^Hi .+\. Tell me what you ate, spent, drank, or want to plan\.$/;
  const firstChat = targetState.chats?.[0];
  if (firstChat?.sender === "assistant" && starterPattern.test(firstChat.text)) {
    firstChat.text = starterChatText(targetState.profile.name);
  }
}

function defaultProfileSettings() {
  return {
    name: "there",
    email: "",
    timezone: "America/Toronto",
    units: "Metric",
    notifications: true,
    weeklySummary: true,
    assistantInsights: true,
    compactCards: false,
    planPersonalized: false,
    monthlyBudget: 2000,
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
  };
}

function emptyDashboardState(profile = defaultProfileSettings()) {
  return {
    nutrition: { calories: 0, goal: profile.goals.calorieGoal, protein: 0, carbs: 0, fats: 0, fiber: 0 },
    finance: { spending: 0, budget: profile.monthlyBudget },
    sleep: { minutes: 0, quality: "Not logged", week: [0, 0, 0, 0, 0, 0, 0] },
    workout: { title: "No workout planned", time: "Not scheduled", duration: 0, completed: 0, goal: profile.goals.weeklyWorkouts },
    hydration: { ml: 0, goal: profile.goals.hydrationGoal },
    mindfulness: { count: 0, title: "Mindful moment", duration: 10 },
    dashboardInsights: null,
  };
}

function localUiDefaults(profile = defaultProfileSettings()) {
  return {
    installedPlugins: new Set(),
    currentView: "home",
    activityFilter: "all",
    activitySearch: "",
    activities: [],
    chats: [
      { sender: "assistant", text: starterChatText(profile.name) },
    ],
  };
}

export function makeDefaultState() {
  const profile = defaultProfileSettings();
  return {
    profile,
    ...emptyDashboardState(profile),
    ...localUiDefaults(profile),
  };
}

function localUiState(saved, defaults) {
  return {
    currentView: typeof saved?.currentView === "string" ? saved.currentView : defaults.currentView,
    activityFilter: typeof saved?.activityFilter === "string" ? saved.activityFilter : defaults.activityFilter,
    activitySearch: typeof saved?.activitySearch === "string" ? saved.activitySearch : defaults.activitySearch,
    chats: Array.isArray(saved?.chats) && saved.chats.length ? saved.chats : defaults.chats,
  };
}


function restoreLocalState(defaults, saved) {
  return {
    ...defaults,
    ...Object.fromEntries(Object.entries(saved).filter(([key]) => key in defaults)),
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
    ...localUiState(saved, defaults),
    activities: Array.isArray(saved.activities) ? saved.activities : defaults.activities,
  };
}

export function loadLocalState(storage) {
  const defaults = makeDefaultState();
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(STORAGE_KEY));
    if (!saved) return defaults;


    return restoreLocalState(defaults, saved);
  } catch {
    return defaults;
  }
}

export let state = loadLocalState();
syncStarterChatGreeting(state);


export function serializeState(value = state) {
  return { ...value, installedPlugins: [...value.installedPlugins] };
}

export function saveLocalState(storage = globalThis.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
}

export function resetState() {
  state = makeDefaultState();
}
