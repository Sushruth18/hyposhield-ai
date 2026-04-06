import express from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { insightsExplainPostLimiter } from "../rate-limit.js";
import { envConfig } from "../env-config.js";
import { detectHypoglycemiaRisk } from "../analysis.js";

const router = express.Router();

const supabase = envConfig.SUPABASE_URL && envConfig.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(envConfig.SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// Groq API client helper
async function generateExplanationFromGroq(input) {
  const GROQ_API_KEY = envConfig.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    const error = new Error("GROQ_API_KEY is not configured on the backend");
    error.status = 503;
    throw error;
  }

  try {
    const prompt = `You are an AI health assistant helping diabetic patients understand hypoglycemia risk.

  Based on the following prediction factors, explain the situation clearly and safely.

  Prediction Data:

  * Current glucose level: ${input.glucose ?? "not provided"}
  * Glucose trend: ${input.factors?.trend_factor ?? 0}
  * Activity factor: ${input.factors?.activity_factor ?? 0}
  * Time since last meal: ${input.factors?.meal_gap_factor ?? 0}
  * Risk level: ${input.riskLevel}
  * Risk score: ${input.riskScore}
  * Model confidence: ${input.confidence}

  Instructions for the explanation:

  1. Briefly explain what the current glucose situation means.
  2. Identify the likely contributing factors.
  3. Provide one short practical suggestion for the patient.

  Keep the explanation:

  * under 120 words
  * clear and easy to understand
  * medically cautious (do not give medical diagnoses)

  Return only the explanation text.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical assistant explaining hypoglycemia risk to a diabetic patient in clear, concise language.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 180,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const providerMessage = errorPayload?.error?.message;
      const error = new Error(
        `Groq API request failed (${response.status})${
          providerMessage ? `: ${providerMessage}` : ""
        }`
      );
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const explanation = data?.choices?.[0]?.message?.content?.trim();
    if (!explanation) {
      const error = new Error("Groq API returned an empty explanation");
      error.status = 502;
      throw error;
    }

    return explanation;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    const wrappedError = new Error("Failed to call Groq API");
    wrappedError.status = 502;
    throw wrappedError;
  }
}

function normalizeRiskLevel(value) {
  const level = String(value || "").toLowerCase();
  if (level === "high") return "high";
  if (level === "moderate") return "moderate";
  return "low";
}

function parseGroqJson(content) {
  if (!content) {
    throw new Error("Groq API returned an empty response");
  }

  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }

    throw new Error("Groq API did not return valid JSON");
  }
}

const insightsRequestSchema = z.object({
  readings: z.array(
    z.object({
      value: z.number(),
      timestamp: z.string(),
    })
  ).min(1),
});

const insightSchema = z.object({
  glucose: z.number().optional(),
  riskScore: z.number().min(0).max(15),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(100),
  factors: z
    .object({
      glucose_factor: z.number().default(0),
      insulin_factor: z.number().default(0),
      meal_gap_factor: z.number().default(0),
      activity_factor: z.number().default(0),
      trend_factor: z.number().default(0),
      time_factor: z.number().default(0),
    })
    .strict()
    .optional(),
});

router.post("/explain", insightsExplainPostLimiter, async (req, res, next) => {
  try {
    const parsed = insightSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid insight request",
        details: parsed.error.flatten(),
      });
    }

    const input = parsed.data;

    const explanation = await generateExplanationFromGroq(input);

    return res.status(200).json({ explanation });
  } catch (error) {
    const status = error?.status || 502;
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate explanation from Groq";

    return res.status(status).json({
      error: message,
    });
  }
});

router.post("/", insightsExplainPostLimiter, async (req, res, next) => {
  try {
    if (!supabase) {
      const error = new Error("Supabase service role is not configured on backend");
      error.status = 503;
      throw error;
    }

    if (!req.user?.id) {
      const error = new Error("Authenticated user context is missing");
      error.status = 401;
      throw error;
    }

    const parsed = insightsRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid insights request",
        details: parsed.error.flatten(),
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("age, weight")
      .eq("id", req.user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    const readings = parsed.data.readings;
    const signals = detectHypoglycemiaRisk(readings);
    const latestReading = readings[readings.length - 1];
    const profileAge = profile?.age ?? "unknown";
    const profileWeight = profile?.weight ?? "unknown";

    const prompt = `Glucose trend summary: ${signals.trendSummary}
User profile: age=${profileAge}, weight=${profileWeight}
Risk signals: ${JSON.stringify(signals)}
Latest readings: ${JSON.stringify(readings.slice(-12))}

Return only valid JSON with this exact shape:
{
  "insights": "string",
  "recommendations": "string",
  "riskLevel": "low | moderate | high"
}`;

    const GROQ_API_KEY = envConfig.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      const error = new Error("GROQ_API_KEY is not configured on the backend");
      error.status = 503;
      throw error;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a medical AI that analyzes glucose trends and predicts hypoglycemia risk.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      const providerMessage = errorPayload?.error?.message;
      const error = new Error(
        `Groq API request failed (${response.status})${providerMessage ? `: ${providerMessage}` : ""}`
      );
      error.status = 502;
      throw error;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    const parsedContent = parseGroqJson(content);

    return res.status(200).json({
      insights: typeof parsedContent.insights === "string" ? parsedContent.insights : "Reviewed recent glucose data for hypoglycemia risk.",
      recommendations: typeof parsedContent.recommendations === "string" ? parsedContent.recommendations : "Continue monitoring glucose and follow your care plan.",
      riskLevel: normalizeRiskLevel(parsedContent.riskLevel || signals.riskLevel || (latestReading?.value < 70 ? "moderate" : "low")),
    });
  } catch (error) {
    const status = error?.status || 502;
    const message = error instanceof Error ? error.message : "Failed to generate AI insights";

    return res.status(status).json({ error: message });
  }
});

export default router;
