import { createOpenAI } from '@ai-sdk/openai';
import { StreamTextResult, streamText, ToolSet } from 'ai';
import { LINKEDIN_POST_SYSTEM_PROMPT } from '../ai/assistant.ai';
import { userPrompt } from '../ai/script.ai';
import { SupabaseConfig } from '../config';
import { Config } from '../config/env';
import { DEFAULT_LLM_MODEL } from '../types/ai.types';
import { PostStatus, WritingStyle } from '../types/enums';

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

export interface CreateDraftParams {
  userId: string;
  recordingId?: string;
  content?: string;
  writingStyle?: string;
}

export interface UpdatePostData {
  content?: string;
  is_favorite?: boolean;
  copied_at?: string;
  post_type?: string;
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

  static async createDraft(params: CreateDraftParams) {
    const { userId, recordingId, content, writingStyle } = params;

    const { data: post, error } = await SupabaseConfig.getAdmin()
      .from('posts')
      .insert({
        user_id: userId,
        recording_id: recordingId || null,
        content: content || '',
        post_type: writingStyle || 'professional',
        status: PostStatus.DRAFT,
      })
      .select()
      .single();

    if (error) throw error;

    return post;
  }

  static async listUserPosts(userId: string, options: {
    page?: number;
    limit?: number;
    status?: PostStatus;
    isFavorite?: boolean;
    sort?: 'asc' | 'desc';
    postType?: string;
  } = {}) {
    const { page = 1, limit = 20, status, isFavorite, sort = 'desc', postType } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = SupabaseConfig.getAdmin()
      .from('posts')
      .select()
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }
    if (isFavorite !== undefined) {
      query = query.eq('is_favorite', isFavorite);
    }
    if (postType) {
      query = query.eq('post_type', postType);
    }

    const { data: posts, error } = await query
      .order('created_at', { ascending: sort === 'asc' })
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

  static async purgeExpiredDrafts(maxAgeDays: number): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: expired, error: fetchError } = await SupabaseConfig.getAdmin()
      .from('posts')
      .select('id')
      .eq('status', PostStatus.DRAFT)
      .lt('created_at', cutoff);

    if (fetchError) throw fetchError;
    if (!expired || expired.length === 0) return;

    const ids = expired.map((d) => d.id);
    const { error: deleteError } = await SupabaseConfig.getAdmin()
      .from('posts')
      .delete()
      .in('id', ids);

    if (deleteError) throw deleteError;

    console.log(`[purgeExpiredDrafts] Deleted ${ids.length} draft(s) older than ${maxAgeDays} days`);
  }
}
