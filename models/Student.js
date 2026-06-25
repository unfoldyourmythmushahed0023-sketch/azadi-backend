const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'student'
  },
  country: {
    type: String,
    required: true
  },
  educationalLevel: {
    type: String,
    enum: ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'],
    default: 'Bachelor\'s'
  },
  financialStatus: {
    type: String,
    enum: ['Full Scholarship Needed', 'Partial Scholarship Needed', 'Self-Funded'],
    default: 'Self-Funded'
  },
  fieldOfStudy: {
    type: String,
    default: ''
  },
  documents: {
    type: [String],
    default: []
  },
  applicationStatus: {
    type: String,
    enum: ['Not Applied', 'Applied', 'Under Review', 'Accepted', 'Rejected'],
    default: 'Not Applied'
  },
  appliedUniversities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Partnership',
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', StudentSchema);
