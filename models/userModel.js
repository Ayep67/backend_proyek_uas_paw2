const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nama: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  noTelp: { type: String, trim: true, default: '' },
  alamat: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);