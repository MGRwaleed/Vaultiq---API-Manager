import mongoose from 'mongoose';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

const encrypt = (text) => {
  const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text) => {
  const [ivHex, encryptedHex] = text.split(':');
  const key = crypto.scryptSync(process.env.JWT_SECRET, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString();
};

const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Key name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    provider: {
      type: String,
      required: [true, 'Provider is required'],
      trim: true,
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    keyPreview: {
      type: String, // e.g. "sk-...ab12" — stored for display
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      requests: { type: Number, default: null }, // null = unlimited
      costUsd:  { type: Number, default: null },
    },
    // Placeholder fields for Phase 3 (usage tracking)
    stats: {
      totalRequests: { type: Number, default: 0 },
      totalTokens:   { type: Number, default: 0 },
      estimatedCost: { type: Number, default: 0 },
      lastUsed:      { type: Date,   default: null },
    },
    notes: {
      type: String,
      maxlength: 200,
      default: '',
    },
  },
  { timestamps: true }
);

// Virtual: decrypt key on demand
apiKeySchema.methods.decryptKey = function () {
  return decrypt(this.encryptedKey);
};

// Static: create with encryption
apiKeySchema.statics.createKey = async function (userId, { name, provider, rawKey, notes }) {
  const keyPreview =
    rawKey.length > 8
      ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}`
      : '••••••••';
  const encryptedKey = encrypt(rawKey);
  return this.create({ user: userId, name, provider, encryptedKey, keyPreview, notes });
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
