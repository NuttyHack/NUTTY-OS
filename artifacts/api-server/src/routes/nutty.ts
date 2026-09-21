import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import {
  GetDashboardResponse,
  GetTodayNutritionResponse,
  GetTodayWorkoutResponse,
  GetProgressResponse,
  GetProfileResponse,
  LogWorkoutSetBody,
  LogWorkoutSetParams,
  LogWorkoutSetResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const allowDemoData = process.env.NUTTY_DEMO_DATA === "true";

function requireAuth(req: any, res: any, next: any): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  next();
}

router.use(requireAuth);

const dashboard = {
  greeting: "Good morning, Jordan.",
  dateLabel: "Tuesday, 19 September",
  readiness: {
    score: 86,
    label: "Good to train",
    note: "Sleep and recent workload are both trending in your favor.",
  },
  objective: {
    title: "Make today count",
    detail: "Complete Upper Body and finish the day within 30 g of your protein target.",
  },
  workout: {
    title: "Upper Body",
    durationMinutes: 52,
    completedExercises: 0,
    totalExercises: 5,
    status: "Ready when you are",
  },
  nutrition: {
    calories: 1180,
    calorieTarget: 2350,
    protein: 82,
    proteinTarget: 155,
  },
  steps: { current: 6840, target: 10000 },
  hydration: { current: 1.6, target: 2.5 },
  budget: { spent: 286, total: 800, currency: "R" },
  habits: [
    { id: "sleep", label: "7+ hours sleep", completed: true },
    { id: "water", label: "Drink 2.5 L water", completed: false },
    { id: "protein", label: "Hit protein target", completed: false },
    { id: "training", label: "Complete workout", completed: false },
  ],
  insight: {
    title: "Your coach noticed",
    body: "Your bench has been strongest on days after 7+ hours of sleep. I kept your top set at 62.5 kg and extended rest to 2:30.",
    source: "Based on your last 6 upper-body sessions",
  },
};

const workout = {
  id: "upper-body-2026-09-19",
  title: "Upper Body",
  focus: "Strength + hypertrophy",
  durationMinutes: 52,
  exercises: [
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      order: 1,
      targetWeight: 62.5,
      targetSets: 3,
      repRange: "6–8",
      rir: 1,
      restSeconds: 150,
      previous: "60 kg × 8, 8, 7",
      cue: "Keep the same weight for all three sets. If set one is below 6 reps, drop to 60 kg.",
      completedSets: 0,
    },
    {
      id: "chest-row",
      name: "Seated Cable Row",
      order: 2,
      targetWeight: 55,
      targetSets: 3,
      repRange: "8–10",
      rir: 2,
      restSeconds: 120,
      previous: "52.5 kg × 10, 10, 9",
      cue: "Pause for one count with your shoulder blades together.",
      completedSets: 0,
    },
    {
      id: "shoulder-press",
      name: "Dumbbell Shoulder Press",
      order: 3,
      targetWeight: 22.5,
      targetSets: 3,
      repRange: "8–10",
      rir: 2,
      restSeconds: 120,
      previous: "20 kg × 10, 9, 8",
      cue: "Stay tall and stop one rep before your lower back starts to compensate.",
      completedSets: 0,
    },
    {
      id: "lat-raise",
      name: "Cable Lateral Raise",
      order: 4,
      targetWeight: 7.5,
      targetSets: 3,
      repRange: "12–15",
      rir: 2,
      restSeconds: 75,
      previous: "7.5 kg × 14, 13, 12",
      cue: "Lead with the elbows and keep tension through the top.",
      completedSets: 0,
    },
    {
      id: "tricep-pushdown",
      name: "Rope Tricep Pushdown",
      order: 5,
      targetWeight: 30,
      targetSets: 2,
      repRange: "10–12",
      rir: 1,
      restSeconds: 75,
      previous: "30 kg × 12, 11",
      cue: "Finish with the rope outside your hips, then control the return.",
      completedSets: 0,
    },
  ],
};

const nutrition = {
  calories: 1180,
  calorieTarget: 2350,
  protein: 82,
  proteinTarget: 155,
  carbs: 132,
  fat: 38,
  meals: [
    { id: "breakfast", type: "Breakfast", name: "Protein oats with banana", calories: 460, protein: 31, status: "Logged" },
    { id: "lunch", type: "Lunch", name: "Chicken, rice & greens", calories: 620, protein: 45, status: "Logged" },
    { id: "snack", type: "Snack", name: "Greek yogurt & berries", calories: 180, protein: 6, status: "Planned" },
    { id: "dinner", type: "Dinner", name: "Beef mince tacos", calories: 590, protein: 43, status: "Planned" },
  ],
  budget: { spent: 286, total: 800, remaining: 514, currency: "R" },
};

const progress = {
  weight: 82.4,
  weightChange: -1.8,
  consistency: 84,
  streak: 12,
  strength: [
    { label: "Bench", value: 67.5, change: 5.0 },
    { label: "Squat", value: 102.5, change: 7.5 },
    { label: "Deadlift", value: 132.5, change: 10.0 },
  ],
  missions: [
    { id: "body", title: "Body composition", current: 2.6, target: 7, unit: "kg lost" },
    { id: "bench", title: "Bench press", current: 67.5, target: 80, unit: "kg" },
    { id: "consistency", title: "Consistency", current: 23, target: 30, unit: "workouts" },
  ],
};

let profile = {
  id: "demo-profile",
  name: "Jordan",
  goal: "Recomposition",
  targetWeight: 75,
  targetDate: "2026-12-20",
  trainingDays: 4,
  experience: "Intermediate",
  equipment: ["Barbell", "Dumbbells", "Cable machine"],
};

const completedSets = new Map<string, number>();

router.get("/dashboard", (_req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "No personal dashboard data yet" });
    return;
  }
  res.json(GetDashboardResponse.parse(dashboard));
});

router.get("/workouts/today", (_req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "No workout history yet" });
    return;
  }
  const currentWorkout = {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      completedSets: completedSets.get(exercise.id) ?? exercise.completedSets,
    })),
  };
  res.json(GetTodayWorkoutResponse.parse(currentWorkout));
});

router.post("/workouts/:workoutId/sets", (req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "No workout plan has been created yet" });
    return;
  }
  const params = LogWorkoutSetParams.safeParse(req.params);
  const body = LogWorkoutSetBody.safeParse(req.body);

  if (!params.success || !body.success) {
    req.log.warn({ params: params.error?.message, body: body.error?.message }, "Invalid workout set");
    res.status(400).json({ error: "Invalid workout set" });
    return;
  }

  const exercise = workout.exercises.find((item) => item.id === body.data.exerciseId);
  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }

  const nextSet = Math.min((completedSets.get(exercise.id) ?? 0) + 1, exercise.targetSets);
  completedSets.set(exercise.id, nextSet);
  const onTarget = body.data.reps >= Number(exercise.repRange.split("–")[0]);
  const result = {
    exerciseId: exercise.id,
    completedSets: nextSet,
    message: onTarget ? "Strong set. That is within today's target." : "Good effort. Keep the same load and stay controlled.",
    nextAction: nextSet >= exercise.targetSets ? "Exercise complete. Move to the next movement." : `Rest ${Math.round(exercise.restSeconds / 60)}:${String(exercise.restSeconds % 60).padStart(2, "0")}, then repeat the weight.`,
  };

  req.log.info({ workoutId: params.data.workoutId, exerciseId: exercise.id, reps: body.data.reps }, "Workout set logged");
  res.json(LogWorkoutSetResponse.parse(result));
});

router.get("/nutrition/today", (_req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "No nutrition data yet" });
    return;
  }
  res.json(GetTodayNutritionResponse.parse(nutrition));
});

router.get("/progress", (_req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "Not enough history to show progress yet" });
    return;
  }
  res.json(GetProgressResponse.parse(progress));
});

router.get("/profile", (_req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "No profile context yet" });
    return;
  }
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", (req, res): void => {
  if (!allowDemoData) {
    res.status(404).json({ error: "Profile storage is not connected yet" });
    return;
  }
  const body = UpdateProfileBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ error: body.error.message }, "Invalid profile update");
    res.status(400).json({ error: body.error.message });
    return;
  }

  profile = { ...profile, ...body.data };
  res.json(UpdateProfileResponse.parse(profile));
});

export default router;