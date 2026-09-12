import { iconPaths, plugins, pluginMap, pluginUiConfig, integrationCatalog } from "./catalog.mjs";
import { state, saveLocalState, resetState, serializeState } from "./state.mjs";
import { escapeHtml, clamp, percentOf, formatMoney, formatMinutes, formatWeight, formatGoalLabel, formatActivityLabel, getTailoredGoals, initials } from "./format.mjs";
import { createAssistant } from "./assistant.mjs";

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
  const statusLabel = integration.connected ? "Connected" : integration.statusLabel || "Coming soon";

  return `
    <article class="integration-card">
      <span class="plugin-icon ${escapeHtml(integration.color)}">${iconMarkup(integration.icon)}</span>
      <div>
        <strong>${escapeHtml(integration.name)}</strong>
        <small>${escapeHtml(integration.panelCopy)}</small>
      </div>
      <button class="store-detail-button" type="button" data-integration-action="${escapeHtml(integrationId)}">${escapeHtml(statusLabel)}</button>
    </article>
  `;
}

function accountEmailField() {
  return `<label>Email (optional)<input name="email" type="email" value="${escapeHtml(state.profile.email)}" /></label>`;
}

function iconMarkup(name) {
  return `<span class="icon"><svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[name] || ""}</svg></span>`;
}

function installStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((element) => {
    element.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[element.dataset.icon] || ""}</svg>`;
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
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
  document.getElementById("profile-email").textContent = state.profile.email || "Saved in this browser";
  document.querySelector(".mini-profile strong").textContent = state.profile.name;
  if (state.profile.planPersonalized) {
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
  } else {
    document.getElementById("profile-weight").textContent = "Weight not set";
    document.getElementById("profile-height").textContent = "Height not set";
    document.getElementById("profile-goal").textContent = "Goal not set";
    document.getElementById("profile-target-weight").textContent = "Target not set";
    document.getElementById("profile-calorie-goal").textContent = "Calories not set";
    document.getElementById("profile-protein-goal").textContent = "Protein not set";
    document.getElementById("profile-age").textContent = "Age not set";
    document.getElementById("profile-activity-level").textContent = "Activity not set";
    document.getElementById("profile-workout-goal").textContent = "Workouts not set";
    document.getElementById("profile-hydration-goal").textContent = "Water goal not set.";
  }
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
  const balance = state.dashboardInsights?.balance;
  if (balance) {
    const score = Number(balance.score || 0);
    document.getElementById("balance-score").textContent = score;
    document.getElementById("balance-ring").style.strokeDasharray = `${clamp(score)} 100`;
    document.getElementById("balance-ring-wrap").setAttribute("aria-label", `Daily balance score ${score}`);
    document.getElementById("balance-title").textContent = balance.title || "Today at a glance";
    document.getElementById("balance-copy").textContent = balance.copy || `${balance.onTrack || 0} of ${balance.total || 0} daily goals are on track.`;
    return;
  }

  if (state.activities.length === 0) {
    document.getElementById("balance-score").textContent = "0";
    document.getElementById("balance-ring").style.strokeDasharray = "0 100";
    document.getElementById("balance-ring-wrap").setAttribute("aria-label", "Daily balance score 0");
    document.getElementById("balance-title").textContent = "Start with one logged update";
    document.getElementById("balance-copy").textContent = "Your real progress appears after your first entry.";
    return;
  }

  const metrics = [
    percentOf(state.nutrition.calories, state.nutrition.goal),
    state.finance.spending <= state.finance.budget ? 100 : percentOf(state.finance.budget, state.finance.spending),
    percentOf(state.sleep.minutes, 480),
    percentOf(state.workout.completed, state.workout.goal),
  ];
  if (state.installedPlugins.has("hydration")) metrics.push(percentOf(state.hydration.ml, state.hydration.goal));
  const score = Math.round(metrics.reduce((total, metric) => total + metric, 0) / metrics.length);
  const onTrack = metrics.filter((metric) => metric >= 70).length;
  document.getElementById("balance-score").textContent = score;
  document.getElementById("balance-ring").style.strokeDasharray = `${score} 100`;
  document.getElementById("balance-ring-wrap").setAttribute("aria-label", `Daily balance score ${score}`);
  document.getElementById("balance-title").textContent = score >= 75 ? "You are doing well today" : "A few small wins will help";
  document.getElementById("balance-copy").textContent = `${onTrack} of ${metrics.length} daily goals are on track.`;
}

function updateInsightPanel() {
  const insights = state.dashboardInsights;
  if (insights) {
    document.getElementById("next-action-title").textContent = insights.nextAction?.title || "Review your day";
    document.getElementById("next-action-copy").textContent = insights.nextAction?.copy || "Your next action appears after dashboard data loads.";
    document.getElementById("readiness-score").textContent = insights.readiness || "Not logged";
    document.getElementById("streak-count").textContent = `${insights.streak?.days || 0} days`;
    document.getElementById("attention-nutrition-title").textContent = insights.attention?.nutrition?.title || "Nutrition";
    document.getElementById("attention-nutrition-copy").textContent = insights.attention?.nutrition?.copy || "Log meals to unlock nutrition insights.";
    document.getElementById("attention-finance-title").textContent = insights.attention?.finance?.title || "Budget";
    document.getElementById("attention-finance-copy").textContent = insights.attention?.finance?.copy || "Log expenses to track budget pace.";
    const sleepTitle = document.getElementById("attention-sleep-title");
    const sleepCopy = document.getElementById("attention-sleep-copy");
    if (sleepTitle) sleepTitle.textContent = insights.attention?.sleep?.title || "Sleep consistency";
    if (sleepCopy) sleepCopy.textContent = insights.attention?.sleep?.copy || "Log sleep to unlock rest insights.";
    return;
  }

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
}

function agendaItemMarkup(item, index) {
  const active = item.active ?? index === 0;
  return `
    <div class="agenda-item ${active ? "active" : ""}">
      <span>${escapeHtml(item.time)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </div>
  `;
}

function agendaItems() {
  const todayActivity = state.activities
    .filter((item) => item.day === "Today")
    .slice(0, 2)
    .map((item) => ({
      time: item.time || "Today",
      title: item.title,
      detail: item.detail,
    }));
  const workoutInsight = state.dashboardInsights?.agenda?.workout || {};
  const workoutTitle = workoutInsight.title || state.workout.title;
  const workoutDetail = workoutInsight.meta || (state.workout.duration ? `${state.workout.duration} minute workout` : "No workout scheduled");
  const hasPlannedWorkout = workoutTitle && workoutTitle !== "No workout planned";
  const workoutTime = state.workout.time && state.workout.time !== "Not scheduled" ? state.workout.time : "Plan";
  const items = [...todayActivity];

  if (hasPlannedWorkout) {
    items.push({
      time: workoutTime,
      title: workoutTitle,
      detail: workoutDetail,
    });
  }

  if (!items.length) {
    return [{
      time: "Today",
      title: "No updates yet",
      detail: "Log an entry to build your day.",
      active: false,
    }];
  }

  return items.slice(0, 3);
}

function renderAgenda() {
  const agendaList = document.getElementById("agenda-list");
  if (!agendaList) return;
  agendaList.innerHTML = agendaItems().map(agendaItemMarkup).join("");
}

function updateMetrics() {
  const nutritionPercent = Math.round(percentOf(state.nutrition.calories, state.nutrition.goal));
  document.getElementById("calorie-count").textContent = state.nutrition.calories.toLocaleString();
  document.getElementById("nutrition-goal-copy").textContent = `of ${state.nutrition.goal.toLocaleString()} cal`;
  document.getElementById("nutrition-percent").textContent = `${nutritionPercent}%`;
  document.getElementById("nutrition-ring").style.strokeDasharray = `${clamp(nutritionPercent)} 100`;
  document.getElementById("nutrition-ring-wrap").setAttribute("aria-label", `${nutritionPercent} percent of calorie goal`);
  document.getElementById("protein-count").textContent = `${state.nutrition.protein}g`;
  document.getElementById("carbs-count").textContent = `${state.nutrition.carbs}g`;
  document.getElementById("fats-count").textContent = `${state.nutrition.fats}g`;
  document.getElementById("fiber-count").textContent = `${state.nutrition.fiber}g`;

  const budgetLeft = state.finance.budget - state.finance.spending;
  const financePercent = Math.round(percentOf(state.finance.spending, state.finance.budget));
  document.getElementById("spending-count").textContent = `$${formatMoney(state.finance.spending)}`;
  document.getElementById("budget-left").textContent = state.finance.budget
    ? budgetLeft >= 0 ? `$${formatMoney(budgetLeft)} left` : `$${formatMoney(Math.abs(budgetLeft))} over`
    : "Set budget";
  document.getElementById("finance-progress").style.width = `${clamp(financePercent)}%`;
  const trend = document.getElementById("finance-trend");
  trend.textContent = state.finance.budget
    ? budgetLeft >= 0 ? `${100 - financePercent}% left` : `${financePercent - 100}% over`
    : "Budget not set";
  trend.classList.toggle("positive", budgetLeft >= 0);
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

  const hydrationPercent = Math.round(percentOf(state.hydration.ml, state.hydration.goal));
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
  renderAgenda();
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

function renderIntegrations() {
  const integrationGrid = document.getElementById("integration-grid");
  if (!integrationGrid) return;
  integrationGrid.innerHTML = Object.keys(integrationCatalog).map(integrationCardMarkup).join("");
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
  syncProfileGoalsToDashboard();
  updateDateAndProfile();
  updateMetrics();
  renderActivity();
  renderPlugins();
  renderIntegrations();
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
            <div><strong>Save</strong><span>Use the Nutrition form to save calories and macros locally.</span></div>
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
  const statusLabel = integration.connected ? "connected" : (integration.statusLabel || "coming soon").toLowerCase();

  openModal({
    eyebrow: "CONNECTED HEALTH",
    title: integration.name,
    body: `
      <div class="integration-detail">
        <span class="plugin-icon ${escapeHtml(integration.color)}">${iconMarkup(integration.icon)}</span>
        <div>
          <h3>${escapeHtml(integration.name)} sync is ${escapeHtml(statusLabel)}</h3>
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
  const email = String(data.get("email") || "").trim();
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
  state.profile.planPersonalized = true;
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

function pluginInsight(pluginId) {
  const attention = state.dashboardInsights?.attention || {};
  if (pluginId === "nutrition") {
    return attention.nutrition || {
      title: state.nutrition.calories ? "Nutrition pacing" : "No meals logged",
      copy: state.nutrition.calories
        ? `${Math.max(0, state.profile.goals.proteinGoal - state.nutrition.protein)}g protein left for today's goal.`
        : "Nutrition insights appear after you log food or calories.",
    };
  }
  if (pluginId === "finance") {
    const budgetLeft = state.finance.budget - state.finance.spending;
    return attention.finance || {
      title: budgetLeft >= 0 ? "Budget pace" : "Budget overrun",
      copy: budgetLeft >= 0
        ? `$${formatMoney(budgetLeft)} left this month.`
        : `$${formatMoney(Math.abs(budgetLeft))} over budget.`,
    };
  }
  if (pluginId === "sleep") {
    return attention.sleep || {
      title: state.sleep.minutes ? "Sleep consistency" : "No sleep logged",
      copy: state.sleep.minutes ? `Last sleep was ${formatMinutes(state.sleep.minutes)}.` : "Sleep insights appear after you log rest.",
    };
  }
  if (pluginId === "workout") {
    const agenda = state.dashboardInsights?.agenda?.workout;
    return {
      title: agenda?.title || "Workout plan",
      copy: agenda?.meta || `${state.workout.completed} of ${state.workout.goal} weekly workouts completed.`,
    };
  }
  if (pluginId === "hydration") {
    const remaining = Math.max(0, state.hydration.goal - state.hydration.ml);
    return {
      title: remaining ? "Hydration pace" : "Hydration goal reached",
      copy: remaining ? `${remaining} ml left for today's water goal.` : "You are at or above today's water goal.",
    };
  }
  if (pluginId === "mindfulness") {
    return {
      title: state.mindfulness.count ? "Mindfulness this week" : "No mindful moments logged",
      copy: state.mindfulness.count
        ? `${state.mindfulness.count} mindful ${state.mindfulness.count === 1 ? "moment" : "moments"} logged this week.`
        : "Mindfulness insights appear after your first session.",
    };
  }
  return { title: "Plugin insight", copy: "Insights appear after you log activity." };
}

function pluginInsightNote(pluginId) {
  const insight = pluginInsight(pluginId);
  return insightNote(insight.title, insight.copy);
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
        ${stat("Fiber", `${state.nutrition.fiber}g`)}
      </div>
      ${pluginInsightNote("nutrition")}
      ${nutritionScanPanel()}
      <form class="quick-form" data-form="meal">
        <h3>Log a meal</h3>
        <label>Meal description<input required name="description" placeholder="Describe the meal" /></label>
        <div class="form-grid">
          <label>Calories<input required name="calories" type="number" min="1" placeholder="Calories" /></label>
          <label>Protein (g)<input name="protein" type="number" min="0" placeholder="Protein" /></label>
          <label>Carbs (g)<input name="carbs" type="number" min="0" placeholder="Carbs" /></label>
          <label>Fats (g)<input name="fats" type="number" min="0" placeholder="Fats" /></label>
          <label>Fiber (g)<input name="fiber" type="number" min="0" placeholder="Fiber" /></label>
        </div>
        <button class="primary-button" type="submit">Add meal</button>
      </form>${footer}`,
    finance: `
      <div class="modal-stats">
        ${stat("Spent this month", `$${formatMoney(state.finance.spending)}`)}
        ${stat("Monthly budget", `$${formatMoney(state.finance.budget)}`)}
        ${stat("Remaining", `$${formatMoney(state.finance.budget - state.finance.spending)}`)}
      </div>
      ${pluginInsightNote("finance")}
      <form class="quick-form" data-form="expense">
        <h3>Log an expense</h3>
        <div class="form-grid">
          <label>Amount<input required name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" /></label>
          <label>Category<select name="category">${optionsMarkup(pluginUiConfig.finance.categories)}</select></label>
        </div>
        <label>Note<input name="note" placeholder="Optional note" /></label>
        <button class="primary-button" type="submit">Add expense</button>
      </form>${footer}`,
    sleep: `
      <div class="modal-stats">
        ${stat("Last night", formatMinutes(state.sleep.minutes))}
        ${stat("Quality", state.sleep.quality)}
        ${stat("Weekly average", formatMinutes(state.sleep.week.reduce((sum, value) => sum + value, 0) / state.sleep.week.length))}
      </div>
      ${pluginInsightNote("sleep")}
      <form class="quick-form" data-form="sleep">
        <h3>Log last night's sleep</h3>
        <div class="form-grid">
          <label>Hours slept<input required name="hours" type="number" min="0" max="16" step="0.1" value="${state.sleep.minutes ? (state.sleep.minutes / 60).toFixed(1) : ""}" /></label>
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
      ${pluginInsightNote("workout")}
      <button class="wide-action-button" data-modal-action="complete-workout">${iconMarkup("bolt")} Mark current workout complete</button>
      <form class="quick-form" data-form="workout">
        <h3>Plan your next workout</h3>
        <label>Workout name<input required name="title" value="${state.workout.title === "No workout planned" ? "" : escapeHtml(state.workout.title)}" /></label>
        <div class="form-grid">
          <label>When<input required name="time" value="${state.workout.time === "Not scheduled" ? "" : escapeHtml(state.workout.time)}" /></label>
          <label>Minutes<input required name="duration" type="number" min="5" value="${state.workout.duration || ""}" /></label>
        </div>
        <button class="primary-button" type="submit">Save workout</button>
      </form>${footer}`,
    hydration: `
      <div class="modal-stats">
        ${stat("Water today", `${(state.hydration.ml / 1000).toFixed(1)} L`)}
        ${stat("Daily goal", `${(state.hydration.goal / 1000).toFixed(1)} L`)}
        ${stat("Remaining", `${(Math.max(0, state.hydration.goal - state.hydration.ml) / 1000).toFixed(1)} L`)}
      </div>
      ${pluginInsightNote("hydration")}
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
      ${pluginInsightNote("mindfulness")}
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

  state.hydration.ml += amount;
  addActivity({ plugin: "hydration", title: "Added water", detail: `${amount} ml - ${state.hydration.ml} ml today` });
  saveState();
  renderAll();
  showToast(`${amount} ml added to Hydration`);
}

async function logMindfulness(minutes) {

  state.mindfulness.count += 1;
  addActivity({ plugin: "mindfulness", title: "Completed mindful moment", detail: `${minutes}-minute guided breathing` });
  saveState();
  renderAll();
  showToast("Mindful moment completed");
}

async function completeWorkout() {

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
            <label>Monthly budget<input required name="monthlyBudget" type="number" min="0" max="100000" step="1" value="${state.profile.monthlyBudget ?? goals.monthlyBudget ?? state.finance.budget}" /></label>
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
          <label class="toggle-row"><span><strong>Daily reminders</strong><small>Saved preference only; reminders are not sent yet.</small></span><input name="notifications" type="checkbox" ${state.profile.notifications ? "checked" : ""} /></label>
          <label class="toggle-row"><span><strong>Weekly summary</strong><small>Saved preference only; scheduled summaries are not sent yet.</small></span><input name="weeklySummary" type="checkbox" ${state.profile.weeklySummary ? "checked" : ""} /></label>
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
          <p>Review export, reset, and connected-app controls for data saved in this browser.</p>
        </div>
        <div class="stacked-actions">
          <button class="wide-action-button" data-modal-action="export-data">Export my data</button>
          <button class="danger-button" data-modal-action="confirm-reset">Reset local data</button>
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
  const payload = JSON.stringify(serializeState(), null, 2);
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
  resetState();
  saveState();
  renderAll();
  closeModal();
  showToast("Local data reset");
}

function saveState() {
  try { saveLocalState(); }
  catch { showToast("This browser could not save the latest update. Export your data before closing."); }
}

const handleRequest = createAssistant({ addMessage, addActivity, saveState, renderAll, showToast, logWater, logMindfulness, completeWorkout });
function processRequest(text) {
  input.value = "";
  return handleRequest(text);
}

document.addEventListener("click", async (event) => {
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
        <div class="modal-notice"><p>This clears your local timeline and restores the starter dashboard.</p></div>
        <div class="stacked-actions">
          <button class="danger-button" data-modal-action="reset-account-data">Reset local data</button>
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
    const fiber = Number(data.get("fiber") || 0);
    const food = String(data.get("description") || "meal");

    state.nutrition.calories += calories;
    state.nutrition.protein += protein;
    state.nutrition.carbs += carbs;
    state.nutrition.fats += fats;
    state.nutrition.fiber += fiber;
    addActivity({ plugin: "nutrition", title: `Logged ${food}`, detail: `Meal - ${calories} cal` });
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
    const minutes = Number(data.get("hours")) * 60;
    const quality = String(data.get("quality"));

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

    state.workout.title = title;
    state.workout.time = time;
    state.workout.duration = duration;
    addActivity({ plugin: "workout", title: `Planned ${state.workout.title.toLowerCase()}`, detail: `${state.workout.time} - ${state.workout.duration} min` });
    showToast("Workout plan updated");
    openPlugin("workout");
  }

  if (form.dataset.form === "profile") {
    state.profile.name = String(data.get("name") || state.profile.name).trim() || state.profile.name;
    state.profile.email = String(data.get("email") || "").trim();
    closeModal();
    showToast("Profile updated");
  }

  if (form.dataset.form === "personal-data") {
    const age = Number(data.get("age"));
    const heightCm = Number(data.get("heightCm"));
    const weightKg = Number(data.get("weightKg"));
    const activityLevel = String(data.get("activityLevel"));
    const tailored = getTailoredGoals({ weightKg, primaryGoal: state.profile.goals.primaryGoal, activityLevel });
    state.profile.planPersonalized = true;
    state.profile.personal = { age, heightCm, weightKg, activityLevel };
    state.profile.goals = {
      ...state.profile.goals,
      calorieGoal: tailored.calorieGoal,
      proteinGoal: tailored.proteinGoal,
      hydrationGoal: tailored.hydrationGoal,
      weeklyWorkouts: tailored.weeklyWorkouts,
    };
    closeModal();
    showToast("Personal data updated");
  }

  if (form.dataset.form === "goals") {
    state.profile.planPersonalized = true;
    state.profile.goals = {
      ...state.profile.goals,
      primaryGoal: String(data.get("primaryGoal")),
      targetWeightKg: Number(data.get("targetWeightKg")),
      calorieGoal: Number(data.get("calorieGoal")),
      proteinGoal: Number(data.get("proteinGoal")),
      hydrationGoal: Number(data.get("hydrationGoal")),
      weeklyWorkouts: Number(data.get("weeklyWorkouts")),
      monthlyBudget: Number(data.get("monthlyBudget")),
    };
    state.profile.monthlyBudget = state.profile.goals.monthlyBudget;
    state.finance.budget = state.profile.monthlyBudget;
    closeModal();
    showToast("Goals updated");
  }

  if (form.dataset.form === "account-setup") {
    applyAccountSetup(data);
    closeModal();
    shouldOpenHome = true;
    showToast("Your plan is ready");
  }

  if (form.dataset.form === "notifications") {
    state.profile.notifications = data.has("notifications");
    state.profile.weeklySummary = data.has("weeklySummary");
    closeModal();
    showToast("Notification settings saved");
  }

  if (form.dataset.form === "preferences") {
    state.profile.timezone = String(data.get("timezone") || state.profile.timezone);
    state.profile.units = String(data.get("units") || state.profile.units);
    state.profile.assistantInsights = data.has("assistantInsights");
    state.profile.compactCards = data.has("compactCards");
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

document.querySelectorAll(".suggestion-chip").forEach((button) => {
  button.addEventListener("click", () => {
    processRequest(button.textContent).catch((error) => showToast(error.message || "Unable to process assistant request"));
  });
});

document.getElementById("assistant-form").addEventListener("submit", (event) => {
  event.preventDefault();
  processRequest(input.value).catch((error) => showToast(error.message || "Unable to process assistant request"));
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
    input.placeholder = "Ask Speaklio to log or summarize...";
    showToast("Voice input is unavailable in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    processRequest(event.results[0][0].transcript).catch((error) => showToast(error.message || "Unable to process voice request"));
  };
  recognition.onerror = () => showToast("I could not hear that. Try typing your request.");
  recognition.onend = () => {
    micButton.classList.remove("listening");
    input.placeholder = "Ask Speaklio to log or summarize...";
  };
  recognition.start();
});

installStaticIcons();

renderAll();
openView(state.currentView || "home");
