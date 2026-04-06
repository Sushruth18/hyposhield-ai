const DEVELOPMENT_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:8080",
]);

const ALLOWED_HEADERS = ["Authorization", "Content-Type"];

function toOriginSet(origins) {
  const normalized = (origins || [])
    .filter(Boolean)
    .map((origin) => String(origin).trim())
    .filter(Boolean);

  return new Set(normalized);
}

export function buildCorsConfig({ nodeEnv, frontendOrigin }) {
  const isProduction = nodeEnv === "production";

  if (isProduction && !frontendOrigin) {
    throw new Error(
      "CORS configuration error: FRONTEND_ORIGIN must be defined in production"
    );
  }

  const allowedOrigins = isProduction
    ? toOriginSet([frontendOrigin])
    : toOriginSet([...DEVELOPMENT_ALLOWED_ORIGINS, frontendOrigin]);

  return {
    credentials: true,
    allowedHeaders: ALLOWED_HEADERS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
    origin(origin, callback) {
      // Requests like server-to-server or curl may not have an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin is not allowed"));
    },
  };
}
