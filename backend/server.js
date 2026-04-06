import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import insightsRoutes from "./routes/insights.js";
import { getTrustProxySetting, globalLimiter, predictionPostLimiter } from "./rate-limit.js";
import { buildCorsConfig } from "./cors-config.js";
import { envConfig } from "./env-config.js";

const app = express();
const PORT = envConfig.PORT;
const supabase = envConfig.SUPABASE_URL && envConfig.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(envConfig.SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (envConfig.NODE_ENV === "production" && !supabase) {
  throw new Error("Environment configuration error: Supabase must be configured in production");
}

app.set("trust proxy", getTrustProxySetting(envConfig.TRUST_PROXY));
const corsConfig = buildCorsConfig({
  nodeEnv: envConfig.NODE_ENV,
  frontendOrigin: envConfig.FRONTEND_ORIGIN,
});
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json());
app.use(globalLimiter);

const insulinSchema = z.object({
  dosage: z.number().positive().max(100),
  type: z.enum(["rapid-acting", "long-acting"]),
  hoursAgo: z.number().min(0).max(72),
});

const activitySchema = z.object({
  type: z.string().min(1).max(50),
  duration: z.number().int().min(1).max(600),
  hoursAgo: z.number().min(0).max(48).default(1),
});

const predictionInputSchema = z.object({
  mode: z.enum(["cgm", "manual", "lifestyle"]).optional(),
  glucose: z.number().min(20).max(500).optional(),
  glucoseSource: z.enum(["cgm", "glucometer"]).default("glucometer"),
  insulin: insulinSchema.optional(),
  mealHoursAgo: z.number().min(0).max(72).optional(),
  activity: activitySchema.optional(),
  readings: z
    .array(
      z.object({
        value: z.number().min(20).max(500),
        minutesAgo: z.number().min(0).max(360),
        source: z.enum(["cgm", "glucometer"]).default("cgm"),
      })
    )
    .optional(),
});

const onboardingProfileSchema = z
  .object({
    full_name: z.string().max(200).optional(),
    age: z.coerce.number().min(0).max(130).optional(),
    gender: z.string().max(20).nullable().optional(),
    weight: z.coerce.number().min(0).max(500).optional(),
    diabetes_type: z.string().max(50).optional(),
    years_since_diagnosis: z.coerce.number().min(0).max(120).optional(),
    insulin_usage: z.boolean().optional(),
    insulin_type: z.string().max(50).nullable().optional(),
    insulin_dosage_range: z.string().max(100).nullable().optional(),
    insulin_schedule: z.array(z.string().max(30)).optional(),
    monitoring_mode: z.string().max(50).optional(),
    cgm_brand: z.string().max(100).nullable().optional(),
    reading_frequency: z.string().max(30).nullable().optional(),
    meal_times: z.record(z.string()).optional(),
    skip_meals: z.boolean().optional(),
    diet_type: z.string().max(30).nullable().optional(),
    activity_level: z.string().max(30).nullable().optional(),
    exercise_frequency: z.string().max(50).nullable().optional(),
    sleep_start_time: z.string().max(10).nullable().optional(),
    sleep_end_time: z.string().max(10).nullable().optional(),
    hypo_frequency: z.string().max(30).nullable().optional(),
    hypo_timing: z.array(z.string().max(30)).optional(),
    alert_preference: z.string().max(100).nullable().optional(),
    medical_summary: z.string().max(5000).nullable().optional(),
    prescription_summary: z.string().max(5000).nullable().optional(),
    onboarding_completed: z.boolean().optional(),
  })
  .passthrough();

function getBearerToken(req) {
  const authorization = req.header("authorization")?.trim();
  if (!authorization) {
    const error = new Error("Missing Authorization header");
    error.status = 401;
    throw error;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    const error = new Error("Invalid Authorization header format");
    error.status = 401;
    throw error;
  }

  return token;
}

async function requireAuth(req, _res, next) {
  try {
    if (!supabase) {
      const error = new Error("Supabase service role is not configured on backend");
      error.status = 503;
      throw error;
    }

    const token = getBearerToken(req);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user?.id) {
      const authError = new Error("Invalid or expired access token");
      authError.status = 401;
      throw authError;
    }

    req.user = { id: data.user.id };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function readPredictionRows(userId) {
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map((record) => ({
    id: record.id,
    userId: record.user_id,
    input: record.input,
    result: record.result,
    createdAt: record.created_at,
  }));
}

async function insertPredictionRow(record) {
  const { error } = await supabase.from("predictions").insert({
    id: record.id,
    user_id: record.userId,
    input: record.input,
    result: record.result,
    created_at: record.createdAt,
  });

  if (error) {
    throw error;
  }
}

function calculateGlucoseFactor(glucose) {
  if (!glucose) return 1;
  if (glucose < 70) return 4;
  if (glucose < 80) return 3;
  if (glucose < 90) return 2;
  if (glucose < 100) return 1;
  return 0;
}

function calculateInsulinFactor(insulin) {
  if (!insulin) return 0;
  const hoursSince = insulin.hoursAgo;
  if (insulin.type === "rapid-acting") {
    if (hoursSince < 1) return Math.min(insulin.dosage * 0.5, 4);
    if (hoursSince < 3) return Math.min(insulin.dosage * 0.3, 3);
    return 0;
  }
  return Math.min(insulin.dosage * 0.1, 2);
}

function calculateMealGapFactor(mealHoursAgo) {
  if (mealHoursAgo === undefined) return 3;
  if (mealHoursAgo > 5) return 4;
  if (mealHoursAgo > 4) return 3;
  if (mealHoursAgo > 3) return 2;
  if (mealHoursAgo > 2) return 1;
  return 0;
}

function calculateActivityFactor(activity) {
  if (!activity) return 0;
  const hoursSince = activity.hoursAgo;
  if (hoursSince > 3) return 0;
  const intensityMap = {
    walking: 1,
    yoga: 1,
    cycling: 2,
    running: 3,
    gym: 3,
    sports: 3,
  };
  const base = intensityMap[activity.type.toLowerCase()] || 1;
  const durationFactor = Math.min(activity.duration / 30, 2);
  return Math.min(base * durationFactor, 4);
}

function calculateTrendFactor(readings = []) {
  if (readings.length < 2) return 1;
  const sorted = [...readings].sort((a, b) => b.minutesAgo - a.minutesAgo);
  const recent = sorted.slice(-3);
  const trend = recent[recent.length - 1].value - recent[0].value;
  if (trend < -30) return 4;
  if (trend < -15) return 2;
  if (trend < 0) return 1;
  return 0;
}

function calculateTimeFactor() {
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 5) return 3;
  if (hour >= 14 && hour <= 16) return 2;
  return 0;
}

function getRiskLevel(score) {
  if (score >= 9) return "HIGH";
  if (score >= 5) return "MEDIUM";
  return "LOW";
}

function getConfidence(mode) {
  const ranges = {
    cgm: [80, 95],
    manual: [50, 75],
    lifestyle: [30, 50],
  };
  const [min, max] = ranges[mode];
  return Math.round(min + Math.random() * (max - min));
}

function generateExplanation(level, factors) {
  const parts = [];
  if (factors.glucose_factor >= 3) parts.push("Current glucose is low");
  if (factors.insulin_factor >= 2) parts.push("Recent insulin may cause further drop");
  if (factors.meal_gap_factor >= 3) parts.push("Extended gap since last meal");
  if (factors.activity_factor >= 2) parts.push("Recent physical activity increases glucose consumption");
  if (factors.trend_factor >= 2) parts.push("Glucose trend is declining");
  if (factors.time_factor >= 2) parts.push("Current time is a common risk window");
  if (parts.length === 0) return "All factors are within safe ranges.";
  return `${level} risk detected. ${parts.join(". ")}.`;
}

function generateActions(level, factors) {
  const actions = [];
  if (level === "HIGH") {
    actions.push("Consume 15-20g fast-acting carbs immediately");
    actions.push("Recheck glucose in 15 minutes");
    actions.push("Contact your healthcare provider if symptoms persist");
  } else if (level === "MEDIUM") {
    actions.push("Have a small snack with 10-15g carbs");
    actions.push("Monitor glucose closely for the next hour");
  }
  if (factors.meal_gap_factor >= 3) actions.push("Consider having a balanced meal soon");
  if (factors.activity_factor >= 2) actions.push("Reduce physical activity intensity");
  if (actions.length === 0) actions.push("Continue monitoring as usual");
  return actions;
}

function createPrediction(input) {
  const mode = input.mode || (input.glucoseSource === "cgm" ? "cgm" : input.glucose ? "manual" : "lifestyle");

  const factors = {
    glucose_factor: calculateGlucoseFactor(input.glucose),
    insulin_factor: calculateInsulinFactor(input.insulin),
    meal_gap_factor: calculateMealGapFactor(input.mealHoursAgo),
    activity_factor: calculateActivityFactor(input.activity),
    trend_factor: calculateTrendFactor(input.readings),
    time_factor: calculateTimeFactor(),
  };

  const riskScore = Object.values(factors).reduce((sum, value) => sum + value, 0);
  const riskLevel = getRiskLevel(riskScore);
  const confidence = getConfidence(mode);

  const baseGlucose = input.glucose || 110;
  const predictions = [30, 60, 90].map((minutes) => ({
    minutes,
    risk: Math.min(riskScore + Math.floor(minutes / 30), 15),
    glucose: Math.max(40, baseGlucose - (riskScore * minutes) / 20 + (Math.random() - 0.5) * 10),
  }));

  const explanation = generateExplanation(riskLevel, factors);
  const actions = generateActions(riskLevel, factors);

  return { riskLevel, riskScore, confidence, factors, predictions, explanation, actions };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    now: new Date().toISOString(),
    supabaseEnabled: Boolean(supabase),
  });
});

app.use("/api/predictions", requireAuth);
app.use("/api/onboarding", requireAuth);
app.use("/api/insights", requireAuth);

app.get("/api/predictions", async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rawLimit = Number(req.query.limit || 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;

    const records = await readPredictionRows(userId);
    const filtered = records
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json({ data: filtered });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/predictions", predictionPostLimiter, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = predictionInputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid prediction payload",
        details: parsed.error.flatten(),
      });
    }

    const result = createPrediction(parsed.data);
    const record = {
      id: randomUUID(),
      userId,
      input: parsed.data,
      result,
      createdAt: new Date().toISOString(),
    };

    await insertPredictionRow(record);

    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/onboarding", async (req, res, next) => {
  try {
    const userId = req.user.id;

    const parsed = onboardingProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid onboarding payload",
        details: parsed.error.flatten(),
      });
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, ...parsed.data }, { onConflict: "id" });

    if (error) {
      error.status = error.status || 500;
      throw error;
    }

    return res.status(200).json({ data: { success: true } });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/insights", insightsRoutes);

app.use((err, req, res, next) => {
  console.error("API Error:", err);

  const status = err.status || 500;
  const message = status >= 500 ? "Internal server error" : err.message || "Internal server error";

  res.status(status).json({
    error: message,
  });
});

if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`HypoShield backend API running at http://localhost:${PORT}`);
  });
}

export default app;
