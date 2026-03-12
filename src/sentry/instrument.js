import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"
import dotenv from "dotenv"
import { createRequire } from "module"

dotenv.config()

const require = createRequire(import.meta.url)
const { version } = require("../../package.json")

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  release: `talk2post-backend@${version}`,

  integrations: [
    nodeProfilingIntegration(),
  ],

  // Send structured logs to Sentry
  enableLogs: true,

  // Tracing — lower in production to save quota
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.3 : 1.0,

  // Don't send health check noise
  ignoreTransactions: ["/api/health"],

  // Profiling
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",

  // Send default PII (IP addresses, etc.)
  sendDefaultPii: true,

  // Strip sensitive headers before sending to Sentry
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
    }
    return event;
  },
});

// Set global tags for all events
Sentry.setTag("app", "talk2post-backend");
