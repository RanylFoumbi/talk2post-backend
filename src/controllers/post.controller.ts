import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config';
import { CustomError, resolveStreamErrorCode } from '../middleware/error.middleware';
import { listPostsQuerySchema } from '../schemas/post.schema';
import type { CreateDraftInput, UpdatePostInput } from '../schemas/post.schema';
import { PostService, type UpdatePostData } from '../services/post.service';
import { PreferencesService } from '../services/preferences.service';
import { RecordingService } from '../services/recording.service';

export class PostController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const { status, is_favorite, sort, writing_style, post_type } = listPostsQuerySchema.parse(req.query);
      const posts = await PostService.listUserPosts(req.userId!, {
        page, limit, status, isFavorite: is_favorite, sort, writingStyle: writing_style, postType: post_type,
      });

      res.status(200).json(posts);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await PostService.getPost(String(postId), req.userId!);

      res.status(200).json(post);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, is_favorite, copied, post_type } = req.body as UpdatePostInput;

      const updateData: UpdatePostData = {};
      if (content !== undefined) updateData.content = content;
      if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
      if (copied) updateData.copied_at = new Date().toISOString();
      if (post_type !== undefined) updateData.post_type = post_type;

      const post = await PostService.updatePost(String(postId), req.userId!, updateData);

      res.status(200).json(post);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { postId } = req.params;

      await PostService.deletePost(String(postId), req.userId!);

      res.status(204).send();
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async createDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recordingId, content, writingStyle } = req.body as CreateDraftInput;

      const post = await PostService.createDraft({
        userId: req.userId!,
        recordingId,
        content,
        writingStyle,
      });

      res.status(201).json(post);
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }

  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Resolve transcript before streaming starts (so errors return proper status codes)
      let transcript: string;
      let recordingLanguage: string | undefined;

      if (req.body.recordingId) {
        const recording = await RecordingService.getRecording(req.body.recordingId, req.userId!);
        if (!recording) {
          throw new CustomError('Recording not found', 404, 'RECORDING_NOT_FOUND');
        }
        if (!recording.transcript) {
          throw new CustomError('Recording has no transcript', 400, 'NO_TRANSCRIPT');
        }
        transcript = recording.transcript as string;
        recordingLanguage = recording.language ?? undefined;
      } else {
        transcript = req.body.transcript;
      }

      const params = {
        transcript,
        writingStyle: req.body.writingStyle,
        language: req.body.language || recordingLanguage,
        authorContext: req.body.authorContext,
      };

      // Apply saved preferences as fallback defaults
      const preferences = await PreferencesService.getUserPreferences(req.userId!);
      if (preferences) {
        if (!params.language && preferences.language) {
          params.language = preferences.language;
        }
        if (!params.authorContext) {
          const { role, industry, audience, goal } = preferences;
          if (role || industry || audience || goal) {
            params.authorContext = { role, industry, audience, goal };
          }
        }
      }

      // All validation passed — start streaming
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.flushHeaders();

      const result = PostService.generateStream(params);
      let fullContent = '';

      await Sentry.startSpan({ name: 'post.generate', op: 'ai.run' }, async () => {
        for await (const delta of result.textStream) {
          fullContent += delta;
          res.write(JSON.stringify({ content: delta }) + '\n');
        }
      });

      // Save post to DB
      const post = await PostService.createPost({
        userId: req.userId!,
        content: fullContent,
        recordingId: req.body.recordingId,
        writingStyle: req.body.writingStyle,
      });

      res.write(JSON.stringify({ post }) + '\n');
      res.end();
    } catch (err) {
      Sentry.captureException(err);
      if (!res.headersSent) {
        next(err);
      } else {
        res.write(JSON.stringify({ error: err instanceof Error ? err.message : 'Generation failed', code: resolveStreamErrorCode(err) }) + '\n');
        res.end();
      }
    }
  }
}
