import { createOpenAI } from '@ai-sdk/openai';
import { streamText, ToolSet, type StreamTextResult } from 'ai';
import { LINKEDIN_POST_SYSTEM_PROMPT } from 'ai/assistant.ai';
import { userPrompt } from 'ai/script.ai';
import { Config } from 'config/env';
import type { GeneratePostInput } from 'schemas/post.schema';
import { DEFAULT_LLM_MODEL } from 'types/ai.types';

const openai = createOpenAI({ apiKey: Config.OPENAI_API_KEY });

export class PostService {
  static generateStream(params: GeneratePostInput): StreamTextResult<ToolSet, any> {
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
}
