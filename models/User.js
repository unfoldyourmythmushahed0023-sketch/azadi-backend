const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  country: String,
  countryCode: String,
  gdpPerCapita: { type: Number, default: 0 },
  emailVerified: { type: Boolean, default: false },
  verificationCode: String,
  isAdmin: { type: Boolean, default: false },
  applicationCount: { type: Number, default: 0, max: 12 },
  faceIdEnabled: { type: Boolean, default: false }
}, { timestamps: true });

// SIMPLE PRE-SAVE HOOK - NO next() ISSUES
UserSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) return next();
  bcrypt.hash(user.password, 10, function(err, hash) {
    if (err) return next(err);
    user.password = hash;
    next();
  });
});

UserSchema.methods.comparePassword = function(candidate, cb) {
  bcrypt.compare(candidate, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);
