import { state } from "./state.mjs";
import { pluginMap, pluginUiConfig } from "./catalog.mjs";
import { formatMoney, formatMinutes, percentOf } from "./format.mjs";

export function createAssistant({ addMessage, addActivity, saveState, renderAll, showToast, logWater, logMindfulness, completeWorkout }) {
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

function inferMealType(text) {
  if (/breakfast/.test(text)) return "Breakfast";
  if (/lunch/.test(text)) return "Lunch";
  if (/dinner/.test(text)) return "Dinner";
  if (/snack/.test(text)) return "Snack";
  return "Meal";
}

function parseMacro(text, macro) {
  const pattern = new RegExp(`(?:${macro}\\s*(\\d+(?:\\.\\d+)?)\\s*g?)|(?:(\\d+(?:\\.\\d+)?)\\s*g?\\s*(?:of\\s*)?${macro})`, "i");
  const match = text.match(pattern);
  return match ? Number(match[1] || match[2]) : null;
}

function workoutPlanFromText(text) {
  const durationMatch = text.match(/(\d+)\s*(?:minute|min)\b/i);
  const timeMatch = text.match(/\b(?:today|tomorrow|tonight)\b(?:\s+(?:at|around))?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b(?:today|tomorrow|tonight)\b/i);
  const title = text
    .replace(/^(please\s+)?(plan|schedule|add)\s+(a\s+)?/i, "")
    .replace(/\b(?:today|tomorrow|tonight)\b.*$/i, "")
    .replace(/\b(?:at|around)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i, "")
    .replace(/\b\d+\s*(?:minute|min)\b/i, "")
    .replace(/\b(workout|exercise|training)\b/gi, "workout")
    .trim();

  return {
    title: title || "Workout",
    plannedTime: timeMatch ? timeMatch[0].trim() : "",
    duration: durationMatch ? Number(durationMatch[1]) : 0,
  };
}

function currentBalanceMetrics() {
  const metrics = [
    { label: "calories", percent: percentOf(state.nutrition.calories, state.nutrition.goal) },
    { label: "sleep", percent: percentOf(state.sleep.minutes, 420) },
    { label: "workouts", percent: percentOf(state.workout.completed, state.workout.goal) },
  ];
  if (state.installedPlugins.has("hydration")) {
    metrics.push({ label: "hydration", percent: percentOf(state.hydration.ml, state.hydration.goal) });
  }
  return metrics;
}

function dashboardQuestionAnswer(lower) {
  const asksQuestion = /\b(how|what|where|when|why|summary|total|today|left|remaining|balance|status|progress|on track|advice|tip|suggest|recommend|help me)\b/.test(lower);
  const looksLikeLog = /^(log|add|track|save|record)\b|^i\s+(ate|drank|spent|paid|bought|slept)\b|^(plan|schedule|complete|finished|did)\b/.test(lower);
  if (!asksQuestion || looksLikeLog) return null;

  if (/(calories|nutrition|macros?|protein|carbs?|fats?|fiber)/.test(lower)) {
    const proteinLeft = Math.max(0, state.profile.goals.proteinGoal - state.nutrition.protein);
    return `Today you have logged ${state.nutrition.calories.toLocaleString()} of ${state.nutrition.goal.toLocaleString()} calories, plus ${state.nutrition.protein}g protein, ${state.nutrition.carbs}g carbs, ${state.nutrition.fats}g fats, and ${state.nutrition.fiber}g fiber. ${proteinLeft ? `${proteinLeft}g protein left for your goal.` : "You have hit your protein goal."}`;
  }

  if (/(budget|spending|spent|money|finance|left|remaining)/.test(lower)) {
    const left = state.finance.budget - state.finance.spending;
    return `You have spent $${formatMoney(state.finance.spending)} of your $${formatMoney(state.finance.budget)} monthly budget. ${left >= 0 ? `$${formatMoney(left)} remains.` : `You are $${formatMoney(Math.abs(left))} over budget.`}`;
  }

  if (/(water|hydrate|hydration)/.test(lower)) {
    return `You are at ${(state.hydration.ml / 1000).toFixed(1)} L of your ${(state.hydration.goal / 1000).toFixed(1)} L water goal today.`;
  }

  if (/(sleep|slept|rest)/.test(lower)) {
    return `Your latest sleep log is ${formatMinutes(state.sleep.minutes)} with ${String(state.sleep.quality).toLowerCase()} quality.`;
  }

  if (/(workout|exercise|training)/.test(lower)) {
    return `You have completed ${state.workout.completed} of ${state.workout.goal} workouts this week. ${state.workout.title !== "No workout planned" ? `Next up: ${state.workout.title}${state.workout.time ? ` at ${state.workout.time}` : ""}.` : "No workout is scheduled yet."}`;
  }

  if (/(balance|goals?|on track|progress|status)/.test(lower)) {
    const insightBalance = state.dashboardInsights?.balance;
    const metrics = currentBalanceMetrics();
    const onTrack = insightBalance?.onTrack ?? metrics.filter((metric) => metric.percent >= 70).length;
    const total = insightBalance?.total ?? metrics.length;
    const score = insightBalance?.score ?? Math.round(metrics.reduce((sum, metric) => sum + metric.percent, 0) / Math.max(1, metrics.length));
    return `Your daily balance is ${score}. ${onTrack} of ${total} goals are on track right now.`;
  }

  if (/(advice|tip|suggest|recommend|what should i do|help me|what should i eat)/.test(lower)) {
    const proteinLeft = Math.max(0, state.profile.goals.proteinGoal - state.nutrition.protein);
    const caloriesLeft = Math.max(0, state.nutrition.goal - state.nutrition.calories);
    const waterLeftMl = Math.max(0, state.hydration.goal - state.hydration.ml);
    if (/eat|meal|food|nutrition|protein/.test(lower)) {
      return proteinLeft
        ? `A good next meal would prioritize protein: aim for roughly ${Math.min(40, proteinLeft)}g protein while staying within about ${caloriesLeft.toLocaleString()} calories left today.`
        : `You are covered on protein today, so a lighter meal with vegetables, carbs as needed, and some fiber would fit well.`;
    }
    if (waterLeftMl > 0) return `A useful next move is water: ${Math.round(waterLeftMl)} ml left toward today's hydration goal.`;
    if (state.workout.completed < state.workout.goal) return `A short workout would help your week: even 20 to 30 minutes counts toward your ${state.workout.goal}-workout goal.`;
    return "You are in decent shape today. Keep logging meals or expenses as they happen so the dashboard stays accurate.";
  }

  return null;
}

async function processRequest(rawText) {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  if (!text) return;
  addMessage(text, "user");


  const dashboardAnswer = dashboardQuestionAnswer(lower);
  if (dashboardAnswer) {
    addMessage(dashboardAnswer, "assistant");
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
      const plan = workoutPlanFromText(text);
      if (!plan.duration || !plan.plannedTime) {
        addMessage("Tell me the workout duration and when to schedule it, or use the Workout form.", "assistant");
        return;
      }
      state.workout = { ...state.workout, title: plan.title, time: plan.plannedTime, duration: plan.duration };
      addActivity({ plugin: "workout", title: `Planned ${plan.title}`, detail: `${plan.plannedTime} - ${plan.duration} min` });
      saveState();
      renderAll();
      addMessage(`I planned ${plan.title} for ${plan.plannedTime} as a ${plan.duration}-minute workout. It is now on your dashboard.`, "assistant");
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
      if (!calorieMatch) {
        addMessage("Tell me the calories for that meal, or use the Nutrition form to log full macros.", "assistant");
        return;
      }
      const calories = Number(calorieMatch[1]);
      const protein = parseMacro(text, "protein");
      const carbs = parseMacro(text, "carbs?");
      const fats = parseMacro(text, "fats?");
      const fiber = parseMacro(text, "fiber");
      const metadata = {
        food: text,
        meal: inferMealType(lower),
        calories,
        estimated: false,
        ...(protein !== null ? { protein } : {}),
        ...(carbs !== null ? { carbs } : {}),
        ...(fats !== null ? { fats } : {}),
        ...(fiber !== null ? { fiber } : {}),
      };
      state.nutrition.calories += calories;
      state.nutrition.protein += protein || 0;
      state.nutrition.carbs += carbs || 0;
      state.nutrition.fats += fats || 0;
      state.nutrition.fiber += fiber || 0;
      addActivity({ plugin: "nutrition", title: `Logged ${metadata.meal.toLowerCase()}`, detail: `${metadata.meal} - ${calories} cal` });
      saveState();
      renderAll();
      addMessage(`Logged that meal at ${calories} calories. Your daily total is now ${state.nutrition.calories.toLocaleString()} calories.`, "assistant");
      showToast("Meal added to Nutrition");
      return;
    }

    if (/(help|what can you do)/.test(lower)) {
      addMessage("I can log meals, expenses, sleep, workouts, water, and mindful moments. I can also summarize your calories, spending, and sleep.", "assistant");
      return;
    }

  addMessage("I can help with meals, expenses, sleep, workouts, water, and mindful moments. Ask for a summary or tell me what to log.", "assistant");
}


return processRequest;
}
