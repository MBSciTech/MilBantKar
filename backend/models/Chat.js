const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  parts: [{ text: { type: String, default: '' } }],
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

chatSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Chat', chatSchema);