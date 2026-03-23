import { NextFunction, Request, Response } from 'express';
import { Sentry } from '../config';
import { PostService } from '../services/post.service';

export class PostController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.flushHeaders();

    try {
      const result = PostService.generateStream(req.body);

      for await (const delta of result.textStream) {
        res.write(JSON.stringify({ content: delta }) + '\n');
      }

      res.end();
    } catch (err) {
      Sentry.captureException(err);
      next(err);
    }
  }
}
