# Architecture

## Directory Structure

```
src/
├── ai/                     # AI prompt engineering
│   ├── assistant.ai.ts     # System prompt (LinkedIn post expert)
│   └── script.ai.ts        # User prompt template (transcript + context)
│
├── config/                 # Service configuration
│   ├── env.ts              # Environment variables + CORS origins
│   ├── index.ts            # Barrel export
│   ├── openai.ts           # OpenAI client singleton
│   ├── sentry.ts           # Sentry initialization
│   ├── sentry.instrument.js # Sentry instrumentation hook
│   ├── supabase.ts         # Supabase client (anon + admin)
│   └── upload.ts           # Multer config (25MB limit)
│
├── controllers/            # Request handlers
│   ├── health.controller.ts
│   ├── post.controller.ts
│   ├── preferences.controller.ts
│   └── recording.controller.ts
│
├── middleware/              # Express middleware
│   ├── auth.middleware.ts   # JWT verification + dev bypass
│   ├── error.middleware.ts  # Centralized error handling + Sentry
│   ├── rate-limit.middleware.ts  # 1000/hr auth, 100/hr unauth
│   └── validate.middleware.ts    # Zod schema validation
│
├── routes/                 # Route definitions
│   ├── health.routes.ts
│   ├── index.ts            # Route aggregation (/api)
│   ├── post.routes.ts
│   ├── preferences.routes.ts
│   └── recording.routes.ts
│
├── schemas/                # Zod validation schemas
│   ├── post.schema.ts
│   ├── preferences.schema.ts
│   └── recording.schema.ts
│
├── services/               # Business logic + DB access
│   ├── post.service.ts
│   ├── preferences.service.ts
│   ├── recording.service.ts
│   └── whisper.service.ts
│
├── types/                  # TypeScript definitions
│   ├── ai.types.ts         # OpenAI model enums
│   ├── database.types.ts   # Supabase auto-generated types
│   └── enums.ts            # App enums (WritingStyle, Language, etc.)
│
├── utils/                  # Utility functions
│   ├── cronjob.ts          # Expired audio purge (every 15 min)
│   └── pricing.ts          # OpenAI cost calculations
│
├── app.ts                  # Express app initialization
└── server.ts               # Server startup (port 8000)
```

## Layered Architecture

```
Request
  │
  ▼
┌─────────────────────────────────────────┐
│            Middleware Chain              │
│  Auth → Rate Limit → Zod Validation    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│             Controllers                 │
│  Parse request, orchestrate services,   │
│  format response                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│              Services                   │
│  Business logic, DB queries,            │
│  external API calls (OpenAI)            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          Supabase (PostgreSQL)          │
│  Tables with Row Level Security         │
│  Storage bucket for audio files         │
└─────────────────────────────────────────┘
```

## Database Schema

```
┌──────────────────┐     ┌──────────────────┐
│   auth.users     │     │    profiles       │
│   (Supabase)     │────▶│  id (PK = user)   │
│                  │     │  full_name         │
│                  │     │  role              │
│                  │     │  credits_remaining │
│                  │     │  plan              │
└──────────────────┘     └───────┬───────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
          ┌─────────────┐ ┌───────────┐ ┌──────────────────┐
          │  recordings  │ │   posts   │ │ user_preferences │
          │  id          │ │  id       │ │  id              │
          │  user_id(FK) │ │  user_id  │ │  user_id (unique)│
          │  audio_url   │ │  rec_id   │ │  writing_style   │
          │  transcript  │ │  content  │ │  language         │
          │  language    │ │  post_type│ │  role             │
          │  duration    │ │  is_fav   │ │  industry         │
          │  status      │ │  copied_at│ │  audience         │
          └──────┬───────┘ └─────┬─────┘ │  goal             │
                 │               │        └──────────────────┘
                 │               │
                 └───────────────┘
                 posts.recording_id
                 FK (nullable)
```

## Key Design Decisions

### Static class pattern
All controllers and services use static methods. No instantiation needed — keeps things simple and stateless.

### Supabase admin client
The backend uses the service key (admin client) to bypass Row Level Security. RLS still protects direct client access from the frontend.

### Streaming with NDJSON
Post generation streams deltas as newline-delimited JSON. Each line is a self-contained JSON object:
```
{"content":"delta text"}\n     ← text chunk (many of these)
{"post":{...}}\n               ← final saved post object
{"error":"msg","code":"..."}\n ← error mid-stream (if any)
```

### Preferences as fallback defaults
User preferences are loaded during post generation but never override explicit request parameters. Request body > preferences > recording data.

### Audio expiry
Audio files are purged from storage every 15 minutes via a cron job. The transcript persists in the recordings table. This reduces storage costs while keeping transcripts available for regeneration.
