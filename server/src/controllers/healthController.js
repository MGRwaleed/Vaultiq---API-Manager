import axios from 'axios';
import ApiKey from '../models/ApiKey.js';
import { PROVIDERS } from '../config/providers.js';

// Minimal ping payloads per provider — cheapest possible request
const PING_CONFIG = {
  openai: {
    url: '/v1/chat/completions',
    method: 'POST',
    data: { model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
  },
  anthropic: {
    url: '/v1/messages',
    method: 'POST',
    data: { model: 'claude-haiku-4-5', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
  },
  groq: {
    url: '/openai/v1/chat/completions',
    method: 'POST',
    data: { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
  },
  tavily: {
    url: '/search',
    method: 'POST',
    data: { query: 'test', max_results: 1 },
  },
  deepgram: {
    url: '/v1/projects',
    method: 'GET',
    data: null,
  },
  gemini: {
    url: '/v1beta/models/gemini-2.0-flash:generateContent',
    method: 'POST',
    data: { contents: [{ parts: [{ text: 'hi' }] }] },
  },
  deepseek: {
    url: '/chat/completions',
    method: 'POST',
    data: { model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
  },
};

const checkKey = async (keyDoc) => {
  const providerKey = keyDoc.provider.toLowerCase();
  const provider    = PROVIDERS[providerKey];
  const ping        = PING_CONFIG[providerKey];

  if (!provider || !ping) {
    return { status: 'unknown', message: 'Provider not supported for health checks', latencyMs: null };
  }

  const rawKey    = keyDoc.decryptKey();
  const authValue = provider.authPrefix ? `${provider.authPrefix} ${rawKey}` : rawKey;
  const headers   = {
    'Content-Type': 'application/json',
    [provider.authHeader]: authValue,
  };

  if (providerKey === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }

  const start = Date.now();
  try {
    const res = await axios({
      method:         ping.method,
      url:            `${provider.baseUrl}${ping.url}`,
      headers,
      data:           ping.data || undefined,
      timeout:        10000,
      validateStatus: () => true,
    });

    const latencyMs = Date.now() - start;
    const status    = res.status;

    // 401/403 = invalid key, 429 = rate limited (key is valid!), 2xx = healthy
    if (status === 401 || status === 403) {
      return { status: 'invalid', message: 'Authentication failed — key is invalid or expired', latencyMs };
    }
    if (status === 429) {
      return { status: 'healthy', message: 'Rate limited but key is valid', latencyMs };
    }
    if (status === 402) {
      return { status: 'invalid', message: 'Insufficient balance', latencyMs };
    }
    if (status >= 200 && status < 500) {
      return { status: 'healthy', message: 'Key is valid and working', latencyMs };
    }

    return { status: 'error', message: `Provider returned ${status}`, latencyMs };

  } catch (err) {
    const latencyMs = Date.now() - start;
    if (err.code === 'ECONNABORTED') {
      return { status: 'error', message: 'Request timed out', latencyMs };
    }
    return { status: 'error', message: err.message || 'Request failed', latencyMs };
  }
};

// @desc  Check health of a single key
// @route POST /api/health/check/:id
export const checkSingleKey = async (req, res) => {
  try {
    const keyDoc = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
    if (!keyDoc) return res.status(404).json({ success: false, message: 'Key not found.' });

    const result = await checkKey(keyDoc);
    res.json({ success: true, data: { keyId: keyDoc._id, name: keyDoc.name, provider: keyDoc.provider, ...result } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Health check failed.' });
  }
};

// @desc  Check health of all keys for the user
// @route POST /api/health/check-all
export const checkAllKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id });
    if (!keys.length) return res.json({ success: true, data: [] });

    // Run all checks in parallel
    const results = await Promise.all(
      keys.map(async keyDoc => {
        const result = await checkKey(keyDoc);
        return {
          keyId:    keyDoc._id,
          name:     keyDoc.name,
          provider: keyDoc.provider,
          isActive: keyDoc.isActive,
          lastUsed: keyDoc.stats?.lastUsed || null,
          ...result,
        };
      })
    );

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Health check failed.' });
  }
};