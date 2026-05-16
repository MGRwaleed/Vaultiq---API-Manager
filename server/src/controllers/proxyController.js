import axios from 'axios';
import ApiKey from '../models/ApiKey.js';
import RequestLog from '../models/RequestLog.js';
import { PROVIDERS, estimateCost, extractTokens, extractModel } from '../config/providers.js';

export const proxyRequest = async (req, res) => {
  const providerKey = req.params.provider?.toLowerCase();
  const provider    = PROVIDERS[providerKey];

  if (!provider) {
    return res.status(400).json({
      success: false,
      message: `Unsupported provider "${providerKey}". Supported: ${Object.keys(PROVIDERS).join(', ')}`,
    });
  }

  const keyId = req.headers['x-api-key-id'] || req.body?._keyId;
  if (!keyId) {
    return res.status(400).json({
      success: false,
      message: 'Missing x-api-key-id header. Pass the ID of the key to use for this request.',
    });
  }

  const apiKeyDoc = await ApiKey.findOne({ _id: keyId, user: req.user._id });
  if (!apiKeyDoc) {
    return res.status(404).json({ success: false, message: 'API key not found or does not belong to you.' });
  }
  if (!apiKeyDoc.isActive) {
    return res.status(403).json({ success: false, message: 'This API key is inactive. Enable it first.' });
  }

  const upstreamPath = '/' + (req.params[0] || '');
  const upstreamUrl  = `${provider.baseUrl}${upstreamPath}`;
  const rawKey       = apiKeyDoc.decryptKey();
  const authValue    = provider.authPrefix ? `${provider.authPrefix} ${rawKey}` : rawKey;

  const forwardBody = { ...req.body };
  delete forwardBody._keyId;

  const forwardHeaders = { ...req.headers };
  delete forwardHeaders['host'];
  delete forwardHeaders['content-length'];
  delete forwardHeaders['x-api-key-id'];
  forwardHeaders[provider.authHeader] = authValue;

  if (providerKey === 'anthropic') {
    forwardHeaders['anthropic-version'] = forwardHeaders['anthropic-version'] || '2023-06-01';
  }

  const startTime  = Date.now();
  let statusCode   = 500;
  let responseData = null;
  let errorMessage = null;

  try {
    const upstream = await axios({
      method: req.method,
      url: upstreamUrl,
      headers: forwardHeaders,
      data: Object.keys(forwardBody).length > 0 ? forwardBody : undefined,
      params: req.query,
      timeout: 60000,
      validateStatus: () => true,
    });

    statusCode   = upstream.status;
    responseData = upstream.data;

    res.status(statusCode).json(responseData);

  } catch (err) {
    statusCode   = 503;
    errorMessage = err.message || 'Upstream request failed';
    res.status(503).json({ success: false, message: errorMessage });

  } finally {
    const latencyMs = Date.now() - startTime;
    const model     = extractModel(forwardBody, responseData);
    const tokens    = extractTokens(providerKey, responseData);
    const cost      = estimateCost(providerKey, model, responseData?.usage || responseData?.usageMetadata);

    RequestLog.create({
      user:         req.user._id,
      apiKey:       apiKeyDoc._id,
      provider:     provider.name,
      keyName:      apiKeyDoc.name,
      endpoint:     upstreamPath,
      method:       req.method,
      statusCode,
      latencyMs,
      tokensUsed:   tokens,
      costUsd:      cost || null,
      errorMessage: statusCode >= 400 ? (errorMessage || `HTTP ${statusCode}`) : null,
      requestedAt:  new Date(),
    }).catch(e => console.error('Failed to write request log:', e.message));

    if (statusCode < 400) {
      ApiKey.findByIdAndUpdate(apiKeyDoc._id, {
        $inc: {
          'stats.totalRequests': 1,
          'stats.totalTokens':   tokens || 0,
          'stats.estimatedCost': cost   || 0,
        },
        $set: { 'stats.lastUsed': new Date() },
      }).catch(() => {});
    }
  }
};