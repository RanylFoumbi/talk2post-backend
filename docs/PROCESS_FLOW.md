# Process Flows

## 1. Voice-to-Post (Core Flow)

```
┌──────────┐    POST /recordings/transcribe     ┌───────────┐
│  Client   │──────── audio file ──────────────▶│  Backend   │
│  (App)    │                                    └─────┬─────┘
└──────────┘                                           │
                                                       ▼
                                              ┌────────────────┐
                                              │ Upload audio to │
                                              │ Supabase Storage│
                                              └───────┬────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │ Create recording│
                                              │ status:processing│
                                              └───────┬────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │ Whisper API     │
                                              │ transcribe +    │
                                              │ detect language  │
                                              └───────┬────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │ Update recording│
                                              │ status:completed│
┌──────────┐                                  │ + transcript    │
│  Client   │◀──── recording with transcript ──└────────────────┘
└─────┬────┘
      │
      │         POST /posts/generate
      │         { recordingId, writingStyle }
      │
      ▼
┌───────────┐   ┌──────────────┐   ┌──────────────┐
│  Backend   │──▶│ Fetch        │──▶│ Load user    │
└─────┬─────┘   │ recording    │   │ preferences  │
      │         │ transcript   │   │ (fallbacks)  │
      │         └──────────────┘   └──────┬───────┘
      │                                    │
      ▼                                    ▼
┌────────────────────────────────────────────────┐
│              OpenAI GPT-5-Nano                 │
│  System prompt + user prompt (transcript,      │
│  writing style, language, author context)       │
└──────────────────┬─────────────────────────────┘
                   │
                   ▼ streaming
┌──────────┐   {"content":"delta"}\n
│  Client   │◀─{"content":"delta"}\n
│  (App)    │  {"content":"delta"}\n
│           │  ...
│           │◀─{"post":{id, content, ...}}\n    ← saved to DB
└──────────┘
```

## 2. Manual Text-to-Post

```
┌──────────┐    POST /posts/generate              ┌───────────┐
│  Client   │──── { transcript, writingStyle } ──▶│  Backend   │
└──────────┘                                      └─────┬─────┘
                                                        │
                            ┌───────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Load user      │
                   │ preferences    │
                   │ (fallbacks)    │
                   └───────┬────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │ OpenAI stream  │
                   │ GPT-5-Nano    │
                   └───────┬────────┘
                           │
                           ▼ streaming NDJSON
┌──────────┐      {"content":"delta"}\n
│  Client   │◀────{"post":{...}}\n              ← saved (no recording_id)
└──────────┘
```

## 3. Regenerate (Different Style)

Same endpoint, same recording, different result:

```
1st call:  { recordingId: "abc", writingStyle: "professional" }  → Post A
2nd call:  { recordingId: "abc", writingStyle: "casual" }        → Post B
3rd call:  { recordingId: "abc", writingStyle: "funny" }         → Post C
```

All three posts are saved independently. The user picks the one they like best.

## 4. Preferences Flow

```
┌──────────┐    PUT /preferences                  ┌───────────┐
│  Client   │──── { writing_style, role,      ──▶│  Backend   │
│  (App)    │      industry, audience, goal }     │  (upsert)  │
└──────────┘                                      └───────────┘

Later, during generation:

  Request body           Preferences (DB)         Final params
  ─────────────          ────────────────          ────────────
  writingStyle: "casual" writing_style: "pro"  →  "casual"     (request wins)
  language: (empty)      language: "fr"        →  "fr"          (preference fills gap)
  authorContext: (empty)  role: "Founder"      →  { role: "Founder", ... }
```

## 5. Audio Lifecycle

```
  0 min          Upload audio to Supabase Storage
                 audio_url saved in recordings table
                 │
  0-15 min       Audio accessible via public URL
                 │
  15 min         Cron job runs:
                 ├── Delete audio file from storage
                 └── Set audio_url = NULL in DB
                 │
  Forever        Transcript persists in recordings table
                 └── Available for regeneration
```

## 6. Authentication Flow

```
┌──────────┐                    ┌──────────────┐
│  Client   │── Bearer <JWT> ──▶│ Auth         │
└──────────┘                    │ Middleware    │
                                └──────┬───────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                     Production                Development
                          │                         │
                     Verify JWT with            Skip auth,
                     Supabase secret            use test user
                          │                         │
                     Extract:                  Hardcoded:
                     - userId (sub)            - userId
                     - userEmail               - email
                     - userRole                - role: "user"
                          │                         │
                          └────────────┬────────────┘
                                       │
                                       ▼
                                  req.userId
                                  req.userEmail
                                  req.userRole
```
