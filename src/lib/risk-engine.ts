export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PredictionMode = 'cgm' | 'manual' | 'lifestyle';

export interface GlucoseReading {
  value: number;
  timestamp: Date;
  source: 'cgm' | 'glucometer';
}

export interface InsulinLog {
  dosage: number;
  type: 'rapid-acting' | 'long-acting';
  timestamp: Date;
}

export interface MealLog {
  name: string;
  calories: number;
  carbs: number;
  timestamp: Date;
  quantity: number;
}

export interface ActivityLog {
  type: string;
  duration: number;
  timestamp: Date;
}

export interface RiskFactors {
  glucose_factor: number;
  insulin_factor: number;
  meal_gap_factor: number;
  activity_factor: number;
  trend_factor: number;
  time_factor: number;
}

export interface PredictionResult {
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  factors: RiskFactors;
  predictions: { minutes: number; risk: number; glucose?: number }[];
  explanation: string;
  actions: string[];
}

export function calculateGlucoseFactor(glucose?: number): number {
  if (!glucose) return 1;
  if (glucose < 70) return 4;
  if (glucose < 80) return 3;
  if (glucose < 90) return 2;
  if (glucose < 100) return 1;
  return 0;
}

export function calculateInsulinFactor(insulin?: InsulinLog): number {
  if (!insulin) return 0;
  const hoursSince = (Date.now() - insulin.timestamp.getTime()) / 3600000;
  if (insulin.type === 'rapid-acting') {
    if (hoursSince < 1) return Math.min(insulin.dosage * 0.5, 4);
    if (hoursSince < 3) return Math.min(insulin.dosage * 0.3, 3);
    return 0;
  }
  return Math.min(insulin.dosage * 0.1, 2);
}

export function calculateMealGapFactor(lastMealTime?: Date): number {
  if (!lastMealTime) return 3;
  const hoursSince = (Date.now() - lastMealTime.getTime()) / 3600000;
  if (hoursSince > 5) return 4;
  if (hoursSince > 4) return 3;
  if (hoursSince > 3) return 2;
  if (hoursSince > 2) return 1;
  return 0;
}

export function calculateActivityFactor(activity?: ActivityLog): number {
  if (!activity) return 0;
  const hoursSince = (Date.now() - activity.timestamp.getTime()) / 3600000;
  if (hoursSince > 3) return 0;
  const intensityMap: Record<string, number> = {
    walking: 1, yoga: 1, cycling: 2, running: 3, gym: 3, sports: 3,
  };
  const base = intensityMap[activity.type] || 1;
  const durationFactor = Math.min(activity.duration / 30, 2);
  return Math.min(base * durationFactor, 4);
}

export function calculateTrendFactor(readings: GlucoseReading[]): number {
  if (readings.length < 2) return 1;
  const sorted = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const recent = sorted.slice(-3);
  const trend = recent[recent.length - 1].value - recent[0].value;
  if (trend < -30) return 4;
  if (trend < -15) return 2;
  if (trend < 0) return 1;
  return 0;
}

export function calculateTimeFactor(): number {
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 5) return 3;
  if (hour >= 14 && hour <= 16) return 2;
  return 0;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 9) return 'HIGH';
  if (score >= 5) return 'MEDIUM';
  return 'LOW';
}

export function getConfidence(mode: PredictionMode): number {
  const ranges: Record<PredictionMode, [number, number]> = {
    cgm: [80, 95],
    manual: [50, 75],
    lifestyle: [30, 50],
  };
  const [min, max] = ranges[mode];
  return Math.round(min + Math.random() * (max - min));
}

export function predict(
  mode: PredictionMode,
  glucose?: number,
  insulin?: InsulinLog,
  lastMealTime?: Date,
  activity?: ActivityLog,
  readings: GlucoseReading[] = []
): PredictionResult {
  const factors: RiskFactors = {
    glucose_factor: calculateGlucoseFactor(glucose),
    insulin_factor: calculateInsulinFactor(insulin),
    meal_gap_factor: calculateMealGapFactor(lastMealTime),
    activity_factor: calculateActivityFactor(activity),
    trend_factor: calculateTrendFactor(readings),
    time_factor: calculateTimeFactor(),
  };

  const riskScore = Object.values(factors).reduce((a, b) => a + b, 0);
  const riskLevel = getRiskLevel(riskScore);
  const confidence = getConfidence(mode);

  const baseGlucose = glucose || 110;
  const predictions = [30, 60, 90].map((minutes) => ({
    minutes,
    risk: Math.min(riskScore + Math.floor(minutes / 30), 15),
    glucose: Math.max(40, baseGlucose - (riskScore * minutes) / 20 + (Math.random() - 0.5) * 10),
  }));

  const explanation = generateExplanation(riskLevel, factors);
  const actions = generateActions(riskLevel, factors);

  return { riskLevel, riskScore, confidence, factors, predictions, explanation, actions };
}

function generateExplanation(level: RiskLevel, factors: RiskFactors): string {
  const parts: string[] = [];
  if (factors.glucose_factor >= 3) parts.push('Current glucose is low');
  if (factors.insulin_factor >= 2) parts.push('Recent insulin may cause further drop');
  if (factors.meal_gap_factor >= 3) parts.push('Extended gap since last meal');
  if (factors.activity_factor >= 2) parts.push('Recent physical activity increases glucose consumption');
  if (factors.trend_factor >= 2) parts.push('Glucose trend is declining');
  if (factors.time_factor >= 2) parts.push('Current time is a common risk window');
  if (parts.length === 0) return 'All factors are within safe ranges.';
  return `${level} risk detected. ${parts.join('. ')}.`;
}

function generateActions(level: RiskLevel, factors: RiskFactors): string[] {
  const actions: string[] = [];
  if (level === 'HIGH') {
    actions.push('Consume 15-20g fast-acting carbs immediately');
    actions.push('Recheck glucose in 15 minutes');
    actions.push('Contact your healthcare provider if symptoms persist');
  } else if (level === 'MEDIUM') {
    actions.push('Have a small snack with 10-15g carbs');
    actions.push('Monitor glucose closely for the next hour');
  }
  if (factors.meal_gap_factor >= 3) actions.push('Consider having a balanced meal soon');
  if (factors.activity_factor >= 2) actions.push('Reduce physical activity intensity');
  if (actions.length === 0) actions.push('Continue monitoring as usual');
  return actions;
}

export const INDIAN_MEALS = [
  { name: 'Idli (2 pcs)', calories: 130, carbs: 24 },
  { name: 'Dosa (1 pc)', calories: 170, carbs: 28 },
  { name: 'Rice (1 cup)', calories: 205, carbs: 45 },
  { name: 'Roti (2 pcs)', calories: 200, carbs: 30 },
  { name: 'Dal (1 cup)', calories: 180, carbs: 30 },
  { name: 'Paneer Curry', calories: 260, carbs: 8 },
  { name: 'Chicken Curry', calories: 240, carbs: 6 },
  { name: 'Biryani (1 plate)', calories: 400, carbs: 55 },
  { name: 'Poha (1 cup)', calories: 180, carbs: 32 },
  { name: 'Upma (1 cup)', calories: 200, carbs: 34 },
  { name: 'Paratha (1 pc)', calories: 220, carbs: 30 },
  { name: 'Samosa (1 pc)', calories: 150, carbs: 18 },
  { name: 'Vada (2 pcs)', calories: 200, carbs: 22 },
  { name: 'Curd Rice', calories: 180, carbs: 28 },
  { name: 'Puri (2 pcs)', calories: 200, carbs: 24 },
];

export const EXERCISE_TYPES = [
  'Walking', 'Running', 'Cycling', 'Gym', 'Yoga', 'Sports',
];
