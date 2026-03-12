import { Language, Plan, PostType, RecordingStatus, UserRole, WritingStyle } from "./enums.model";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  writing_style: WritingStyle | null;
  post_type_preference: PostType;
  credits_remaining: number;
  plan: Plan;
  created_at: string;
}

export interface Recording {
  id: string;
  user_id: string;
  audio_url: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  language: Language;
  status: RecordingStatus;
  audio_expires_at: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  recording_id: string | null;
  content: string;
  post_type: PostType;
  is_favorite: boolean;
  copied_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  lemonsqueezy_id: string | null;
  status: string;
  current_period_end: string | null;
  created_at: string;
}
