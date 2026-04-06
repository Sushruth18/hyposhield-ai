function normalizeReadings(readings) {
  if (!Array.isArray(readings)) {
    return [];
  }

  return readings
    .map((reading) => {
      const value = Number(reading?.value);
      const timestamp = new Date(reading?.timestamp).getTime();

      if (!Number.isFinite(value) || !Number.isFinite(timestamp)) {
        return null;
      }

      return { value, timestamp };
    })
    .filter(Boolean)
    .sort((left, right) => left.timestamp - right.timestamp);
}

function buildTrendSummary(readings) {
  if (readings.length === 0) {
    return "No valid glucose readings were provided.";
  }

  const values = readings.map((reading) => reading.value);
  const first = readings[0];
  const last = readings[readings.length - 1];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const change = last.value - first.value;
  const trendDirection = change <= -20 ? "falling" : change >= 20 ? "rising" : "stable";

  return [
    `${readings.length} readings analyzed`,
    `range ${Math.round(minimum)}-${Math.round(maximum)} mg/dL`,
    `average ${Math.round(average)} mg/dL`,
    `latest ${Math.round(last.value)} mg/dL`,
    `trend ${trendDirection}`,
  ].join(", ");
}

export function detectRapidDrops(readings) {
  const normalized = normalizeReadings(readings);

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    const minutesBetween = Math.max((current.timestamp - previous.timestamp) / 60000, 1);
    const drop = previous.value - current.value;
    const dropRatePerHour = (drop / minutesBetween) * 60;

    if (drop >= 20 && minutesBetween <= 180) {
      return true;
    }

    if (drop >= 15 && dropRatePerHour >= 12) {
      return true;
    }
  }

  return false;
}

export function detectMorningLows(readings) {
  const normalized = normalizeReadings(readings);

  return normalized.some((reading) => {
    const hour = new Date(reading.timestamp).getUTCHours();
    return hour >= 3 && hour < 8 && reading.value < 70;
  });
}

export function detectMealSpikes(readings) {
  const normalized = normalizeReadings(readings);

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    const minutesBetween = Math.max((current.timestamp - previous.timestamp) / 60000, 1);
    const increase = current.value - previous.value;

    if (increase >= 35 && minutesBetween <= 120) {
      return true;
    }
  }

  return false;
}

export function detectHypoglycemiaRisk(readings) {
  const normalized = normalizeReadings(readings);
  const lowReadings = normalized.filter((reading) => reading.value < 70);
  const severeReadings = normalized.filter((reading) => reading.value < 54);
  const rapidDrops = detectRapidDrops(normalized);
  const morningLows = detectMorningLows(normalized);
  const mealSpike = detectMealSpikes(normalized);

  let score = 0;

  if (severeReadings.length > 0) {
    score += 3;
  }

  if (lowReadings.length >= 2) {
    score += 2;
  }

  if (rapidDrops) {
    score += 2;
  }

  if (morningLows) {
    score += 1;
  }

  if (mealSpike) {
    score += 1;
  }

  if (normalized.length >= 2) {
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (last.value <= first.value - 25) {
      score += 1;
    }
  }

  const riskLevel = score >= 5 ? "high" : score >= 3 ? "moderate" : "low";

  return {
    riskLevel,
    rapidDrops,
    morningLows,
    mealSpike,
    lowCount: lowReadings.length,
    severeLowCount: severeReadings.length,
    minGlucose: normalized.length > 0 ? Math.min(...normalized.map((reading) => reading.value)) : null,
    averageGlucose:
      normalized.length > 0
        ? normalized.reduce((sum, reading) => sum + reading.value, 0) / normalized.length
        : null,
    trendSummary: buildTrendSummary(normalized),
  };
}
