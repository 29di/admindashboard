const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // For standard user registrations (DIDs)
  did: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple nulls for admin accounts
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Critical for did analytics sorting
  },
  
  // For Admin login credentials
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
});

// Hash password before saving if it is an admin
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
