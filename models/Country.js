const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  gdpPerCapita: {
    type: Number,
    required: true
  },
  continent: {
    type: String
  },
  baseFee: {
    type: Number,
    default: 75
  },
  discountRate: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Country', CountrySchema);
