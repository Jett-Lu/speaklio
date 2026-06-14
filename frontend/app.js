const STORAGE_KEY = "speaklio-offline-demo-v2";
const API_BASE_URL = window.SPEAKLIO_API_BASE_URL || "http://localhost:3000";

const iconPaths = {
  home: '<path d="M3 10.5 10 4l7 6.5"/><path d="M5 9.5V17h10V9.5"/><path d="M8.5 17v-5h3v5"/>',
  clock: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.8 1.8"/>',
  grid: '<rect x="3" y="3" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1"/>',
  user: '<circle cx="10" cy="7" r="3"/><path d="M4 17c.7-2.7 2.7-4 6-4s5.3 1.3 6 4"/>',
  settings: '<circle cx="10" cy="10" r="2.5"/><path d="m15.7 11.8 1.1.9-1.4 2.4-1.3-.5a6 6 0 0 1-1.6.9l-.2 1.4H9.5l-.2-1.4a6 6 0 0 1-1.6-.9l-1.3.5L5 12.7l1.1-.9a6 6 0 0 1 0-1.8L5 9.1l1.4-2.4 1.3.5a6 6 0 0 1 1.6-.9L9.5 5h2.8l.2 1.3a6 6 0 0 1 1.6.9l1.3-.5 1.4 2.4-1.1.9a6 6 0 0 1 0 1.8Z"/>',
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
};

const plugins = [
  { id: "nutrition", name: "Nutrition", icon: "apple", description: "Track meals, calories, and daily macros." },
  { id: "finance", name: "Finance", icon: "wallet", description: "Log expenses and keep an eye on your budget." },
  { id: "sleep", name: "Sleep", icon: "moon", description: "Understand your rest and sleep patterns." },
  { id: "workout", name: "Workout", icon: "bolt", description: "Plan sessions and follow your weekly progress." },
  { id: "hydration", name: "Hydration", icon: "droplet", description: "Stay consistent with your daily water goal." },
  { id: "mindfulness", name: "Mindfulness", icon: "heart", description: "Make space for calm moments in your day." },
];

const pluginMap = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]));

function makeDefaultState() {
  return {
    profile: {
      name: "Jordan Miller",
      email: "jordan@example.com",
      notifications: true,
      weeklySummary: true,
      assistantInsights: true,
      compactCards: false,
    },
    nutrition: { calories: 1420, goal: 2100, protein: 72, carbs: 164, fats: 54 },
    finance: { spending: 1264, budget: 2000 },
    sleep: { minutes: 462, quality: "Good", week: [390, 430, 485, 415, 450, 510, 462] },
    workout: { title: "Upper body strength", time: "Tomorrow, 7:30 AM", duration: 45, completed: 3, goal: 4 },
    hydration: { ml: 1400, goal: 2500 },
    mindfulness: { count: 3, title: "Evening reset", duration: 10 },
    installedPlugins: new Set(["nutrition", "finance", "sleep", "workout"]),
    activityFilter: "all",
    activities: [
      { id: 1, plugin: "nutrition", title: "Logged avocado toast and coffee", detail: "Breakfast - 420 cal", time: "8:15 AM", day: "Today" },
      { id: 2, plugin: "sleep", title: "Sleep summary added", detail: "7h 42m - Good quality", time: "7:45 AM", day: "Today" },
      { id: 3, plugin: "finance", title: "Added grocery expense", detail: "Groceries - $68.42", time: "Yesterday", day: "Yesterday" },
      { id: 4, plugin: "workout", title: "Completed evening walk", detail: "32 minutes - 2.3 km", time: "Yesterday", day: "Yesterday" },
      { id: 5, plugin: "nutrition", title: "Logged chicken rice bowl", detail: "Dinner - 610 cal", time: "Yesterday", day: "Yesterday" },
    ],
    chats: [
      { sender: "assistant", text: "Hi Jordan. Tell me what you ate, spent, drank, or want to plan." },
    ],
  };
}

function loadState() {
  const defaults = makeDefaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaults;
    return {
      ...defaults,
      ...saved,
      profile: { ...defaults.profile, ...saved.profile },
      nutrition: { ...defaults.nutrition, ...saved.nutrition },
      finance: { ...defaults.finance, ...saved.finance },
      sleep: { ...defaults.sleep, ...saved.sleep },
      workout: { ...defaults.workout, ...saved.workout },
      hydration: { ...defaults.hydration, ...saved.hydration },
      mindfulness: { ...defaults.mindfulness, ...saved.mindfulness },
      installedPlugins: new Set(saved.installedPlugins || [...defaults.installedPlugins]),
      activities: Array.isArray(saved.activities) ? saved.activities : defaults.activities,
      chats: Array.isArray(saved.chats) && saved.chats.length ? saved.chats : defaults.chats,
    };
  } catch {
    return defaults;
  }
}

let state = loadState();

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

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      installedPlugins: [...state.installedPlugins],
    }));
  } catch {
    showToast("This browser could not save the latest local update.");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function updateDateAndProfile() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = state.profile.name.split(/\s+/)[0] || "there";
  document.getElementById("current-date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).toUpperCase();
  document.getElementById("greeting").textContent = `${greeting}, ${firstName}.`;
  document.getElementById("profile-name").textContent = state.profile.name;
  document.getElementById("profile-email").textContent = state.profile.email;
  document.querySelector(".mini-profile strong").textContent = state.profile.name;
  document.querySelectorAll(".avatar, .large-avatar").forEach((avatar) => {
    avatar.textContent = initials(state.profile.name);
  });
}

function updateDailyBalance() {
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
  document.querySelectorAll(".sleep-bars span").forEach((bar, index) => {
    bar.style.height = `${clamp((state.sleep.week[index] / 540) * 100, 20, 100)}%`;
  });

  document.getElementById("workout-title").textContent = state.workout.title;
  document.getElementById("workout-time").textContent = `${state.workout.time} - ${state.workout.duration} min`;
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
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === state.activityFilter);
  });
  document.getElementById("home-activity-list").innerHTML = state.activities.length
    ? state.activities.slice(0, 3).map(activityMarkup).join("")
    : '<p class="empty-state">Your latest updates will appear here.</p>';

  const filtered = state.activityFilter === "all"
    ? state.activities
    : state.activities.filter((item) => item.plugin === state.activityFilter);
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
}

function renderPlugins() {
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

function renderAll() {
  updateDateAndProfile();
  updateMetrics();
  renderActivity();
  renderPlugins();
  renderChats();
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

function openView(viewName) {
  views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  if (window.innerWidth <= 980) hideAssistant();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
      <form class="quick-form" data-form="meal">
        <h3>Log a meal</h3>
        <label>Meal description<input required name="description" placeholder="Eggs and toast" /></label>
        <div class="form-grid">
          <label>Calories<input required name="calories" type="number" min="1" value="320" /></label>
          <label>Protein (g)<input name="protein" type="number" min="0" value="18" /></label>
          <label>Carbs (g)<input name="carbs" type="number" min="0" value="32" /></label>
          <label>Fats (g)<input name="fats" type="number" min="0" value="12" /></label>
        </div>
        <button class="primary-button" type="submit">Add meal</button>
      </form>${footer}`,
    finance: `
      <div class="modal-stats">
        ${stat("Spent this month", `$${formatMoney(state.finance.spending)}`)}
        ${stat("Monthly budget", `$${formatMoney(state.finance.budget)}`)}
        ${stat("Remaining", `$${formatMoney(state.finance.budget - state.finance.spending)}`)}
      </div>
      <form class="quick-form" data-form="expense">
        <h3>Log an expense</h3>
        <div class="form-grid">
          <label>Amount<input required name="amount" type="number" min="0.01" step="0.01" placeholder="25.00" /></label>
          <label>Category<select name="category"><option>Dining</option><option>Groceries</option><option>Transport</option><option>Bills</option><option>Other</option></select></label>
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
      <form class="quick-form" data-form="sleep">
        <h3>Log last night's sleep</h3>
        <div class="form-grid">
          <label>Hours slept<input required name="hours" type="number" min="0" max="16" step="0.1" value="${(state.sleep.minutes / 60).toFixed(1)}" /></label>
          <label>Quality<select name="quality"><option>Great</option><option ${state.sleep.quality === "Good" ? "selected" : ""}>Good</option><option>Fair</option><option>Poor</option></select></label>
        </div>
        <button class="primary-button" type="submit">Save sleep</button>
      </form>${footer}`,
    workout: `
      <div class="modal-stats">
        ${stat("Next workout", state.workout.title)}
        ${stat("When", state.workout.time)}
        ${stat("Weekly progress", `${state.workout.completed} / ${state.workout.goal}`)}
      </div>
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
      <div class="quick-form">
        <h3>Add water</h3>
        <div class="preset-row">
          <button class="preset-button" data-modal-action="add-water" data-amount="250">+ 250 ml</button>
          <button class="preset-button" data-modal-action="add-water" data-amount="500">+ 500 ml</button>
          <button class="preset-button" data-modal-action="add-water" data-amount="750">+ 750 ml</button>
        </div>
      </div>${footer}`,
    mindfulness: `
      <div class="modal-stats">
        ${stat("This week", `${state.mindfulness.count} moments`)}
        ${stat("Suggested", state.mindfulness.title)}
        ${stat("Default session", `${state.mindfulness.duration} min`)}
      </div>
      <div class="quick-form">
        <h3>Complete a mindful moment</h3>
        <p>Choose a short breathing session. Speaklio will log it as completed for this offline demo.</p>
        <div class="preset-row">
          <button class="preset-button" data-modal-action="complete-mindfulness" data-amount="5">5 min</button>
          <button class="preset-button" data-modal-action="complete-mindfulness" data-amount="10">10 min</button>
          <button class="preset-button" data-modal-action="complete-mindfulness" data-amount="15">15 min</button>
        </div>
      </div>${footer}`,
  };

  openModal({ eyebrow: plugin.name.toUpperCase(), title: plugin.name, body: content[pluginId] });
}

function togglePlugin(pluginId) {
  const plugin = pluginMap[pluginId];
  if (!plugin) return;
  if (state.installedPlugins.has(pluginId)) {
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

function logWater(amount) {
  state.hydration.ml += amount;
  addActivity({ plugin: "hydration", title: "Added water", detail: `${amount} ml - ${state.hydration.ml} ml today` });
  saveState();
  renderAll();
  showToast(`${amount} ml added to Hydration`);
}

function logMindfulness(minutes) {
  state.mindfulness.count += 1;
  addActivity({ plugin: "mindfulness", title: "Completed mindful moment", detail: `${minutes}-minute guided breathing` });
  saveState();
  renderAll();
  showToast("Mindful moment completed");
}

function completeWorkout() {
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
          <label>Email<input required name="email" type="email" value="${escapeHtml(state.profile.email)}" /></label>
          <button class="primary-button" type="submit">Save profile</button>
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
          <strong>Your demo data stays in this browser.</strong>
          <p>This prototype uses local storage only. It does not send your health or financial information to a server.</p>
        </div>
        <div class="stacked-actions">
          <button class="wide-action-button" data-modal-action="export-data">Export my local data</button>
          <button class="danger-button" data-modal-action="confirm-reset">Reset demo data</button>
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
          <label class="toggle-row"><span><strong>Assistant insights</strong><small>Let the demo offer simple proactive suggestions.</small></span><input name="assistantInsights" type="checkbox" ${state.profile.assistantInsights ? "checked" : ""} /></label>
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
  link.download = "speaklio-demo-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Local demo data exported");
}

function resetDemo() {
  state = makeDefaultState();
  saveState();
  renderAll();
  closeModal();
  showToast("Demo data reset");
}

function ensureInstalled(pluginId) {
  if (state.installedPlugins.has(pluginId)) return true;
  addMessage(`${pluginMap[pluginId].name} is not installed yet. Add it from the plugin store and I can track that for you.`, "assistant");
  showToast(`${pluginMap[pluginId].name} plugin is not installed`);
  return false;
}

function classifyExpense(text) {
  if (/(grocery|groceries|supermarket)/.test(text)) return "Groceries";
  if (/(gas|uber|taxi|bus|transport)/.test(text)) return "Transport";
  if (/(bill|rent|phone|internet)/.test(text)) return "Bills";
  if (/(lunch|dinner|coffee|restaurant|breakfast)/.test(text)) return "Dining";
  return "Other";
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function joinParts(parts, separator = " - ") {
  return parts.filter(Boolean).join(separator);
}

async function parseWithLocalAi(text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`${API_BASE_URL}/assistant/parse`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`assistant request failed ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function answerDashboardQuestion(question) {
  const lower = question.toLowerCase();

  if (/(calorie|nutrition|macro|protein)/.test(lower)) {
    if (!ensureInstalled("nutrition")) return null;
    return `You are at ${state.nutrition.calories.toLocaleString()} of ${state.nutrition.goal.toLocaleString()} calories today, with ${state.nutrition.protein}g of protein.`;
  }

  if (/(spend|spent|budget|money|finance)/.test(lower)) {
    if (!ensureInstalled("finance")) return null;
    return `You have spent $${formatMoney(state.finance.spending)} of your $${formatMoney(state.finance.budget)} monthly budget.`;
  }

  if (/(sleep|slept|rest)/.test(lower)) {
    if (!ensureInstalled("sleep")) return null;
    return `You slept for ${formatMinutes(state.sleep.minutes)} last night. Your sleep quality was ${state.sleep.quality.toLowerCase()}.`;
  }

  if (/(water|hydrate|hydration)/.test(lower)) {
    if (!ensureInstalled("hydration")) return null;
    return `You are at ${(state.hydration.ml / 1000).toFixed(1)} L of your ${(state.hydration.goal / 1000).toFixed(1)} L water goal today.`;
  }

  return "I can answer dashboard questions about calories, spending, sleep, and hydration right now.";
}

function applyAiAction(action, originalText) {
  const type = textValue(action?.type);

  if (type === "log_workout") {
    if (!ensureInstalled("workout")) return { handled: true, changed: false };
    const exercise = textValue(action.exercise) || "workout";
    const sets = finiteNumber(action.sets);
    const reps = finiteNumber(action.reps);
    const load = finiteNumber(action.load);
    const duration = finiteNumber(action.duration_minutes);
    const loadUnit = textValue(action.load_unit);
    const detail = joinParts([
      sets !== null ? `${sets} sets` : null,
      reps !== null ? `${reps} reps` : null,
      load !== null ? `${load}${loadUnit ? ` ${loadUnit}` : ""}` : null,
      duration !== null ? `${duration} minutes` : null,
      textValue(action.date),
    ]);

    addActivity({
      plugin: "workout",
      title: `Logged ${exercise}`,
      detail: detail || "Workout logged",
    });
    showToast("Workout logged with local AI");
    return { handled: true, changed: true, message: `Logged ${exercise}${detail ? ` (${detail})` : ""}.` };
  }

  if (type === "log_food") {
    if (!ensureInstalled("nutrition")) return { handled: true, changed: false };
    const food = textValue(action.food) || "food";
    const quantity = textValue(action.quantity);
    const meal = textValue(action.meal);
    const calories = finiteNumber(action.calories);

    if (calories !== null) {
      state.nutrition.calories += calories;
    }

    addActivity({
      plugin: "nutrition",
      title: `Logged ${food}`,
      detail: joinParts([
        meal && meal !== "unknown" ? meal[0].toUpperCase() + meal.slice(1) : "Meal",
        quantity,
        calories !== null ? `${calories} cal` : "Calories not provided",
      ]),
    });
    showToast("Food logged with local AI");
    return {
      handled: true,
      changed: true,
      message: calories !== null
        ? `Logged ${food} at ${calories} calories.`
        : `Logged ${food}. Add calories if you want the daily total updated.`,
    };
  }

  if (type === "log_calories") {
    if (!ensureInstalled("nutrition")) return { handled: true, changed: false };
    const calories = finiteNumber(action.calories);
    if (calories === null) {
      return { handled: true, changed: false, message: "Tell me the calorie number and I can log it." };
    }

    state.nutrition.calories += calories;
    const meal = textValue(action.meal);
    addActivity({
      plugin: "nutrition",
      title: "Logged calories",
      detail: joinParts([meal && meal !== "unknown" ? meal[0].toUpperCase() + meal.slice(1) : "Calories", `${calories} cal`]),
    });
    showToast("Calories logged with local AI");
    return { handled: true, changed: true, message: `Logged ${calories} calories. Your daily total is now ${state.nutrition.calories.toLocaleString()} calories.` };
  }

  if (type === "log_weight") {
    const weight = finiteNumber(action.weight);
    const unit = textValue(action.weight_unit);
    const date = textValue(action.date);
    if (weight === null) {
      return { handled: true, changed: false, message: "Tell me the weight number and unit, and I can log it." };
    }

    addActivity({
      plugin: "profile",
      title: "Logged body weight",
      detail: joinParts([`${weight}${unit ? ` ${unit}` : ""}`, date]),
    });
    showToast("Weight logged with local AI");
    return { handled: true, changed: true, message: `Logged your weight as ${weight}${unit ? ` ${unit}` : ""}${date ? ` for ${date}` : ""}.` };
  }

  if (type === "set_weight_goal") {
    const targetWeight = finiteNumber(action.target_weight);
    const unit = textValue(action.weight_unit);
    const timeline = textValue(action.timeline);
    if (targetWeight === null) {
      return { handled: true, changed: false, message: "Tell me the target weight and I can save that goal." };
    }

    addActivity({
      plugin: "profile",
      title: "Updated weight goal",
      detail: joinParts([`Target ${targetWeight}${unit ? ` ${unit}` : ""}`, timeline]),
    });
    showToast("Goal captured with local AI");
    return { handled: true, changed: true, message: `Saved your target weight as ${targetWeight}${unit ? ` ${unit}` : ""}${timeline ? ` ${timeline}` : ""}.` };
  }

  if (type === "ask_dashboard_question") {
    const answer = answerDashboardQuestion(textValue(action.question) || originalText);
    return { handled: true, changed: false, message: answer };
  }

  if (type === "request_tip") {
    return {
      handled: true,
      changed: false,
      message: "A useful next step: log the exact numbers you know, and I will keep the dashboard totals honest instead of estimating.",
    };
  }

  if (type === "request_macro_update") {
    return {
      handled: true,
      changed: false,
      message: "I can capture macro update requests, but macro target editing is not wired into this prototype yet.",
    };
  }

  if (type === "set_profile") {
    addActivity({
      plugin: "profile",
      title: "Captured profile update",
      detail: "Profile details parsed by local AI",
    });
    return {
      handled: true,
      changed: true,
      message: "I captured those profile details. The prototype does not have full profile fields for them yet.",
    };
  }

  if (type === "unknown") {
    return {
      handled: true,
      changed: false,
      message: textValue(action.message) || "That is outside Speaklio's tracking scope right now.",
    };
  }

  return { handled: false, changed: false };
}

function shouldUseOfflineFallback(result, text) {
  const actions = Array.isArray(result?.actions) ? result.actions : [];
  if (!actions.length || actions.some((action) => action?.type !== "unknown")) return false;

  return shouldUseOfflineDemoFeature(text);
}

function shouldUseOfflineDemoFeature(text) {
  return /(water|drank|hydrate|hydration|spent|expense|paid|bought|budget|spending|sleep|slept|last night|meditat|mindful|breathing)/.test(text.toLowerCase());
}

function applyAiResult(result, originalText) {
  if (result?.needs_confirmation) {
    addMessage(textValue(result.message) || "Can you add a little more detail before I log that?", "assistant");
    return true;
  }

  if (!Array.isArray(result?.actions) || !result.actions.length) {
    return false;
  }

  const messages = [];
  let handled = false;
  let changed = false;

  result.actions.forEach((action) => {
    const outcome = applyAiAction(action, originalText);
    if (!outcome.handled) return;
    handled = true;
    changed ||= outcome.changed;
    if (outcome.message) messages.push(outcome.message);
  });

  if (!handled) return false;
  if (changed) {
    saveState();
    renderAll();
  }
  if (messages.length) addMessage(messages.join(" "), "assistant");
  return true;
}

async function processRequest(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  if (!text) return;
  addMessage(text, "user");
  input.value = "";

  if (!shouldUseOfflineDemoFeature(text)) {
    try {
      const result = await parseWithLocalAi(text);
      if (!shouldUseOfflineFallback(result, text) && applyAiResult(result, text)) return;
    } catch (error) {
      console.warn("Local AI unavailable; using offline fallback.", error);
      showToast("Local AI unavailable. Using offline fallback.");
    }
  }

  setTimeout(() => {
    const waterMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ml|milliliters?|l|liters?)/);
    if (/(water|drank|hydrate|hydration)/.test(lower) && waterMatch) {
      if (!ensureInstalled("hydration")) return;
      const amount = waterMatch[2].startsWith("l") ? Number(waterMatch[1]) * 1000 : Number(waterMatch[1]);
      logWater(amount);
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
      logMindfulness(minutes);
      addMessage(`Nice work. I logged a ${minutes}-minute mindful moment.`, "assistant");
      return;
    }

    if (/(sleep|slept|last night)/.test(lower)) {
      if (!ensureInstalled("sleep")) return;
      const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
      if (hoursMatch && /(slept|log|had)/.test(lower)) {
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
        addMessage("Tell me the amount and I will add that expense. For example: “I spent $18 on groceries.”", "assistant");
        return;
      }
      const amount = Number(amountMatch[1]);
      const category = classifyExpense(lower);
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
      completeWorkout();
      addMessage(`Logged. That brings you to ${state.workout.completed} of ${state.workout.goal} workouts this week.`, "assistant");
      return;
    }

    if (/(workout|exercise|training|tomorrow)/.test(lower)) {
      if (!ensureInstalled("workout")) return;
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

    addMessage("I am running offline, so I can handle the demo basics: meals, expenses, sleep, workouts, water, and mindful moments. Try asking for help to see examples.", "assistant");
  }, 350);
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) openView(viewButton.dataset.view);

  const viewTrigger = event.target.closest("[data-view-trigger]");
  if (viewTrigger) openView(viewTrigger.dataset.viewTrigger);

  const pluginToggle = event.target.closest("[data-plugin-toggle]");
  if (pluginToggle) togglePlugin(pluginToggle.dataset.pluginToggle);

  const pluginOpen = event.target.closest("[data-plugin-open]");
  if (pluginOpen) openPlugin(pluginOpen.dataset.pluginOpen);

  const pluginAction = event.target.closest("[data-plugin-action]");
  if (pluginAction?.dataset.pluginAction === "mindfulness-start") {
    logMindfulness(state.mindfulness.duration);
    openPlugin("mindfulness");
  }

  const profileAction = event.target.closest("[data-profile-action]");
  if (profileAction) openProfileAction(profileAction.dataset.profileAction);

  const modalAction = event.target.closest("[data-modal-action]");
  if (!modalAction) return;
  const action = modalAction.dataset.modalAction;
  if (action === "close") closeModal();
  if (action === "add-water") {
    logWater(Number(modalAction.dataset.amount));
    openPlugin("hydration");
  }
  if (action === "complete-mindfulness") {
    logMindfulness(Number(modalAction.dataset.amount));
    openPlugin("mindfulness");
  }
  if (action === "complete-workout") {
    completeWorkout();
    openPlugin("workout");
  }
  if (action === "open-store") {
    closeModal();
    openView("plugins");
  }
  if (action === "export-data") exportData();
  if (action === "confirm-reset") {
    openModal({
      eyebrow: "RESET DEMO",
      title: "Start fresh?",
      body: `
        <div class="modal-notice"><p>This clears the local demo updates and restores the example dashboard. Nothing is sent anywhere.</p></div>
        <div class="stacked-actions">
          <button class="danger-button" data-modal-action="reset-demo">Reset local data</button>
          <button class="secondary-button" data-modal-action="close">Keep my data</button>
        </div>
      `,
    });
  }
  if (action === "reset-demo") resetDemo();
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);

  if (form.dataset.form === "meal") {
    const calories = Number(data.get("calories"));
    state.nutrition.calories += calories;
    state.nutrition.protein += Number(data.get("protein") || 0);
    state.nutrition.carbs += Number(data.get("carbs") || 0);
    state.nutrition.fats += Number(data.get("fats") || 0);
    addActivity({ plugin: "nutrition", title: `Logged ${data.get("description")}`, detail: `Meal - ${calories} cal` });
    showToast("Meal added to Nutrition");
    openPlugin("nutrition");
  }

  if (form.dataset.form === "expense") {
    const amount = Number(data.get("amount"));
    const category = String(data.get("category"));
    const note = String(data.get("note") || category);
    state.finance.spending += amount;
    addActivity({ plugin: "finance", title: `Added ${note}`, detail: `${category} - $${amount.toFixed(2)}` });
    showToast("Expense added to Finance");
    openPlugin("finance");
  }

  if (form.dataset.form === "sleep") {
    state.sleep.minutes = Number(data.get("hours")) * 60;
    state.sleep.quality = String(data.get("quality"));
    state.sleep.week[state.sleep.week.length - 1] = state.sleep.minutes;
    addActivity({ plugin: "sleep", title: "Updated sleep summary", detail: `${formatMinutes(state.sleep.minutes)} - ${state.sleep.quality} quality` });
    showToast("Sleep summary updated");
    openPlugin("sleep");
  }

  if (form.dataset.form === "workout") {
    state.workout.title = String(data.get("title"));
    state.workout.time = String(data.get("time"));
    state.workout.duration = Number(data.get("duration"));
    addActivity({ plugin: "workout", title: `Planned ${state.workout.title.toLowerCase()}`, detail: `${state.workout.time} - ${state.workout.duration} min` });
    showToast("Workout plan updated");
    openPlugin("workout");
  }

  if (form.dataset.form === "profile") {
    state.profile.name = String(data.get("name"));
    state.profile.email = String(data.get("email"));
    closeModal();
    showToast("Profile updated");
  }

  if (form.dataset.form === "notifications") {
    state.profile.notifications = data.has("notifications");
    state.profile.weeklySummary = data.has("weeklySummary");
    closeModal();
    showToast("Notification settings saved");
  }

  if (form.dataset.form === "preferences") {
    state.profile.assistantInsights = data.has("assistantInsights");
    state.profile.compactCards = data.has("compactCards");
    closeModal();
    showToast("Dashboard preferences saved");
  }

  saveState();
  renderAll();
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.activityFilter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    saveState();
    renderActivity();
  });
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
  openModal({
    eyebrow: "ACTIVITY",
    title: "Clear activity history?",
    body: `
      <div class="modal-notice"><p>This removes your local timeline updates. Your dashboard totals will stay the same.</p></div>
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
    setTimeout(() => {
      micButton.classList.remove("listening");
      input.placeholder = "Ask Speaklio anything...";
      showToast("Voice demo used. Browser speech recognition is unavailable.");
      processRequest("I had eggs and toast for breakfast");
    }, 1100);
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
renderAll();
