import { BillingType, OpenAiModel } from '../types/ai.types';

const MODEL_COSTS: Record<
  OpenAiModel,
  { billingType: BillingType; input: number; output: number }
> = {
  [OpenAiModel.Gpt5Nano]: { billingType: BillingType.TOKEN, input: 0.00005, output: 0.0004 },
  [OpenAiModel.Gpt5Mini]: { billingType: BillingType.TOKEN, input: 0.00025, output: 0.002 },
  [OpenAiModel.Whisper1]: { billingType: BillingType.MINUTE, input: 0.006, output: 0 },
};

export const getCost = (
  model: OpenAiModel,
  promptTokens: number,
  completionTokens: number,
): number => {
  const costPerThousandTokens = MODEL_COSTS[model];

  if (!costPerThousandTokens) {
    throw new Error(`Unsupported model: ${model}`);
  }

  return (
    (promptTokens / 1000) * costPerThousandTokens.input +
    (completionTokens / 1000) * costPerThousandTokens.output
  );
};
