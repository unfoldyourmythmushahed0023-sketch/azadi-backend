const express = require('express');
const cors = require('cors');
const path = require('path');
const { ObjectId } = require('mongodb');
const { connectDB, getDB, closeDB } = require('./config/database');
const emailService = require('./emailService');


const app = express();
const PORT = process.env.PORT || 5001;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================
// STATIC FILES
// ============================================================
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));
app.use(express.static('/Users/sofiamushahed/Desktop/Azadi'));

// ============================================================
// LOGGING
// ============================================================
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url}`);
    next();
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Azadi Backend is running!', 
        timestamp: new Date().toISOString() 
    });
});

// ============================================================
// REGISTRATION
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const db = getDB();
        const usersCollection = db.collection('users');
        const data = req.body;
        
        const existing = await usersCollection.findOne({ email: data.email });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }
        
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        
        const result = await usersCollection.insertOne(data);
        
        res.json({ 
            success: true, 
            user: { 
                id: result.insertedId, 
                ...data 
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN INCOMING DATA
// ============================================================
app.post('/api/admin/incoming', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('admin_incoming');
        const data = req.body;
        data.receivedAt = new Date().toISOString();
        
        await collection.insertOne(data);
        console.log('📤 Admin data stored:', data);
        
        res.json({ success: true, received: data });
    } catch (error) {
        console.error('Admin incoming error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// APPLICATIONS - POST
// ============================================================
app.post('/api/applications', async (req, res) => {
    try {
        const db = getDB();
        const collection = db.collection('applications');
        const data = req.body;
        data.submittedAt = new Date().toISOString();
        data.status = 'pending';
        
        const result = await collection.insertOne(data);
        
        console.log('📄 Application stored:', data);
        
        res.json({ 
            success: true, 
            applicationId: 'APP-' + Date.now(),
            data: { _id: result.insertedId, ...data }
        });
    } catch (error) {
        console.error('Application error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// APPLICATIONS - GET ALL
// ============================================================
app.get('/api/applications', async (req, res) => {
    try {
        const db = getDB();
        const applications = await db.collection('applications').find({}).toArray();
        res.json({ success: true, applications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN APPLICATIONS - GET ALL
// ============================================================
app.get('/api/admin/applications', async (req, res) => {
    try {
        const db = getDB();
        const applications = await db.collection('applications').find({}).toArray();
        res.json({ success: true, applications });
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN APPLICATIONS - ACCEPT
// ============================================================
app.put('/api/admin/applications/:id/accept', async (req, res) => {
    try {
        const db = getDB();
        const id = req.params.id;
        let objectId;
        
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            // If not a valid ObjectId, try to find by string id
            const result = await db.collection('applications').updateOne(
                { _id: id },
                { $set: { status: 'accepted', reviewedAt: new Date().toISOString() } }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            return res.json({ success: true });
        }
        
        const result = await db.collection('applications').updateOne(
            { _id: objectId },
            { $set: { status: 'accepted', reviewedAt: new Date().toISOString() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error accepting application:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN APPLICATIONS - REJECT
// ============================================================
app.put('/api/admin/applications/:id/reject', async (req, res) => {
    try {
        const db = getDB();
        const id = req.params.id;
        let objectId;
        
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            const result = await db.collection('applications').updateOne(
                { _id: id },
                { $set: { status: 'rejected', reviewedAt: new Date().toISOString() } }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Application not found' });
            }
            return res.json({ success: true });
        }
        
        const result = await db.collection('applications').updateOne(
            { _id: objectId },
            { $set: { status: 'rejected', reviewedAt: new Date().toISOString() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// APPLICATIONS - GET BY UNIVERSITY
// ============================================================
app.get('/api/applications/university/:universityId', async (req, res) => {
    try {
        const db = getDB();
        const universityId = req.params.universityId;
        const applications = await db.collection('applications')
            .find({ selectedUniversities: universityId })
            .toArray();
        res.json({ success: true, applications });
    } catch (error) {
        console.error('Error fetching university applications:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN USERS
// ============================================================
app.get('/api/admin/users', async (req, res) => {
    try {
        const db = getDB();
        const users = await db.collection('users').find({}).toArray();
        res.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN ANALYTICS
// ============================================================
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const db = getDB();
        const totalUsers = await db.collection('users').countDocuments();
        const totalApplications = await db.collection('applications').countDocuments();
        const totalPayments = await db.collection('payments').countDocuments();
        
        res.json({ 
            totalUsers, 
            totalApplications,
            totalPayments,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN UNIVERSITIES
// ============================================================
app.get('/api/admin/universities', async (req, res) => {
    try {
        const db = getDB();
        const universities = await db.collection('users')
            .find({ role: 'university' })
            .toArray();
        res.json({ universities });
    } catch (error) {
        console.error('Error fetching universities:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN PAYMENTS - GET ALL
// ============================================================
app.get('/api/admin/payments', async (req, res) => {
    try {
        const db = getDB();
        const payments = await db.collection('payments').find({}).toArray();
        res.json({ success: true, payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN PAYMENTS - VERIFY
// ============================================================
app.put('/api/admin/payments/:id/verify', async (req, res) => {
    try {
        const db = getDB();
        const id = req.params.id;
        let objectId;
        
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            const result = await db.collection('payments').updateOne(
                { _id: id },
                { $set: { status: 'verified', verifiedAt: new Date().toISOString() } }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Payment not found' });
            }
            return res.json({ success: true });
        }
        
        const result = await db.collection('payments').updateOne(
            { _id: objectId },
            { $set: { status: 'verified', verifiedAt: new Date().toISOString() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN PAYMENTS - CREATE
// ============================================================
app.post('/api/admin/payments', async (req, res) => {
    try {
        const db = getDB();
        const data = req.body;
        data.createdAt = new Date().toISOString();
        data.status = data.status || 'pending';
        
        const result = await db.collection('payments').insertOne(data);
        
        res.json({ 
            success: true, 
            payment: { _id: result.insertedId, ...data }
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// PAYMENTS - GET ALL (Alternative endpoint)
// ============================================================
app.get('/api/payments', async (req, res) => {
    try {
        const db = getDB();
        const payments = await db.collection('payments').find({}).toArray();
        res.json({ success: true, payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// PAYMENTS - VERIFY (Alternative endpoint)
// ============================================================
app.put('/api/payments/:id/verify', async (req, res) => {
    try {
        const db = getDB();
        const id = req.params.id;
        let objectId;
        
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            const result = await db.collection('payments').updateOne(
                { _id: id },
                { $set: { status: 'verified', verifiedAt: new Date().toISOString() } }
            );
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: 'Payment not found' });
            }
            return res.json({ success: true });
        }
        
        const result = await db.collection('payments').updateOne(
            { _id: objectId },
            { $set: { status: 'verified', verifiedAt: new Date().toISOString() } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN INTERVIEWS
// ============================================================
app.get('/api/admin/interviews', async (req, res) => {
    try {
        const db = getDB();
        const interviews = await db.collection('interviews').find({}).toArray();
        res.json({ success: true, interviews });
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// INTERVIEWS - LIST
// ============================================================
app.get('/api/interviews/list', async (req, res) => {
    try {
        const db = getDB();
        const interviews = await db.collection('interviews').find({}).toArray();
        res.json({ success: true, interviews });
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// INTERVIEWS - SCHEDULE
// ============================================================
app.post('/api/interviews/schedule', async (req, res) => {
    try {
        const db = getDB();
        const data = req.body;
        data.createdAt = new Date().toISOString();
        data.status = data.status || 'scheduled';
        
        const result = await db.collection('interviews').insertOne(data);
        
        console.log('📅 Interview scheduled:', data);
        
        res.json({ 
            success: true, 
            interview: { _id: result.insertedId, ...data }
        });
    } catch (error) {
        console.error('Error scheduling interview:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// INTERVIEWS - CANCEL
// ============================================================
app.delete('/api/interviews/cancel/:id', async (req, res) => {
    try {
        const db = getDB();
        const id = req.params.id;
        let objectId;
        
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            const result = await db.collection('interviews').deleteOne({ _id: id });
            if (result.deletedCount === 0) {
                return res.status(404).json({ success: false, message: 'Interview not found' });
            }
            return res.json({ success: true });
        }
        
        const result = await db.collection('interviews').deleteOne({ _id: objectId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Interview not found' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error cancelling interview:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// ADMIN UNIVERSITY - CREATE
// ============================================================
app.post('/api/admin/university/create', async (req, res) => {
    try {
        const db = getDB();
        const { university, adminEmail, adminPassword, country } = req.body;
        
        if (!university || !adminEmail || !adminPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'University name, admin email, and password are required' 
            });
        }
        
        const existing = await db.collection('users').findOne({ email: adminEmail });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: 'Admin email already exists' 
            });
        }
        
        const userData = {
            name: university,
            email: adminEmail,
            password: adminPassword,
            role: 'university',
            country: country || 'Not specified',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const result = await db.collection('users').insertOne(userData);
        
        res.json({ 
            success: true, 
            user: { _id: result.insertedId, ...userData }
        });
    } catch (error) {
        console.error('Error creating university:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// SCHOLAR PROFILE - GET
// ============================================================
app.get('/api/scholar/profile/:email', async (req, res) => {
    try {
        const db = getDB();
        const email = req.params.email;
        const user = await db.collection('users').findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            profile: user 
        });
    } catch (error) {
        console.error('Error fetching scholar profile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// SCHOLAR PROFILE - CREATE/UPDATE
// ============================================================
app.post('/api/scholar/profile', async (req, res) => {
    try {
        const db = getDB();
        const data = req.body;
        const email = data.user_email || data.email;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
        
        const existing = await db.collection('users').findOne({ email: email });
        
        if (existing) {
            // Update existing
            await db.collection('users').updateOne(
                { email: email },
                { $set: { 
                    ...data, 
                    updatedAt: new Date().toISOString() 
                } }
            );
            res.json({ 
                success: true, 
                message: 'Profile updated successfully',
                profile_id: existing._id
            });
        } else {
            // Create new
            data.createdAt = new Date().toISOString();
            data.updatedAt = new Date().toISOString();
            data.role = data.role || 'student';
            
            const result = await db.collection('users').insertOne(data);
            res.json({ 
                success: true, 
                message: 'Profile created successfully',
                profile_id: result.insertedId
            });
        }
    } catch (error) {
        console.error('Error saving scholar profile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// SCHOLAR BY EMAIL - GET STUDENT ID
// ============================================================
app.get('/api/scholar/by-email/:email', async (req, res) => {
    try {
        const db = getDB();
        const email = req.params.email;
        const user = await db.collection('users').findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }
        
        res.json({ 
            success: true, 
            studentId: user._id || user.id 
        });
    } catch (error) {
        console.error('Error finding student by email:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// SCHOLAR STATUS - UPDATE
// ============================================================
app.put('/api/scholar/status', async (req, res) => {
    try {
        const db = getDB();
        const { email, status } = req.body;
        
        if (!email || !status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and status are required' 
            });
        }
        
        const result = await db.collection('users').updateOne(
            { email: email },
            { $set: { 
                status: status,
                updatedAt: new Date().toISOString() 
            } }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Status updated successfully' 
        });
    } catch (error) {
        console.error('Error updating scholar status:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// UNIVERSITY PROFILES - GET STUDENTS
// ============================================================
app.get('/api/university/profiles/:university', async (req, res) => {
    try {
        const db = getDB();
        const university = req.params.university;
        
        const students = await db.collection('users')
            .find({ 
                role: 'student',
                selectedUniversity: university 
            })
            .toArray();
        
        res.json({ 
            success: true, 
            profiles: students 
        });
    } catch (error) {
        console.error('Error fetching university profiles:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// ============================================================
// PDF GENERATION - STUDENT (Placeholder)
// ============================================================
app.get('/api/pdf/student/:studentId', async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const universityId = req.query.universityId;
        
        if (!universityId) {
            return res.status(400).json({ 
                success: false, 
                error: 'University ID is required' 
            });
        }
        
        // Get student data
        const db = getDB();
        let student;
        let objectId;
        
        try {
            objectId = new ObjectId(studentId);
            student = await db.collection('users').findOne({ _id: objectId });
        } catch (e) {
            student = await db.collection('users').findOne({ studentId: studentId });
        }
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                error: 'Student not found' 
            });
        }
        
        // Verify university
        const selectedUni = student.selectedUniversity;
        if (selectedUni && selectedUni !== universityId) {
            return res.status(403).json({ 
                success: false, 
                error: 'Student did not select this university' 
            });
        }
        
        // For now, return a simple JSON response until iText is set up
        res.json({ 
            success: true, 
            message: 'PDF generation will be available with iText integration',
            student: {
                name: student.full_name || student.name || 'N/A',
                email: student.email || 'N/A',
                country: student.country || 'N/A',
                university: student.selectedUniversity || 'N/A'
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// BATCH PDF GENERATION (Placeholder)
// ============================================================
app.post('/api/pdf/students/batch', async (req, res) => {
    try {
        const { studentIds, universityId } = req.body;
        
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No student IDs provided' 
            });
        }
        
        if (!universityId) {
            return res.status(400).json({ 
                success: false, 
                error: 'University ID is required' 
            });
        }
        
        res.json({ 
            success: true, 
            message: `Batch PDF generation for ${studentIds.length} students will be available with iText integration`,
            count: studentIds.length
        });
    } catch (error) {
        console.error('Batch PDF error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// SEND UNIVERSITY CONFIRMATION EMAIL (Placeholder)
// ============================================================
app.post('/api/send-university-confirmation', async (req, res) => {
    try {
        const { email, name, contactPerson, universityId, loginUrl } = req.body;
        
        console.log('📧 University confirmation email would be sent to:', email);
        console.log('   Name:', name);
        console.log('   Contact Person:', contactPerson);
        console.log('   University ID:', universityId);
        console.log('   Login URL:', loginUrl);
        
        res.json({ 
            success: true, 
            message: 'Confirmation email sent successfully' 
        });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post('/api/send-verification', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        console.log('Sending verification to:', email);
        const code = await emailService.sendVerificationEmail(email, name);
        res.json({ success: true, message: 'Verification code sent', code: code });
    } catch (error) {
        console.error('Send verification error:', error);
        res.status(500).json({ success: false, message: 'Failed to send verification email', error: error.message });
    }
});

app.post('/api/verify-code', (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: 'Email and code required' });
        }
        const result = emailService.verifyCode(email, code);
        if (result.valid) {
            console.log('Email verified:', email);
            res.json({ success: true, message: 'Email verified successfully' });
        } else {
            res.status(400).json({ success: false, message: result.error });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ============================================================
// START SERVER
// ============================================================
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log('============================================================');
            console.log(`✅ Azadi Backend running on http://localhost:${PORT}`);
            console.log(`📡 Health: http://localhost:${PORT}/api/health`);
            console.log(`📁 Serving files from: ${__dirname}`);
            console.log(`📁 Also serving from: /Users/sofiamushahed/Desktop/Azadi`);
            console.log('============================================================');
            console.log('📋 Available endpoints:');
            console.log('   POST   /api/auth/register');
            console.log('   POST   /api/applications');
            console.log('   GET    /api/applications');
            console.log('   GET    /api/admin/users');
            console.log('   GET    /api/admin/payments');
            console.log('   PUT    /api/admin/payments/:id/verify');
            console.log('   GET    /api/admin/applications');
            console.log('   PUT    /api/admin/applications/:id/accept');
            console.log('   PUT    /api/admin/applications/:id/reject');
            console.log('   GET    /api/admin/interviews');
            console.log('   POST   /api/interviews/schedule');
            console.log('   DELETE /api/interviews/cancel/:id');
            console.log('   GET    /api/admin/universities');
            console.log('   POST   /api/admin/university/create');
            console.log('============================================================');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGINT', () => {
    closeDB();
    process.exit(0);
});

process.on('SIGTERM', () => {
    closeDB();
    process.exit(0);
});
