import { createOpenAI } from '@ai-sdk/openai';
import { StreamTextResult, streamText, ToolSet } from 'ai';
import { LINKEDIN_POST_SYSTEM_PROMPT } from '../ai/assistant.ai';
import { userPrompt } from '../ai/script.ai';
import { SupabaseConfig } from '../config';
import { Config } from '../config/env';
import { DEFAULT_LLM_MODEL } from '../types/ai.types';
import { WritingStyle } from '../types/enums';

const openai = createOpenAI({ apiKey: Config.OPENAI_API_KEY });

export interface GenerateStreamParams {
  transcript: string;
  writingStyle: WritingStyle;
  language?: string;
  authorContext?: {
    role?: string;
    industry?: string;
    audience?: string;
    goal?: string;
  };
}

export interface CreatePostParams {
  userId: string;
  content: string;
  recordingId?: string;
  writingStyle?: string;
}

export interface UpdatePostData {
  content?: string;
  is_favorite?: boolean;
  copied_at?: string;
}

export class PostService {
  static generateStream(params: GenerateStreamParams): StreamTextResult<ToolSet, any> {
    return streamText({
      model: openai(DEFAULT_LLM_MODEL),
      messages: [
        { role: 'system', content: LINKEDIN_POST_SYSTEM_PROMPT },
        {
          role: 'user',
          content: userPrompt(
            params.transcript,
            params.writingStyle,
            params.language,
            params.authorContext,
          ),
        },
      ],
    });
  }

  static async createPost(params: CreatePostParams) {
    const { userId, content, recordingId, writingStyle } = params;

    const { data: post, error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .insert({
        user_id: userId,
        recording_id: recordingId || null,
        content,
        post_type: writingStyle || 'professional',
      })
      .select()
      .single();

    if (error) throw error;

    return post;
  }

  static async listUserPosts(userId: string, page: number = 1, limit: number = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: posts, error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return posts;
  }

  static async getPost(postId: string, userId: string) {
    const { data: post, error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .select()
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return post;
  }

  static async updatePost(postId: string, userId: string, data: UpdatePostData) {
    const { data: post, error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .update(data)
      .eq('id', postId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return post;
  }

  static async deletePost(postId: string, userId: string) {
    const { error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
