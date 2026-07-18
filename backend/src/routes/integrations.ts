import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const integrationsRouter = Router();

const integrations = [
  {
    id: "apple-health",
    name: "Apple Health",
    icon: "watch",
    color: "workout",
    status: "coming-soon",
    statusLabel: "Coming soon",
    available: false,
    connected: false,
    panelCopy: "Steps, workouts, heart rate, sleep, and mindful minutes.",
    detailCopy: "Apple Health sync needs a native app or HealthKit bridge before these permissions can be requested.",
    permissions: {
      read: "Steps, workouts, heart rate, sleep, active energy, mindful minutes.",
      write: "Nutrition summaries, water, workouts, and mindful moments when enabled.",
    },
  },
  {
    id: "apple-watch",
    name: "Apple Watch",
    icon: "link",
    color: "hydration",
    status: "coming-soon",
    statusLabel: "Coming soon",
    available: false,
    connected: false,
    panelCopy: "Activity rings and workout recovery through Apple Health.",
    detailCopy: "Apple Watch data will flow through Apple Health once native HealthKit sync exists.",
    permissions: {
      read: "Activity rings, workouts, heart rate, sleep, recovery signals.",
      write: "No direct Watch writes planned for this prototype.",
    },
  },
];

integrationsRouter.get("/", requireAuth, (_request, response) => {
  response.json({ integrations });
});
