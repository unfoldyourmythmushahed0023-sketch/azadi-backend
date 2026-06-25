const mongoose = require('mongoose');

const PartnershipSchema = new mongoose.Schema({
  universityName: { type: String, required: true },
  universityCountry: { type: String, required: true },
  universityEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tier: { type: String, enum: ['platinum', 'gold', 'silver', 'bronze'], default: 'silver' },
  annualFee: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Partnership', PartnershipSchema);
