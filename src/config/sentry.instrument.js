const Sentry = require("@sentry/node")
const { nodeProfilingIntegration } = require("@sentry/profiling-node")
require("dotenv").config()

const { version } = require("../../package.json")

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  release: `talk2post-backend@${version}`,
  integrations: [
    nodeProfilingIntegration(),
  ],
  enableLogs: true,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.3 : 1.0,
  ignoreTransactions: ["/api/health"],
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  sendDefaultPii: true,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
    }
    return event;
  },
});
Sentry.setTag("app", "talk2post-backend");
