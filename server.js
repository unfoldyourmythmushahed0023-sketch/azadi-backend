const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Partnership = require('./models/Partnership');
const Student = require('./models/Student');
const Application = require('./models/Application');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/azadi')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// ============================================================
// PARTNER ROUTES
// ============================================================

app.post('/api/partner/register', async (req, res) => {
  try {
    const { universityName, universityCountry, universityEmail, password, tier, annualFee } = req.body;
    const existing = await Partnership.findOne({ universityEmail });
    if (existing) return res.status(400).json({ message: 'University already registered' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const partnership = new Partnership({
      universityName,
      universityCountry,
      universityEmail,
      password: hashedPassword,
      tier,
      annualFee,
      status: 'pending'
    });
    await partnership.save();
    res.json({ success: true, message: 'Registration successful! Awaiting approval.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/partner/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const partnership = await Partnership.findOne({ universityEmail: email });
    if (!partnership) return res.status(401).json({ message: 'Invalid credentials' });
    if (partnership.status !== 'active') return res.status(403).json({ message: 'Your partnership is not active. Please contact Azadi.' });
    const match = await bcrypt.compare(password, partnership.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: partnership._id, email: partnership.universityEmail, role: 'partner' },
      process.env.JWT_SECRET || 'azadi_secret_key',
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, partnership: { id: partnership._id, name: partnership.universityName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/partnerships', async (req, res) => {
  try {
    const partnerships = await Partnership.find({});
    res.json({ success: true, partnerships });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// STUDENT ROUTES
// ============================================================

app.post('/api/student/register', async (req, res) => {
  try {
    const { fullName, email, password, country, educationalLevel, financialStatus, fieldOfStudy } = req.body;
    const existing = await Student.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Student already registered' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const student = new Student({
      fullName,
      email,
      password: hashedPassword,
      role: 'student',
      country,
      educationalLevel: educationalLevel || "Bachelor's",
      financialStatus: financialStatus || 'Self-Funded',
      fieldOfStudy: fieldOfStudy || ''
    });
    await student.save();
    res.json({ success: true, message: 'Student registration successful!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET || 'azadi_secret_key',
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, student: { id: student._id, name: student.fullName, role: student.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find({});
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// APPLICATION ROUTES
// ============================================================

app.post('/api/applications', async (req, res) => {
  try {
    const { personalInfo, academicInfo, selectedUniversities, references, personalStatements, status } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    let studentId, studentEmail, studentName;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'azadi_secret_key');
      studentId = decoded.id;
      studentEmail = decoded.email;
      const student = await Student.findById(studentId);
      if (student) studentName = student.fullName;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    const appId = 'AZ-' + Date.now().toString().slice(-8);
    const universities = selectedUniversities.map(uni => ({
      universityId: uni.id,
      universityName: uni.name,
      universityCountry: uni.country,
      status: 'pending'
    }));
    const application = new Application({
      studentId,
      studentEmail,
      studentName: studentName || personalInfo.fullName,
      universities,
      personalInfo,
      academicInfo,
      references,
      personalStatements,
      status: status || 'submitted',
      applicationId: appId,
      submittedAt: new Date()
    });
    await application.save();
    res.json({
      success: true,
      message: 'Application submitted successfully!',
      data: { applicationId: appId, _id: application._id, universities: universities.map(u => u.universityName) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/applications/my', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'azadi_secret_key');
    const applications = await Application.find({ studentId: decoded.id });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/applications/university/:universityName', async (req, res) => {
  try {
    const { universityName } = req.params;
    const applications = await Application.find({ 'universities.universityName': universityName });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { universityName, status } = req.body;
    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    const uni = application.universities.find(u => u.universityName === universityName);
    if (uni) {
      uni.status = status;
      await application.save();
    }
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

app.put('/api/partnerships/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✅ Approving university:', id);
    const partnership = await Partnership.findByIdAndUpdate(
      id,
      { status: 'active', approved: true },
      { new: true }
    );
    if (!partnership) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }
    res.json({ success: true, message: 'University approved successfully!', partnership });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/partnerships/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('❌ Rejecting university:', id);
    const partnership = await Partnership.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );
    if (!partnership) {
      return res.status(404).json({ success: false, message: 'University not found' });
    }
    res.json({ success: true, message: 'University rejected.', partnership });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/partnerships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting university:', id);
    await Partnership.findByIdAndDelete(id);
    res.json({ success: true, message: 'University deleted successfully!' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Partner API: http://localhost:${PORT}/api/partner`);
  console.log(`🎓 Student API: http://localhost:${PORT}/api/student`);
  console.log(`📝 Application API: http://localhost:${PORT}/api/applications`);
  console.log(`👑 Admin API: http://localhost:${PORT}/api/partnerships`);
});
