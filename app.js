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

document.querySelectorAll("[data-icon]").forEach((element) => {
  const name = element.dataset.icon;
  element.innerHTML = `<svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
});

const state = {
  calories: 1420,
  spending: 1264,
  budget: 2000,
  activityFilter: "all",
  installedPlugins: new Set(["nutrition", "finance", "sleep", "workout"]),
  activities: [
    { plugin: "nutrition", title: "Logged avocado toast and coffee", detail: "Breakfast - 420 cal", time: "8:15 AM", day: "Today" },
    { plugin: "sleep", title: "Sleep summary added", detail: "7h 42m - Good quality", time: "7:45 AM", day: "Today" },
    { plugin: "finance", title: "Added grocery expense", detail: "Groceries - $68.42", time: "Yesterday", day: "Yesterday" },
    { plugin: "workout", title: "Completed evening walk", detail: "32 minutes - 2.3 km", time: "Yesterday", day: "Yesterday" },
    { plugin: "nutrition", title: "Logged chicken rice bowl", detail: "Dinner - 610 cal", time: "Yesterday", day: "Yesterday" },
  ],
};

const plugins = [
  { id: "nutrition", name: "Nutrition", icon: "apple", description: "Track meals, calories, and daily macros." },
  { id: "finance", name: "Finance", icon: "wallet", description: "Log expenses and keep an eye on your budget." },
  { id: "sleep", name: "Sleep", icon: "moon", description: "Understand your rest and sleep patterns." },
  { id: "workout", name: "Workout", icon: "bolt", description: "Plan sessions and follow your weekly progress." },
  { id: "hydration", name: "Hydration", icon: "droplet", description: "Stay consistent with your daily water goal." },
  { id: "mindfulness", name: "Mindfulness", icon: "heart", description: "Make space for calm moments in your day." },
];

const pluginLabels = {
  nutrition: "Nutrition",
  finance: "Finance",
  sleep: "Sleep",
  workout: "Workout",
  hydration: "Hydration",
  mindfulness: "Mindfulness",
};

const pluginIcons = {
  nutrition: "apple",
  finance: "wallet",
  sleep: "moon",
  workout: "bolt",
  hydration: "droplet",
  mindfulness: "heart",
};

const views = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll(".nav-item");
const assistantPanel = document.getElementById("assistant-panel");
const overlay = document.getElementById("overlay");
const input = document.getElementById("assistant-input");
const chatStream = document.getElementById("chat-stream");
const micButton = document.getElementById("mic-button");
const toast = document.getElementById("toast");

function iconMarkup(name) {
  return `<span class="icon" data-generated-icon="${name}"><svg viewBox="0 0 20 20" aria-hidden="true">${iconPaths[name] || ""}</svg></span>`;
}

function openView(viewName) {
  views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

document.querySelectorAll("[data-view-trigger]").forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.viewTrigger));
});

function showAssistant() {
  assistantPanel.classList.add("open");
  overlay.classList.add("show");
  setTimeout(() => input.focus(), 220);
}

function hideAssistant() {
  assistantPanel.classList.remove("open");
  overlay.classList.remove("show");
}

document.getElementById("open-assistant").addEventListener("click", showAssistant);
document.getElementById("close-assistant").addEventListener("click", hideAssistant);
overlay.addEventListener("click", hideAssistant);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function activityMarkup(item) {
  return `
    <article class="activity-item">
      <span class="plugin-icon ${item.plugin}">${iconMarkup(pluginIcons[item.plugin])}</span>
      <div class="activity-item-copy">
        <strong>${item.title}</strong>
        <span>${item.detail}</span>
      </div>
      <span class="activity-time">${item.time}</span>
    </article>
  `;
}

function renderActivity() {
  document.getElementById("home-activity-list").innerHTML = state.activities
    .slice(0, 3)
    .map(activityMarkup)
    .join("");

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
        <p class="timeline-date">${day.toUpperCase()}</p>
        ${items.map(activityMarkup).join("")}
      </section>
    `)
    .join("") || '<p class="heading-copy">No activity for this plugin yet.</p>';
}

function renderPlugins() {
  document.getElementById("plugin-store-grid").innerHTML = plugins.map((plugin) => {
    const installed = state.installedPlugins.has(plugin.id);
    return `
      <article class="store-card">
        <div class="store-card-top">
          <span class="plugin-icon ${plugin.id}">${iconMarkup(plugin.icon)}</span>
          <h3>${plugin.name}</h3>
        </div>
        <p>${plugin.description}</p>
        <button class="install-button ${installed ? "installed" : ""}" data-plugin-toggle="${plugin.id}">
          ${installed ? "Installed" : "Add plugin"}
        </button>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-plugin-toggle]").forEach((button) => {
    button.addEventListener("click", () => togglePlugin(button.dataset.pluginToggle));
  });
}

function togglePlugin(pluginId) {
  const pluginName = pluginLabels[pluginId];
  if (state.installedPlugins.has(pluginId)) {
    state.installedPlugins.delete(pluginId);
    showToast(`${pluginName} removed from your dashboard`);
  } else {
    state.installedPlugins.add(pluginId);
    showToast(`${pluginName} added to your dashboard`);
  }
  const homeCard = document.querySelector(`[data-plugin-card="${pluginId}"]`);
  if (homeCard) homeCard.hidden = !state.installedPlugins.has(pluginId);
  renderPlugins();
}

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    state.activityFilter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderActivity();
  });
});

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chat-bubble ${sender}`;
  message.innerHTML = sender === "assistant"
    ? `<div class="bot-mark">${iconMarkup("sparkles")}</div><p>${text}</p>`
    : `<p>${text}</p>`;
  chatStream.appendChild(message);
  chatStream.scrollTop = chatStream.scrollHeight;
}

function addActivity(activity) {
  state.activities.unshift({ ...activity, day: "Today", time: "Just now" });
  renderActivity();
}

function updateFinance() {
  document.getElementById("spending-count").textContent = `$${state.spending.toLocaleString()}`;
  document.getElementById("budget-left").textContent = `$${(state.budget - state.spending).toLocaleString()} left`;
  document.getElementById("finance-progress").style.width = `${Math.round((state.spending / state.budget) * 100)}%`;
}

function updateNutrition() {
  const percent = Math.round((state.calories / 2100) * 100);
  document.getElementById("calorie-count").textContent = state.calories.toLocaleString();
  document.getElementById("nutrition-percent").textContent = `${percent}%`;
  document.getElementById("nutrition-ring").style.strokeDasharray = `${percent} 100`;
}

function processRequest(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  setTimeout(() => {
    if (/(spent|expense|paid|lunch)/.test(lower) && lower.includes("$")) {
      const parsedAmount = Number((lower.match(/\$(\d+(?:\.\d{1,2})?)/) || [0, 25])[1]);
      state.spending += parsedAmount;
      updateFinance();
      addActivity({ plugin: "finance", title: "Added lunch expense", detail: `Dining - $${parsedAmount.toFixed(2)}` });
      addMessage(`Done. I added $${parsedAmount.toFixed(2)} to dining. You have $${(state.budget - state.spending).toLocaleString()} left in this month's budget.`, "assistant");
      showToast("Expense added to Finance");
      return;
    }

    if (/(eggs|toast|breakfast|ate|meal)/.test(lower)) {
      state.calories += 320;
      updateNutrition();
      addActivity({ plugin: "nutrition", title: "Logged eggs and toast", detail: "Breakfast - 320 cal" });
      addMessage("Logged: eggs and toast for breakfast, estimated at 320 calories. Your daily total is now " + state.calories.toLocaleString() + " calories.", "assistant");
      showToast("Breakfast added to Nutrition");
      return;
    }

    if (/(sleep|slept|last night)/.test(lower)) {
      addMessage("You slept for 7 hours and 42 minutes last night. Your sleep quality was good, with a consistent bedtime and only one short wake-up.", "assistant");
      return;
    }

    if (/(workout|exercise|training|tomorrow)/.test(lower)) {
      document.getElementById("workout-title").textContent = "Full body mobility";
      document.getElementById("workout-time").textContent = "Tomorrow, 7:30 AM - 35 min";
      addActivity({ plugin: "workout", title: "Planned full body mobility", detail: "Tomorrow, 7:30 AM - 35 min" });
      addMessage("I planned a 35-minute full body mobility workout for tomorrow at 7:30 AM. It is now on your dashboard.", "assistant");
      showToast("Workout added to your plan");
      return;
    }

    addMessage("I can help with that. For this mockup, try logging a meal, adding an expense, checking your sleep, or planning a workout.", "assistant");
  }, 450);
}

document.getElementById("assistant-form").addEventListener("submit", (event) => {
  event.preventDefault();
  processRequest(input.value);
});

document.querySelectorAll(".suggestion-chip").forEach((button) => {
  button.addEventListener("click", () => processRequest(button.textContent));
});

micButton.addEventListener("click", () => {
  if (micButton.classList.contains("listening")) return;
  micButton.classList.add("listening");
  input.value = "Listening...";
  setTimeout(() => {
    micButton.classList.remove("listening");
    input.value = "";
    processRequest("I had eggs and toast for breakfast");
  }, 1300);
});

renderActivity();
renderPlugins();
