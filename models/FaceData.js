const mongoose = require('mongoose');

const FaceDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  faceEmbedding: {
    type: [Number],
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastVerified: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('FaceData', FaceDataSchema);
