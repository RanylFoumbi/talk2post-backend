import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config';
import { resolveStreamErrorCode } from '../middleware/error.middleware';
import { PostService } from '../services/post.service';

export class PostController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    try {
      const start = Date.now();
      const result = PostService.generateStream(req.body);

      for await (const delta of result.textStream) {
        res.write(JSON.stringify({ content: delta }) + '\n');
      }

      console.log(`[PostController] generation took ${Date.now() - start}ms`);
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
