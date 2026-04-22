import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Talk2Post API',
    version: '1.0.0',
    description: 'Transform voice recordings and text into LinkedIn posts using AI.',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT access token',
      },
    },
    schemas: {
      WritingStyle: {
        type: 'string',
        enum: [
          'professional', 'casual', 'funny', 'storytelling', 'conversational',
          'creative', 'technical', 'marketing', 'sales', 'personal', 'corporate', 'academic',
        ],
      },
      Language: {
        type: 'string',
        enum: ['fr', 'en'],
      },
      MimeType: {
        type: 'string',
        enum: [
          'audio/flac', 'audio/mp3', 'audio/mp4', 'audio/mpeg',
          'audio/mpga', 'audio/m4a', 'audio/ogg', 'audio/wav', 'audio/webm',
        ],
      },
      Preferences: {
        type: 'object',
        properties: {
          writing_style: { $ref: '#/components/schemas/WritingStyle' },
          language: { $ref: '#/components/schemas/Language' },
          role: { type: 'string', maxLength: 100 },
          industry: { type: 'string', maxLength: 100 },
          audience: { type: 'string', maxLength: 100 },
          goal: { type: 'string', maxLength: 200 },
        },
      },
      Recording: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          audio_url: { type: 'string' },
          transcript: { type: 'string' },
          language: { type: 'string' },
          duration: { type: 'integer' },
          status: { type: 'string', enum: ['processing', 'completed', 'failed'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          recording_id: { type: 'string', format: 'uuid', nullable: true },
          content: { type: 'string' },
          post_type: { type: 'string' },
          is_favorite: { type: 'boolean' },
          copied_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      GeneratePostRequest: {
        type: 'object',
        properties: {
          recordingId: { type: 'string', format: 'uuid', description: 'Either recordingId or transcript is required' },
          transcript: { type: 'string', minLength: 10, description: 'Either recordingId or transcript is required' },
          writingStyle: { $ref: '#/components/schemas/WritingStyle', default: 'professional' },
          language: { $ref: '#/components/schemas/Language' },
          authorContext: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              industry: { type: 'string' },
              audience: { type: 'string' },
              goal: { type: 'string' },
            },
          },
        },
      },
      UpdatePostRequest: {
        type: 'object',
        properties: {
          content: { type: 'string', minLength: 1 },
          is_favorite: { type: 'boolean' },
          copied: { type: 'boolean' },
        },
      },
      UpdateRecordingRequest: {
        type: 'object',
        properties: {
          transcript: { type: 'string' },
          language: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': { description: 'Server is healthy' },
        },
      },
    },
    '/preferences': {
      get: {
        tags: ['Preferences'],
        summary: 'Get user preferences',
        responses: {
          '200': {
            description: 'User preferences',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Preferences' } } },
          },
        },
      },
      patch: {
        tags: ['Preferences'],
        summary: 'Create or update user preferences',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Preferences' },
              example: {
                writing_style: 'storytelling',
                language: 'en',
                role: 'Founder',
                industry: 'SaaS',
                audience: 'Entrepreneurs',
                goal: 'Build authority',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated preferences',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Preferences' } } },
          },
        },
      },
    },
    '/recordings': {
      get: {
        tags: ['Recordings'],
        summary: 'List user recordings',
        responses: {
          '200': {
            description: 'List of recordings',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Recording' } },
              },
            },
          },
        },
      },
    },
    '/recordings/transcribe': {
      post: {
        tags: ['Recordings'],
        summary: 'Upload and transcribe an audio file',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: {
                  audio: { type: 'string', format: 'binary', description: 'Audio file (max 25MB)' },
                  language: { type: 'string', description: 'Language code (e.g. "en", "fr")' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Recording created with transcription',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Recording' } } },
          },
          '400': { description: 'No audio file provided' },
          '422': { description: 'Language detection failed' },
        },
      },
    },
    '/recordings/{recordingId}': {
      get: {
        tags: ['Recordings'],
        summary: 'Get a recording by ID',
        parameters: [
          { name: 'recordingId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Recording details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Recording' } } },
          },
          '404': { description: 'Recording not found' },
        },
      },
      patch: {
        tags: ['Recordings'],
        summary: 'Update a recording',
        parameters: [
          { name: 'recordingId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRecordingRequest' },
              example: { transcript: 'Updated transcript text', language: 'en' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated recording',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Recording' } } },
          },
        },
      },
      delete: {
        tags: ['Recordings'],
        summary: 'Delete a recording',
        parameters: [
          { name: 'recordingId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Recording deleted' },
        },
      },
    },
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'List user posts',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': {
            description: 'List of posts',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
              },
            },
          },
        },
      },
    },
    '/posts/generate': {
      post: {
        tags: ['Posts'],
        summary: 'Generate a LinkedIn post from recording or text',
        description: 'Returns a streamed response. Provide either recordingId or transcript.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GeneratePostRequest' },
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
        responses: {
          '200': {
            description: 'Streamed post generation (NDJSON)',
            content: { 'text/event-stream': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/posts/{postId}': {
      get: {
        tags: ['Posts'],
        summary: 'Get a post by ID',
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Post details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } },
          },
        },
      },
      patch: {
        tags: ['Posts'],
        summary: 'Update a post (content, favorite, copied)',
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePostRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated post',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Post' } } },
          },
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete a post',
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Post deleted' },
        },
      },
    },
  },
};

const router = Router();
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export { router as swaggerRouter, swaggerDocument };
