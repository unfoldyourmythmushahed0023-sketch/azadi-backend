const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  universities: [{
    universityId: { type: String },
    universityName: { type: String },
    universityCountry: { type: String },
    status: {
      type: String,
      enum: ['pending', 'under-review', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    country: String,
    city: String
  },
  academicInfo: {
    previousEducation: String,
    fieldOfStudy: String,
    motivation: String,
    extracurricular: String,
    financialConsiderations: String,
    futurePlans: String
  },
  references: [{
    name: String,
    email: String,
    relationship: String
  }],
  personalStatements: [String],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'accepted', 'rejected'],
    default: 'draft'
  },
  applicationId: {
    type: String,
    unique: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Application', ApplicationSchema);
