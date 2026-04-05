import rateLimit from "express-rate-limit";

const TOO_MANY_REQUESTS_RESPONSE = {
  error: "Too many requests, please try again later",
};

export const RATE_LIMIT_CONFIG = {
  global: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  predictionsPost: {
    windowMs: 10 * 60 * 1000,
    max: 20,
  },
  insightsExplainPost: {
    windowMs: 10 * 60 * 1000,
    max: 10,
  },
};

function onRateLimit(_req, res) {
  return res.status(429).json(TOO_MANY_REQUESTS_RESPONSE);
}

function createLimiter(config) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: onRateLimit,
  });
}

export const globalLimiter = createLimiter(RATE_LIMIT_CONFIG.global);
export const predictionPostLimiter = createLimiter(RATE_LIMIT_CONFIG.predictionsPost);
export const insightsExplainPostLimiter = createLimiter(RATE_LIMIT_CONFIG.insightsExplainPost);

export function getTrustProxySetting(rawTrustProxy) {
  if (rawTrustProxy === undefined || rawTrustProxy === null || rawTrustProxy === "") {
    return 1;
  }

  const normalized = String(rawTrustProxy).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  const parsedNumber = Number(normalized);
  if (Number.isInteger(parsedNumber) && parsedNumber >= 0) {
    return parsedNumber;
  }

  return rawTrustProxy;
}