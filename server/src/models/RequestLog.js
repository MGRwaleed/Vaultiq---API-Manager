import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true,
    },
    provider: { type: String, required: true },
    keyName:  { type: String, required: true }, // snapshot at time of request
    endpoint: { type: String, required: true },
    method:   { type: String, default: 'POST' },
    statusCode: { type: Number, required: true },
    latencyMs:  { type: Number, required: true },
    tokensUsed: { type: Number, default: null },
    costUsd:    { type: Number, default: null },
    errorMessage: { type: String, default: null },
    requestedAt:  { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound index for fast user+date queries
requestLogSchema.index({ user: 1, requestedAt: -1 });
requestLogSchema.index({ user: 1, provider: 1, requestedAt: -1 });

const RequestLog = mongoose.model('RequestLog', requestLogSchema);
export default RequestLog;