export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    costPerToken: {
      'gpt-4o':                 { input: 0.000005,   output: 0.000015   },
      'gpt-4o-mini':            { input: 0.00000015, output: 0.0000006  },
      'gpt-4-turbo':            { input: 0.00001,    output: 0.00003    },
      'gpt-3.5-turbo':          { input: 0.0000005,  output: 0.0000015  },
      'text-embedding-3-small': { input: 0.00000002, output: 0          },
      'text-embedding-3-large': { input: 0.00000013, output: 0          },
      default:                  { input: 0.000005,   output: 0.000015   },
    },
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    authHeader: 'x-api-key',
    authPrefix: '',
    costPerToken: {
      'claude-opus-4-5':   { input: 0.000015,   output: 0.000075   },
      'claude-sonnet-4-5': { input: 0.000003,   output: 0.000015   },
      'claude-haiku-4-5':  { input: 0.00000025, output: 0.00000125 },
      default:             { input: 0.000003,   output: 0.000015   },
    },
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    costPerToken: {
      'llama-3.3-70b-versatile': { input: 0.00000059, output: 0.00000079 },
      'llama-3.1-8b-instant':    { input: 0.00000005, output: 0.00000008 },
      'mixtral-8x7b-32768':      { input: 0.00000024, output: 0.00000024 },
      default:                   { input: 0.00000059, output: 0.00000079 },
    },
  },
  tavily: {
    name: 'Tavily',
    baseUrl: 'https://api.tavily.com',
    authHeader: 'Authorization',
    authPrefix: 'Bearer',
    costPerRequest: 0.001,
    costPerToken: { default: { input: 0, output: 0 } },
  },
  deepgram: {
    name: 'Deepgram',
    baseUrl: 'https://api.deepgram.com',
    authHeader: 'Authorization',
    authPrefix: 'Token',
    costPerMinute: 0.0059,
    costPerToken: { default: { input: 0, output: 0 } },
  },
  gemini: {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    authHeader: 'x-goog-api-key',
    authPrefix: '',
    costPerToken: {
      'gemini-1.5-pro':   { input: 0.000007,    output: 0.000021  },
      'gemini-1.5-flash': { input: 0.000000075, output: 0.0000003 },
      'gemini-2.0-flash': { input: 0.0000001,   output: 0.0000004 },
      default:            { input: 0.000007,    output: 0.000021  },
    },
  },
};

export const estimateCost = (providerKey, modelName, usage) => {
  const provider = PROVIDERS[providerKey];
  if (!provider || !usage) return 0;

  if (provider.costPerRequest) return provider.costPerRequest;

  const costs     = provider.costPerToken;
  const modelCost = costs[modelName] || costs.default;
  if (!modelCost) return 0;

  const inputTokens  = usage.input_tokens  || usage.prompt_tokens    || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens || 0;

  return (inputTokens * modelCost.input) + (outputTokens * modelCost.output);
};

export const extractTokens = (providerKey, responseData) => {
  if (!responseData) return null;
  if (responseData.usage?.total_tokens)          return responseData.usage.total_tokens;
  if (responseData.usage?.input_tokens) {
    return (responseData.usage.input_tokens || 0) + (responseData.usage.output_tokens || 0);
  }
  if (responseData.usageMetadata?.totalTokenCount) return responseData.usageMetadata.totalTokenCount;
  return null;
};

export const extractModel = (requestBody, responseData) => {
  return responseData?.model || requestBody?.model || null;
};