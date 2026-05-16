import ApiKey from '../models/ApiKey.js';

// @desc    Get all API keys for logged-in user
// @route   GET /api/keys
// @access  Private
export const getKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch keys.' });
  }
};

// @desc    Add a new API key
// @route   POST /api/keys
// @access  Private
export const addKey = async (req, res) => {
  try {
    const { name, provider, rawKey, notes } = req.body;

    if (!name || !provider || !rawKey) {
      return res.status(400).json({ success: false, message: 'Name, provider, and key are required.' });
    }

    // Prevent duplicate key names per user
    const existing = await ApiKey.findOne({ user: req.user._id, name });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a key with this name.' });
    }

    const key = await ApiKey.createKey(req.user._id, { name, provider, rawKey, notes });
    res.status(201).json({ success: true, message: 'API key added successfully.', data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add key.' });
  }
};

// @desc    Reveal decrypted key (for eye button)
// @route   GET /api/keys/:id/reveal
// @access  Private
export const revealKey = async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
    if (!key) return res.status(404).json({ success: false, message: 'Key not found.' });

    const decrypted = key.decryptKey();
    res.json({ success: true, data: { key: decrypted } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reveal key.' });
  }
};

// @desc    Toggle key active/inactive
// @route   PATCH /api/keys/:id/toggle
// @access  Private
export const toggleKey = async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
    if (!key) return res.status(404).json({ success: false, message: 'Key not found.' });

    key.isActive = !key.isActive;
    await key.save();
    res.json({ success: true, message: `Key ${key.isActive ? 'activated' : 'deactivated'}.`, data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle key.' });
  }
};

// @desc    Update key name / notes / limits
// @route   PATCH /api/keys/:id
// @access  Private
export const updateKey = async (req, res) => {
  try {
    const { name, notes, usageLimit } = req.body;
    const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });
    if (!key) return res.status(404).json({ success: false, message: 'Key not found.' });

    if (name) key.name = name;
    if (notes !== undefined) key.notes = notes;
    if (usageLimit) key.usageLimit = { ...key.usageLimit, ...usageLimit };

    await key.save();
    res.json({ success: true, message: 'Key updated.', data: key });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update key.' });
  }
};

// @desc    Delete a key
// @route   DELETE /api/keys/:id
// @access  Private
export const deleteKey = async (req, res) => {
  try {
    const key = await ApiKey.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!key) return res.status(404).json({ success: false, message: 'Key not found.' });

    res.json({ success: true, message: 'Key deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete key.' });
  }
};
