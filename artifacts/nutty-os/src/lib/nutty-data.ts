// src/lib/nutty-data.ts

export type SetupState = "configured" | "not_configured" | "connected" | "needs_attention" | "demo";

export type Profile = {
  name: string;
  age: string;
  location: string;
  timezone: string;
  situation: string;
  occupation: string;
  wakeTime: string;
  sleepTime: string;
};

export type Goal = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  due: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  category?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  category: string;
  location: string;
  notes: string;
  recurrence: string;
  priority: "low" | "medium" | "high";
  commitment: "hard" | "flexible";
};

export type Routine = {
  id: string;
  name: string;
  time: string;
  category: string;
};

export type Memory = {
  id: string;
  category: string;
  value: string;
  source: string;
  createdAt: string;
  confidence: "low" | "medium" | "high";
  confirmed: boolean;
};

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  permissions: string[];
  status: SetupState;
  lastTested?: string;
};

export type EmailItem = {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  category: "requires_action" | "informational" | "financial" | "school" | "work" | "personal" | "marketing" | "urgent";
  unread: boolean;
  needsReply: boolean;
  deadline?: string;
};

export type Bill = {
  id: string;
  provider: string;
  name: string;
  amount: number;
  currency: string;
  frequency: string;
  nextPayment: string;
  category: string;
  status: "active" | "paused";
  renewalDate: string;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
};

export type SocialItem = {
  id: string;
  provider: "LinkedIn" | "Instagram" | "WhatsApp";
  type: "notification" | "message" | "mention" | "connection";
  title: string;
  detail: string;
  unread: boolean;
};

export type NotificationItem = {
  id: string;
  category: "urgent" | "action" | "reminder" | "calendar" | "fitness" | "school" | "work" | "finance" | "social" | "recommendation" | "news";
  title: string;
  detail: string;
  source: string;
  read: boolean;
  snoozed: boolean;
};

export type VoiceTurn = {
  id: string;
  timestamp?: string;
  prompt?: string;
  response?: string;
  speaker?: "you" | "nutty";
  text?: string;
  intent?: string;
};

export type NuttyData = {
  profile: Profile;
  goals: Goal[];
  tasks: Task[];
  events: CalendarEvent[];
  routines: Routine[];
  memories: Memory[];
  integrations: Integration[];
  emails: EmailItem[];
  bills: Bill[];
  expenses: Expense[];
  social: SocialItem[];
  notifications: NotificationItem[];
  voiceHistory: VoiceTurn[];
  voiceTurns?: VoiceTurn[];
  autonomy: "manual" | "assisted" | "proactive" | "automated";
  onboardingComplete: boolean;
};

export const integrationCatalog: Integration[] = [
  {
    id: "calendar",
    name: "Calendar",
    category: "Planning",
    description: "Build a day view from events, commitments, and free time.",
    permissions: ["Read events", "Read event details", "No event changes without approval"],
    status: "not_configured",
  },
  {
    id: "email",
    name: "Email",
    category: "Communication",
    description: "Find messages that need a reply, contain a deadline, or include a bill.",
    permissions: ["Read inbox metadata", "Read message content", "No sending without approval"],
    status: "not_configured",
  },
  {
    id: "health",
    name: "Health & fitness",
    category: "Wellbeing",
    description: "Use real sleep, training, and health signals when you authorize a source.",
    permissions: ["Read selected health metrics", "No medical decisions", "Disconnect any time"],
    status: "not_configured",
  },
  {
    id: "finance",
    name: "Finance",
    category: "Money",
    description: "Track user-entered or authorized transactions, bills, and subscriptions.",
    permissions: ["Read selected account data", "No transfers", "No purchases"],
    status: "not_configured",
  },
  {
    id: "travel",
    name: "Travel",
    category: "Life",
    description: "Keep trips, reservations, and travel buffers alongside your calendar.",
    permissions: ["Read itineraries", "Read reservation details", "No bookings"],
    status: "not_configured",
  },
  {
    id: "social",
    name: "Social",
    category: "Communication",
    description: "Summarize important notifications and conversations from authorized accounts.",
    permissions: ["Read selected notifications", "No posts or messages without approval"],
    status: "not_configured",
  },
  {
    id: "voice",
    name: "Voice",
    category: "Interface",
    description: "Use spoken commands with the same approval rules as text.",
    permissions: ["Microphone only while listening", "Transcript stays in your account"],
    status: "not_configured",
  },
  {
    id: "notifications",
    name: "Notifications",
    category: "Attention",
    description: "Bring reminders and NUTTY recommendations into one reviewable center.",
    permissions: ["Create in-app notifications", "No external notifications by default"],
    status: "not_configured",
  },
];

const today = () => new Date().toISOString().slice(0, 10);
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function emptyNuttyData(): NuttyData {
  return {
    profile: {
      name: "",
      age: "",
      location: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      situation: "",
      occupation: "",
      wakeTime: "",
      sleepTime: "",
    },
    goals: [],
    tasks: [],
    events: [],
    routines: [],
    memories: [],
    integrations: integrationCatalog.map((integration) => ({
      ...integration,
      permissions: [...integration.permissions],
    })),
    emails: [],
    bills: [],
    expenses: [],
    social: [],
    notifications: [],
    voiceHistory: [],
    voiceTurns: [],
    autonomy: "manual",
    onboardingComplete: false,
  };
}

export function demoNuttyData(): NuttyData {
  const base = emptyNuttyData();
  return {
    ...base,
    profile: {
      ...base.profile,
      name: "Demo operator",
      age: "24",
      location: "Johannesburg",
      situation: "both",
      occupation: "Product design student",
      wakeTime: "06:30",
      sleepTime: "22:30",
    },
    goals: [
      { id: "demo-goal-1", title: "Finish the product design portfolio", category: "Career", completed: false },
      { id: "demo-goal-2", title: "Train consistently three times this week", category: "Fitness", completed: false },
    ],
    tasks: [
      { id: "demo-task-1", title: "Reply to the project feedback", due: today(), priority: "high", completed: false },
      { id: "demo-task-2", title: "Review tomorrow's class notes", due: today(), priority: "medium", completed: false },
      { id: "demo-task-3", title: "Pack training clothes", due: today(), priority: "low", completed: true },
    ],
    events: [
      { id: "demo-event-1", title: "Deep work block", start: `${today()}T08:00`, end: `${today()}T10:00`, category: "Work", location: "Home", notes: "Portfolio case study", recurrence: "Weekly", priority: "high", commitment: "hard" },
      { id: "demo-event-2", title: "Design systems class", start: `${today()}T13:00`, end: `${today()}T14:30`, category: "School", location: "Studio 2", notes: "", recurrence: "Weekly", priority: "high", commitment: "hard" },
      { id: "demo-event-3", title: "Strength session", start: `${today()}T17:30`, end: `${today()}T18:30`, category: "Fitness", location: "Gym", notes: "Upper body", recurrence: "", priority: "medium", commitment: "flexible" },
    ],
    routines: [
      { id: "demo-routine-1", name: "Morning reset", time: "06:30", category: "Morning" },
      { id: "demo-routine-2", name: "Evening review", time: "21:30", category: "Evening" },
    ],
    memories: [
      { id: "demo-memory-1", category: "Preferences", value: "Prefers focused work before midday.", source: "Demo setup", createdAt: today(), confidence: "medium", confirmed: true },
      { id: "demo-memory-2", category: "Personal rules", value: "Ask before changing a calendar event.", source: "Demo setup", createdAt: today(), confidence: "high", confirmed: true },
    ],
    integrations: integrationCatalog.map((integration) => ({
      ...integration,
      status: ["calendar", "email", "social", "notifications"].includes(integration.id) ? "demo" : "not_configured",
      permissions: [...integration.permissions],
      lastTested: today(),
    })),
    emails: [
      { id: "demo-email-1", sender: "Amina from the studio", subject: "Feedback on your case study", preview: "Could you share the revised screens by Friday?", category: "requires_action", unread: true, needsReply: true, deadline: "Friday" },
      { id: "demo-email-2", sender: "Campus finance", subject: "Tuition statement available", preview: "Your latest statement is ready to review.", category: "financial", unread: true, needsReply: false },
      { id: "demo-email-3", sender: "Design Weekly", subject: "Five interface patterns to study", preview: "A short reading list for this week.", category: "informational", unread: false, needsReply: false },
    ],
    bills: [
      { id: "demo-bill-1", provider: "Figma", name: "Professional plan", amount: 240, currency: "R", frequency: "Monthly", nextPayment: "2026-09-25", category: "Software", status: "active", renewalDate: "2026-09-25" },
      { id: "demo-bill-2", provider: "Mobile network", name: "Data plan", amount: 399, currency: "R", frequency: "Monthly", nextPayment: "2026-09-28", category: "Utilities", status: "active", renewalDate: "2026-09-28" },
    ],
    expenses: [
      { id: "demo-expense-1", name: "Groceries", amount: 420, category: "Food", date: today() },
      { id: "demo-expense-2", name: "Transport", amount: 180, category: "Travel", date: today() },
    ],
    social: [
      { id: "demo-social-1", provider: "LinkedIn", type: "connection", title: "2 connection requests", detail: "People from your design network are waiting.", unread: true },
      { id: "demo-social-2", provider: "Instagram", type: "notification", title: "5 notifications", detail: "Your recent project post is getting attention.", unread: true },
      { id: "demo-social-3", provider: "WhatsApp", type: "message", title: "1 conversation needs attention", detail: "A project group asked for your availability.", unread: true },
    ],
    notifications: [
      { id: "demo-notification-1", category: "action", title: "Reply to project feedback", detail: "This task is due today.", source: "Tasks", read: false, snoozed: false },
      { id: "demo-notification-2", category: "calendar", title: "Class starts in 3 hours", detail: "Design systems · Studio 2", source: "Calendar", read: false, snoozed: false },
      { id: "demo-notification-3", category: "recommendation", title: "Protect a recovery window", detail: "Your flexible training block follows a full day.", source: "NUTTY context engine", read: false, snoozed: false },
    ],
    voiceHistory: [],
    voiceTurns: [],
    onboardingComplete: true,
  };
}

export function storageKey(userId: string, demo: boolean) {
  return `nutty-os:${userId}:${demo ? "demo" : "live"}`;
}

export function loadNuttyData(userId: string, demo: boolean): NuttyData {
  const key = storageKey(userId, demo);
  try {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...emptyNuttyData(),
        ...parsed,
        profile: { ...emptyNuttyData().profile, ...parsed.profile },
        integrations: integrationCatalog.map((catalogItem) => {
          const storedItem = parsed.integrations?.find((i: Integration) => i.id === catalogItem.id);
          return storedItem ? { ...catalogItem, ...storedItem } : { ...catalogItem, status: demo ? "demo" : "not_configured" };
        }),
      };
    }
  } catch {
    // Malformed local records fail gracefully without breaking execution
  }
  return demo ? demoNuttyData() : emptyNuttyData();
}

export function saveNuttyData(userId: string, demo: boolean, data: NuttyData) {
  try {
    window.localStorage.setItem(storageKey(userId, demo), JSON.stringify(data));
  } catch {
    // Catch quota limits or restricted storage environments
  }
}

export function getSetupStatus(data: NuttyData) {
  const profileDone = Boolean(data.profile.name || data.profile.situation || data.profile.occupation);
  const goalsDone = data.goals.length > 0;
  return [
    { id: "profile", name: "Profile", state: profileDone ? "configured" : "not_configured", action: profileDone ? "Review" : "Configure" },
    { id: "goals", name: "Goals", state: goalsDone ? "configured" : "not_configured", action: goalsDone ? "Review" : "Configure" },
    ...data.integrations.map((item) => ({ id: item.id, name: item.name, state: item.status, action: item.status === "not_configured" ? "Connect" : "Configure" })),
  ] as Array<{ id: string; name: string; state: SetupState; action: string }>;
}

export function getRecommendation(data: NuttyData) {
  const openTasks = data.tasks.filter((task) => !task.completed);
  const dueTask = [...openTasks].sort((a, b) => Number(b.priority === "high") - Number(a.priority === "high"))[0];
  const nextEvent = [...data.events].sort((a, b) => a.start.localeCompare(b.start))[0];

  if (dueTask) {
    return {
      title: dueTask.title,
      reason: dueTask.priority === "high" ? "Highest-priority active task." : "Clearest next action in current scope.",
      source: "Tasks",
      confidence: "High focus",
      approval: "No action required",
    };
  }

  if (nextEvent) {
    return {
      title: `Prepare for ${nextEvent.title}`,
      reason: "Next scheduled calendar event.",
      source: "Calendar",
      confidence: "High focus",
      approval: "No action required",
    };
  }

  if (data.goals.length > 0) {
    const activeGoal = data.goals.find((g) => !g.completed) || data.goals[0];
    return {
      title: `Create a task for ${activeGoal.title}`,
      reason: "Goal defined without active tasks linked to it.",
      source: "Goals",
      confidence: "Awaiting input",
      approval: "User creation needed",
    };
  }

  return {
    title: "No active context",
    reason: "Add a task, event, or goal to generate real recommendations.",
    source: "Context Engine",
    confidence: "Zero data state",
    approval: "Awaiting real data",
  };
}

export function inferIntent(input: string) {
  const text = input.toLowerCase();

  if (
    text.includes("school") ||
    text.includes("class") ||
    text.includes("work") ||
    text.includes("homework") ||
    text.includes("assignment")
  ) {
    return "CHECK_SCHOOL_WORK";
  }

  if (text.includes("social") || text.includes("feed") || text.includes("notification")) {
    return "CHECK_SOCIALS";
  }

  if (text.includes("pay") || text.includes("bill") || text.includes("subscription")) {
    return "CHECK_BILLS";
  }

  if (text.includes("email") || text.includes("gmail") || text.includes("inbox") || text.includes("reply") || text.includes("mail")) {
    return "CHECK_EMAIL";
  }

  if (text.includes("task") || text.includes("todo") || text.includes("to-do")) {
    return "CHECK_TASKS";
  }

  if (text.includes("goal")) {
    return "CHECK_GOALS";
  }

  if (text.includes("remember") || text.includes("memory") || text.includes("preference")) {
    return "CHECK_MEMORY";
  }

  if (text.includes("plan") || text.includes("organize")) {
    return "PLAN_DAY";
  }

  if (text.includes("calendar") || text.includes("today") || text.includes("schedule") || text.includes("meeting")) {
    return "CHECK_CALENDAR";
  }

  return "DAILY_BRIEFING";
}

export function respondToIntent(input: string, data: NuttyData) {
  const intent = inferIntent(input);
  const openTasks = data.tasks.filter((task) => !task.completed).length;
  const unreadEmail = data.emails.filter((email) => email.unread).length;
  const unreadSocial = data.social.filter((item) => item.unread).length;
  const pendingBills = data.bills.filter((bill) => bill.status === "active").length;
  
  const schoolWorkTasks = data.tasks.filter((task) => {
    const text = `${task.title} ${task.category || ""}`.toLowerCase();
    return !task.completed && (text.includes("school") || text.includes("work") || text.includes("class") || text.includes("assignment"));
  });

  const rec = getRecommendation(data);

  const messages: Record<string, string> = {
    CHECK_SOCIALS: unreadSocial
      ? `You have ${unreadSocial} unread social item${unreadSocial === 1 ? "" : "s"}.`
      : "No unread social updates detected.",
    CHECK_BILLS: pendingBills
      ? `You have ${pendingBills} active recurring bill${pendingBills === 1 ? "" : "s"}.`
      : "No recurring bills found in your active records.",
    CHECK_CALENDAR: data.events.length
      ? `You have ${data.events.length} event${data.events.length === 1 ? "" : "s"} on schedule.`
      : "Your calendar is empty. Add an event to begin.",
    CHECK_EMAIL: unreadEmail
      ? `You have ${unreadEmail} unread message${unreadEmail === 1 ? "" : "s"}.`
      : "No unread email context found.",
    CHECK_TASKS: openTasks
      ? `You have ${openTasks} open task${openTasks === 1 ? "" : "s"}. Focus area: ${rec.title}.`
      : "No active tasks. Add a task to build your schedule.",
    CHECK_SCHOOL_WORK: schoolWorkTasks.length
      ? `You have ${schoolWorkTasks.length} pending task${schoolWorkTasks.length === 1 ? "" : "s"} for school and work. Priority: "${schoolWorkTasks[0].title}".`
      : "You are all caught up on your school and work tasks!",
    CHECK_GOALS: data.goals.length
      ? `You have ${data.goals.length} goal${data.goals.length === 1 ? "" : "s"} recorded.`
      : "No goals recorded yet.",
    CHECK_MEMORY: data.memories.length
      ? `I have ${data.memories.length} stored memory entries under your control.`
      : "No saved memories. Ask me to remember key rules or preferences.",
    PLAN_DAY: openTasks || data.events.length
      ? `Plan drafted from ${openTasks} active task${openTasks === 1 ? "" : "s"} and ${data.events.length} scheduled event${data.events.length === 1 ? "" : "s"}.`
      : "Cannot draft a plan without context. Add tasks or calendar events first.",
    DAILY_BRIEFING: rec.title !== "No active context"
      ? `Daily briefing: Your immediate priority is "${rec.title}".`
      : "Your system is in zero-data mode. Add tasks, goals, or events to start receiving context-aware recommendations.",
  };

  return { intent, text: messages[intent] ?? messages.DAILY_BRIEFING };
}

export const makeId = id;