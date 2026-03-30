# Talk2Post

## What is Talk2Post?

Talk2Post is an AI-powered backend service that transforms voice recordings and written prompts into publication-ready LinkedIn posts. It is designed for professionals who want to build a personal brand on LinkedIn without spending hours writing.

## The Problem

- **Blank page paralysis** — professionals know they should post on LinkedIn but stare at a blank editor
- **Inconsistent posting** — without a low-friction workflow, posting drops off after a few weeks
- **Generic AI output** — tools like ChatGPT produce content that sounds robotic and loses the author's voice
- **Ghostwriters are expensive** — not accessible for solo founders, freelancers, or early-stage teams

## The Solution

Talk2Post lets users speak their ideas naturally (or type them), then generates a LinkedIn post that sounds like them — not like a generic AI tool. The system preserves the author's vocabulary, tone, and domain expertise.

## Target Audience

- Solo founders and indie hackers
- Independent consultants and coaches
- Business executives and CTOs
- Freelancers building personal brands
- Anyone who thinks better out loud than in writing

## Core User Journey

1. **Record** — user records a voice note (or types a prompt)
2. **Transcribe** — audio is transcribed via OpenAI Whisper with language detection
3. **Generate** — a LinkedIn post is streamed in real-time using GPT, styled to user preferences
4. **Refine** — user can regenerate with a different writing style, edit the content, or favorite it
5. **Copy** — user copies the post to LinkedIn

## Key Features

- **Voice-first input** with manual text fallback
- **12 writing styles** (professional, casual, funny, storytelling, conversational, creative, technical, marketing, sales, personal, corporate, academic)
- **Author context** — role, industry, audience, and goal shape the output
- **User preferences** — saved defaults so users don't configure every time
- **Real-time streaming** — post appears word-by-word (NDJSON)
- **Post management** — list, favorite, copy-track, edit, and delete generated posts
- **Multi-language** — supports English and French (ISO 639-1)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22, TypeScript (strict) |
| Framework | Express.js 4.x |
| Database | Supabase (PostgreSQL 14.1 + Row Level Security) |
| AI | OpenAI GPT-5-Nano (generation), Whisper-1 (transcription) |
| Auth | Supabase Auth (JWT, HS256) |
| Monitoring | Sentry (error tracking + performance tracing) |
| Payments | LemonSqueezy (planned) |
| CI/CD | GitHub Actions |
