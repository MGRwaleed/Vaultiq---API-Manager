import User from '../models/User.js';
import ApiKey from '../models/ApiKey.js';
import bcrypt from 'bcryptjs';

// @desc  Update profile (name, email)
// @route PATCH /api/settings/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name && !email) {
      return res.status(400).json({ success: false, message: 'Nothing to update.' });
    }

    // Check email not taken by another user
    if (email && email !== req.user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }
    }

    const updates = {};
    if (name)  updates.name  = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// @desc  Change password
// @route PATCH /api/settings/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// @desc  Get integration info (token + key IDs)
// @route GET /api/settings/integration
export const getIntegrationInfo = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id }).select('name provider keyPreview isActive createdAt');
    res.json({ success: true, data: { keys } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch integration info.' });
  }
};

// @desc  Delete account
// @route DELETE /api/settings/account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password required to delete account.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      ApiKey.deleteMany({ user: req.user._id }),
    ]);

    res.json({ success: true, message: 'Account deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};