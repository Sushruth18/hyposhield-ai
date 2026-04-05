import fs from "node:fs/promises";
import path from "node:path";

const ROOT_ENV_FILE = path.join(process.cwd(), ".env");

function parseEnvFile(content) {
  const entries = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

async function readProjectEnv() {
  try {
    const raw = await fs.readFile(ROOT_ENV_FILE, "utf8");
    return parseEnvFile(raw);
  } catch {
    return {};
  }
}

function pickValue(key, envSources) {
  for (const source of envSources) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function validatePort(rawPort) {
  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return null;
  }
  return parsed;
}

function failValidation(message) {
  throw new Error(`Environment configuration error: ${message}`);
}

const projectEnv = await readProjectEnv();
const nodeEnv = pickValue("NODE_ENV", [process.env, projectEnv]) || "development";

const rawConfig = {
  NODE_ENV: nodeEnv,
  SUPABASE_URL: pickValue("SUPABASE_URL", [process.env, projectEnv]),
  SUPABASE_SERVICE_ROLE_KEY: pickValue("SUPABASE_SERVICE_ROLE_KEY", [process.env, projectEnv]),
  GROQ_API_KEY: pickValue("GROQ_API_KEY", [process.env, projectEnv]),
  FRONTEND_ORIGIN: pickValue("FRONTEND_ORIGIN", [process.env, projectEnv]),
  PORT: pickValue("PORT", [process.env, projectEnv]),
  TRUST_PROXY: pickValue("TRUST_PROXY", [process.env, projectEnv]),
};

const requiredKeys = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GROQ_API_KEY",
  "FRONTEND_ORIGIN",
  "PORT",
];

const missingRequired = requiredKeys.filter((key) => !rawConfig[key]);
if (rawConfig.NODE_ENV === "production" && missingRequired.length > 0) {
  failValidation(`Missing required environment variables in production: ${missingRequired.join(", ")}`);
} else if (missingRequired.length > 0) {
  console.warn(
    `Environment validation warning: Missing variables: ${missingRequired.join(", ")}`
  );
}

const parsedPort = validatePort(rawConfig.PORT);
if (rawConfig.NODE_ENV === "production" && parsedPort === null) {
  failValidation("PORT must be a valid integer between 1 and 65535");
} else if (parsedPort === null) {
  console.warn("Environment validation warning: Invalid or missing PORT, using default 4000");
}

export const envConfig = {
  NODE_ENV: rawConfig.NODE_ENV,
  SUPABASE_URL: rawConfig.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: rawConfig.SUPABASE_SERVICE_ROLE_KEY,
  GROQ_API_KEY: rawConfig.GROQ_API_KEY,
  FRONTEND_ORIGIN: rawConfig.FRONTEND_ORIGIN,
  PORT: parsedPort ?? 4000,
  TRUST_PROXY: rawConfig.TRUST_PROXY,
};
