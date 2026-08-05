import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { z } from 'zod';
import { upsertPreferencesSchema } from '../schemas/preferences.schema';
import { createDraftSchema, generatePostSchema, updatePostSchema } from '../schemas/post.schema';
import { updateTranscriptionSchema } from '../schemas/recording.schema';
import { Language, MimeType, PostStatus, PostType, RecordingStatus, WritingStyle } from '../types/enums';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ── Security ──
const bearerAuth = registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Supabase JWT access token',
});

// ── Reusable enum schemas ──
const WritingStyleSchema = registry.register(
  'WritingStyle',
  z.nativeEnum(WritingStyle).openapi({ description: 'Writing style' }),
);
const LanguageSchema = registry.register(
  'Language',
  z.nativeEnum(Language).openapi({ description: 'Language code' }),
);
registry.register(
  'MimeType',
  z.nativeEnum(MimeType).openapi({ description: 'Audio MIME type' }),
);

// ── Preferences ──
const PreferencesSchema = registry.register('Preferences', upsertPreferencesSchema.openapi({}));

// ── Recording ──
const RecordingSchema = registry.register(
  'Recording',
  z
    .object({
      id: z.string().uuid(),
      user_id: z.string().uuid(),
      audio_url: z.string(),
      transcript: z.string(),
      language: z.string(),
      duration: z.number().int(),
      status: z.nativeEnum(RecordingStatus),
      created_at: z.string().datetime(),
    })
    .openapi({}),
);

// ── Post ──
const PostSchema = registry.register(
  'Post',
  z
    .object({
      id: z.string().uuid(),
      user_id: z.string().uuid(),
      recording_id: z.string().uuid().nullable(),
      content: z.string(),
      post_type: z.string(),
      status: z.nativeEnum(PostStatus),
      is_favorite: z.boolean(),
      copied_at: z.string().datetime().nullable(),
      created_at: z.string().datetime(),
    })
    .openapi({}),
);

// ── Request schemas ──
const GeneratePostRequestSchema = registry.register(
  'GeneratePostRequest',
  generatePostSchema.openapi({}),
);
const CreateDraftRequestSchema = registry.register(
  'CreateDraftRequest',
  createDraftSchema.openapi({}),
);
const UpdatePostRequestSchema = registry.register(
  'UpdatePostRequest',
  updatePostSchema.openapi({}),
);
const UpdateRecordingRequestSchema = registry.register(
  'UpdateRecordingRequest',
  updateTranscriptionSchema.openapi({}),
);
const ErrorSchema = registry.register(
  'Error',
  z.object({ error: z.string() }).openapi({}),
);

// ── Paths ──

// Health
registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  security: [],
  responses: { 200: { description: 'Server is healthy' } },
});

// Preferences
registry.registerPath({
  method: 'get',
  path: '/preferences',
  tags: ['Preferences'],
  summary: 'Get user preferences',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'User preferences',
      content: { 'application/json': { schema: PreferencesSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/preferences',
  tags: ['Preferences'],
  summary: 'Create or update user preferences',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: PreferencesSchema,
          example: {
            writing_style: 'storytelling',
            language: 'en',
            role: 'Founder',
            industry: 'SaaS',
            audience: 'Entrepreneurs',
            onboarding_completed: true,
            goal: 'Build authority',
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated preferences',
      content: { 'application/json': { schema: PreferencesSchema } },
    },
  },
});

// Recordings
registry.registerPath({
  method: 'get',
  path: '/recordings',
  tags: ['Recordings'],
  summary: 'List user recordings',
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: {
      description: 'List of recordings',
      content: {
        'application/json': {
          schema: { type: 'array', items: { $ref: '#/components/schemas/Recording' } },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/recordings/transcribe',
  tags: ['Recordings'],
  summary: 'Upload and transcribe an audio file',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            audio: z.string().openapi({ type: 'string', format: 'binary', description: 'Audio file (max 25MB)' }),
            language: z.string().optional().openapi({ description: 'Language code (e.g. "en", "fr")' }),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Recording created with transcription',
      content: { 'application/json': { schema: RecordingSchema } },
    },
    400: { description: 'No audio file provided' },
    422: { description: 'Language detection failed' },
  },
});

const recordingIdParam = z.string().uuid().openapi({ param: { name: 'recordingId', in: 'path' } });

registry.registerPath({
  method: 'get',
  path: '/recordings/{recordingId}',
  tags: ['Recordings'],
  summary: 'Get a recording by ID',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ recordingId: recordingIdParam }) },
  responses: {
    200: {
      description: 'Recording details',
      content: { 'application/json': { schema: RecordingSchema } },
    },
    404: { description: 'Recording not found' },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/recordings/{recordingId}',
  tags: ['Recordings'],
  summary: 'Update a recording',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ recordingId: recordingIdParam }),
    body: {
      content: {
        'application/json': {
          schema: UpdateRecordingRequestSchema,
          example: { transcript: 'Updated transcript text', language: 'en' },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated recording',
      content: { 'application/json': { schema: RecordingSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/recordings/{recordingId}',
  tags: ['Recordings'],
  summary: 'Delete a recording',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ recordingId: recordingIdParam }) },
  responses: { 204: { description: 'Recording deleted' } },
});

// Posts
registry.registerPath({
  method: 'get',
  path: '/posts',
  tags: ['Posts'],
  summary: 'List user posts',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    query: z.object({
      page: z.number().int().default(1).optional(),
      limit: z.number().int().default(10).optional(),
      status: z.nativeEnum(PostStatus).optional().openapi({ description: 'Filter by post status' }),
      is_favorite: z.boolean().optional().openapi({ description: 'Filter by favorite status' }),
      sort: z.enum(['asc', 'desc']).optional().openapi({ description: 'Sort order by created_at (default: desc)' }),
      writing_style: z.nativeEnum(WritingStyle).optional().openapi({ description: 'Filter by writing style' }),
      post_type: z.nativeEnum(PostType).optional().openapi({ description: 'Filter by post type (e.g. linkedin)' }),
    }),
  },
  responses: {
    200: {
      description: 'List of posts',
      content: {
        'application/json': {
          schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/posts/draft',
  tags: ['Posts'],
  summary: 'Create a draft post',
  description: 'Creates a post with status "draft". No AI generation is performed.',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateDraftRequestSchema,
          example: {
            recordingId: '{{recordingId}}',
            content: 'My draft content...',
            writingStyle: 'professional',
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Draft post created',
      content: { 'application/json': { schema: PostSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/posts/generate',
  tags: ['Posts'],
  summary: 'Generate a LinkedIn post from recording or text',
  description: 'Returns a streamed response. Provide either recordingId or transcript.',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: GeneratePostRequestSchema,
          examples: {
            fromRecording: {
              summary: 'Generate from a recording',
              value: { recordingId: '{{recordingId}}', writingStyle: 'storytelling' },
            },
            fromText: {
              summary: 'Generate from manual text',
              value: {
                transcript: 'Today I want to talk about building in public...',
                writingStyle: 'professional',
              },
            },
            withContext: {
              summary: 'With author context',
              value: {
                recordingId: '{{recordingId}}',
                writingStyle: 'casual',
                authorContext: {
                  role: 'CTO',
                  industry: 'Tech',
                  audience: 'Engineering leaders',
                  goal: 'Share leadership insights',
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Streamed post generation (NDJSON)',
      content: { 'text/event-stream': { schema: { type: 'string' } } },
    },
  },
});

const postIdParam = z.string().uuid().openapi({ param: { name: 'postId', in: 'path' } });

registry.registerPath({
  method: 'get',
  path: '/posts/{postId}',
  tags: ['Posts'],
  summary: 'Get a post by ID',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ postId: postIdParam }) },
  responses: {
    200: {
      description: 'Post details',
      content: { 'application/json': { schema: PostSchema } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/posts/{postId}',
  tags: ['Posts'],
  summary: 'Update a post (content, favorite, copied, post_type)',
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ postId: postIdParam }),
    body: {
      content: { 'application/json': { schema: UpdatePostRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Updated post',
      content: { 'application/json': { schema: PostSchema } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/posts/{postId}',
  tags: ['Posts'],
  summary: 'Delete a post',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ postId: postIdParam }) },
  responses: { 204: { description: 'Post deleted' } },
});

// ── Generate document ──
const generator = new OpenApiGeneratorV3(registry.definitions);
const swaggerDocument = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Talk2Post API',
    version: '1.0.0',
    description: 'Transform voice recordings and text into LinkedIn posts using AI.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  security: [{ BearerAuth: [] }],
});

const CDN = 'https://unpkg.com/swagger-ui-dist@5.18.2';

const router = Router();
router.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCssUrl: `${CDN}/swagger-ui.css`,
    customJs: [`${CDN}/swagger-ui-bundle.js`, `${CDN}/swagger-ui-standalone-preset.js`],
  }),
);

export { router as swaggerRouter, swaggerDocument };
