import express from "express";
import { z } from "zod";
import { insightsExplainPostLimiter } from "../rate-limit.js";
import { envConfig } from "../env-config.js";

const router = express.Router();

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

export default router;
