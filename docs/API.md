# API Endpoints

Base URL: `http://localhost:8000/api`

All endpoints except Health require authentication via `Authorization: Bearer <JWT>` header. In development mode, auth is bypassed with a test user.

---

## Health

### `GET /health`

Server health check.

**Response** `200`
```json
{
  "status": "ok",
  "uptime": "583s",
  "timestamp": "2026-03-30T22:03:56.667Z"
}
```

---

## Recordings

### `POST /recordings/transcribe`

Upload an audio file and transcribe it.

**Body** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audio | file | yes | Audio file (max 25MB). Supported: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm |
| language | string | no | ISO 639-1 code (e.g. "en", "fr"). Auto-detected if omitted |
| duration | number | no | Duration in seconds |

**Response** `201`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "audio_url": "https://...",
  "transcript": "Transcribed text...",
  "language": "en",
  "duration": 45,
  "status": "completed",
  "created_at": "...",
  "updated_at": "..."
}
```

**Errors**: `LANGUAGE_DETECTION_FAILED` (422)

---

### `GET /recordings`

List all recordings for the authenticated user.

**Response** `200` — Array of recording objects.

---

### `GET /recordings/:recordingId`

Get a single recording by ID.

**Response** `200` — Recording object.

---

### `PATCH /recordings/:recordingId`

Update a recording's transcript or language.

**Body** `application/json`
| Field | Type | Required |
|-------|------|----------|
| transcript | string | no |
| language | string | no |

**Response** `200` — Updated recording object.

---

### `DELETE /recordings/:recordingId`

Delete a recording.

**Response** `204` — No content.

---

## Posts

### `POST /posts/generate`

Generate a LinkedIn post. Supports two modes:

**Mode 1: From recording (voice-first)**
```json
{
  "recordingId": "uuid",
  "writingStyle": "storytelling"
}
```

**Mode 2: From manual text**
```json
{
  "transcript": "My thoughts on building in public...",
  "writingStyle": "professional"
}
```

**Body** `application/json`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| recordingId | uuid | one of these | Fetch transcript from recording |
| transcript | string (min 10) | is required | Manual text input |
| writingStyle | enum | no | Default: `professional` |
| language | enum | no | `en` or `fr`. Falls back to recording language, then preferences |
| authorContext | object | no | Falls back to saved preferences |
| authorContext.role | string | no | e.g. "Founder", "CTO" |
| authorContext.industry | string | no | e.g. "SaaS", "Finance" |
| authorContext.audience | string | no | e.g. "Entrepreneurs", "CTOs" |
| authorContext.goal | string | no | e.g. "Build authority", "Generate leads" |

**Writing styles**: `professional`, `casual`, `funny`, `storytelling`, `conversational`, `creative`, `technical`, `marketing`, `sales`, `personal`, `corporate`, `academic`

**Response** `200` — Streaming NDJSON

Each line is a JSON object followed by `\n`:
```
{"content":"Building "}
{"content":"in "}
{"content":"public "}
{"content":"changed..."}
{"post":{"id":"uuid","user_id":"uuid","recording_id":"uuid","content":"Full post...","post_type":"storytelling","is_favorite":null,"copied_at":null,"created_at":"...","updated_at":"..."}}
```

**Errors**: `NO_TRANSCRIPT` (400), `GENERATION_FAILED` (500)

**Regeneration**: Call the same endpoint again with the same `recordingId` and a different `writingStyle`. Each call creates a new post.

---

### `GET /posts`

List posts for the authenticated user, newest first.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |

**Response** `200` — Array of post objects.

---

### `GET /posts/:postId`

Get a single post by ID.

**Response** `200` — Post object.

---

### `PATCH /posts/:postId`

Update a post.

**Body** `application/json`
| Field | Type | Description |
|-------|------|-------------|
| content | string | Edit the post text |
| is_favorite | boolean | Toggle favorite |
| copied | boolean | Set `true` to record `copied_at` timestamp (server-side) |

**Response** `200` — Updated post object.

---

### `DELETE /posts/:postId`

Delete a post.

**Response** `204` — No content.

---

## Preferences

### `GET /preferences`

Get the authenticated user's saved preferences.

**Response** `200` — Preferences object or `null` if none saved.
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "writing_style": "storytelling",
  "language": "en",
  "role": "Founder",
  "industry": "SaaS",
  "audience": "Entrepreneurs",
  "goal": "Build authority",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### `PATCH /preferences`

Create or update preferences (upsert).

**Body** `application/json`
| Field | Type | Description |
|-------|------|-------------|
| writing_style | enum | Default writing style |
| language | enum | `en` or `fr` |
| role | string (max 100) | e.g. "Founder", "CTO" |
| industry | string (max 100) | e.g. "SaaS", "Finance" |
| audience | string (max 100) | e.g. "Entrepreneurs" |
| goal | string (max 200) | e.g. "Build authority" |

All fields are optional.

**Response** `200` — Updated preferences object.

---

## Error Format

All errors follow this structure:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

**Error codes**:
| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request body failed Zod validation |
| `NO_TRANSCRIPT` | 400 | Recording exists but has no transcript |
| `INVALID_FILE_TYPE` | 400 | Unsupported audio format |
| `FILE_TOO_LARGE` | 400 | Audio file exceeds 25MB |
| `INVALID_API_KEY` | 401 | OpenAI API key is invalid |
| `LANGUAGE_DETECTION_FAILED` | 422 | Whisper could not detect language |
| `INSUFFICIENT_CREDITS` | 429 | OpenAI rate limit hit |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `GENERATION_FAILED` | 500 | Post generation failed |
| `SERVICE_UNAVAILABLE` | 503 | OpenAI service is down |
