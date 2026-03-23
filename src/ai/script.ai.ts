import { WritingStyle } from 'types/enums';

export const userPrompt = (
  transcript: string,
  writingStyle: WritingStyle,
  language: string | undefined,
  authorContext?: {
    role?: string;
    industry?: string;
    audience?: string;
    goal?: string;
  },
) =>
  `
Writing style: ${writingStyle}
Language: ${language ? language : 'auto detect based on transcript'}
${
  authorContext
    ? `
Author context (preserve their voice, vocabulary, and expert positioning):
${authorContext.role ? `- Role: ${authorContext.role}` : ''}
${authorContext.industry ? `- Industry: ${authorContext.industry}` : ''}
${authorContext.audience ? `- Target audience: ${authorContext.audience}` : ''}
${authorContext.goal ? `- Post goal: ${authorContext.goal}` : ''}
`.trim()
    : 'You are a custom LinkedIn post writer, basing your writing on the transcript provided. '
}

Transcript:
"""
${transcript.slice(0, 8000)}
"""

CRITICAL: Preserve the author's technical vocabulary, industry jargon, and argumentation style.
The output must sound like a domain expert wrote it — not a generic AI tool.

Generate the LinkedIn post now.
`.trim();
