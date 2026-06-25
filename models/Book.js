const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, enum: ['science', 'technology', 'engineering', 'mathematics', 'social-science'], required: true },
  year: { type: Number },
  description: { type: String },
  cover: { type: String },
  pdfUrl: { type: String },
  downloads: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', BookSchema);
