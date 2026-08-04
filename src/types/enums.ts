export enum RecordingStatus {
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum Language {
  FRENCH = 'fr',
  ENGLISH = 'en',
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum Plan {
  FREE = 'free',
  PRO = 'pro',
}

export enum PostType {
  LINKEDIN = 'linkedin',
}

export enum PostStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
}

export enum MimeType {
  FLAC = 'audio/flac',
  MP3 = 'audio/mp3',
  MP4 = 'audio/mp4',
  MPEG = 'audio/mpeg',
  MPGA = 'audio/mpga',
  M4A = 'audio/m4a',
  OGG = 'audio/ogg',
  WAV = 'audio/wav',
  WEBM = 'audio/webm',
}

export const AllMimeTypes = Object.values(MimeType);

export enum WritingStyle {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  FUNNY = 'funny',
  STORYTELLING = 'storytelling',
  CONVERSATIONAL = 'conversational',
  CREATIVE = 'creative',
  TECHNICAL = 'technical',
  MARKETING = 'marketing',
  SALES = 'sales',
  PERSONAL = 'personal',
  CORPORATE = 'corporate',
  ACADEMIC = 'academic',
}
