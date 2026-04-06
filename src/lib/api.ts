import type { PredictionResult, PredictionMode } from "@/lib/risk-engine";
import { supabase } from "@/integrations/supabase/client";
import type { AIInsights } from "@/types/ai";

// API_BASE strategy:
// - Development: Use VITE_API_URL if set, otherwise use relative paths (same origin)
// - Production (Vercel): Always use relative paths (Vercel handles /api/* routing)
const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || "")
  : "";

export function api(path: string): string {
  const normalizedBase = API_BASE.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export interface PredictionInput {
  mode?: PredictionMode;
  glucose?: number;
  glucoseSource: "cgm" | "glucometer";
  insulin?: {
    dosage: number;
    type: "rapid-acting" | "long-acting";
    hoursAgo: number;
  };
  mealHoursAgo?: number;
  activity?: {
    type: string;
    duration: number;
    hoursAgo: number;
  };
}

export interface PredictionRecord {
  id: string;
  userId: string;
  input: PredictionInput;
  result: PredictionResult;
  createdAt: string;
}

export interface InsightExplanationInput {
  glucose?: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  factors: {
    glucose_factor: number;
    insulin_factor: number;
    meal_gap_factor: number;
    activity_factor: number;
    trend_factor: number;
    time_factor: number;
  };
}

export interface AIInsightReading {
  value: number;
  timestamp: string;
}

export interface AIInsightsRequest {
  readings: AIInsightReading[];
}

export interface OnboardingProfileInput {
  full_name?: string;
  age?: number;
  gender?: string | null;
  weight?: number;
  diabetes_type?: string;
  years_since_diagnosis?: number;
  insulin_usage?: boolean;
  insulin_type?: string | null;
  insulin_dosage_range?: string | null;
  insulin_schedule?: string[];
  monitoring_mode?: string;
  cgm_brand?: string | null;
  reading_frequency?: string | null;
  meal_times?: Record<string, string>;
  skip_meals?: boolean;
  diet_type?: string | null;
  activity_level?: string | null;
  exercise_frequency?: string | null;
  sleep_start_time?: string | null;
  sleep_end_time?: string | null;
  hypo_frequency?: string | null;
  hypo_timing?: string[];
  alert_preference?: string | null;
  medical_summary?: string | null;
  prescription_summary?: string | null;
  onboarding_completed?: boolean;
}

async function getAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message || "Failed to read auth session");
  }
  return data.session?.access_token ?? null;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = api(path);
  const method = options.method || "GET";
  
  console.log(`[API] ${method} ${fullUrl} (dev=${import.meta.env.DEV}, base="${API_BASE}")`);
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error("[API] Error: No access token available");
    throw new Error("Authentication required. Please sign in again.");
  }
  headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`[API] ${method} ${fullUrl} → ${response.status}`);

    if (!response.ok) {
      let message = "Request failed";
      try {
        const payload = await response.json();
        message = payload?.error || payload?.message || message;
      } catch {
        // Keep generic message when response is not JSON.
      }
      console.error(`[API] Error: ${response.status} ${message}`);
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(`[API] Network error: ${error.message}`);
    }
    throw error;
  }
}

export async function createPrediction(
  payload: PredictionInput
): Promise<PredictionRecord> {
  const response = await apiRequest<{ data: PredictionRecord }>(
    "/api/predictions",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}

export async function getPredictionHistory(limit = 20): Promise<PredictionRecord[]> {
  const response = await apiRequest<{ data: PredictionRecord[] }>(
    `/api/predictions?limit=${limit}`,
    { method: "GET" }
  );

  return response.data;
}

export async function saveOnboardingProfile(
  payload: OnboardingProfileInput
): Promise<{ success: boolean }> {
  console.log("api.saveOnboardingProfile: called with payload", payload);
  
  const response = await apiRequest<{ data: { success: boolean } }>(
    "/api/onboarding",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  console.log("api.saveOnboardingProfile: response", response);
  return response.data;
}

export async function getInsightExplanation(
  payload: InsightExplanationInput
): Promise<string> {
  const response = await apiRequest<{ explanation: string }>(
    "/api/insights/explain",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response.explanation;
}

export async function getAIInsights(payload: AIInsightsRequest): Promise<AIInsights> {
  return apiRequest<AIInsights>("/api/insights", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAIInsights(readings: AIInsightReading[]): Promise<AIInsights> {
  return getAIInsights({ readings });
}
