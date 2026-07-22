require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ============================================================
// ✅ CONFIGURATION
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

// Stripe (disabled for now)
const stripe = null;
console.log('⚠️ Stripe is disabled (no valid API key)');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));  
// ============================================================
// 📁 DATA STORE
// ============================================================
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        users: [],
        payments: [],
        interviews: [],
        universityAdmins: [],
        analytics: {
            totalUsers: 0,
            totalPayments: 0,
            totalInterviews: 0,
            registrationsByCountry: {},
            paymentsByMethod: { stripe: 0, paypal: 0, bank: 0, waived: 0 }
        }
    }, null, 2));
}

// Helper to read/write data
function readData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return { users: [], payments: [], interviews: [], universityAdmins: [], analytics: {} };
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper for country-based fees
function getFeeByCountry(country) {
    const fees = {
        'AF': 0, 'PK': 30, 'BD': 30, 'NG': 30,
        'TJ': 25, 'IR': 25, 'IN': 75,
        'US': 300, 'GB': 260, 'CA': 250,
        'AU': 270, 'DE': 230, 'FR': 220
    };
    return fees[country] || 150;
}

// ============================================================
// 📝 USER REGISTRATION ROUTE
// ============================================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const userData = req.body;
        
        const required = ['fullName', 'username', 'email', 'password', 'country'];
        for (const field of required) {
            if (!userData[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }
        
        const data = readData();
        const existingUser = data.users.find(u => u.email === userData.email);
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        
        const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            ...userData,
            payment: {
                method: userData.paymentMethod || 'pending',
                amount: userData.paymentAmount || getFeeByCountry(userData.country),
                status: userData.paymentStatus || 'pending',
                timestamp: new Date().toISOString()
            },
            interview: userData.interviewType ? {
                type: userData.interviewType,
                date: userData.interviewDate || null,
                time: userData.interviewTime || null,
                timezone: userData.timezone || 'AFT',
                status: 'scheduled'
            } : null,
            securityQuestions: {
                q1: userData.securityQuestion1 || '',
                a1: userData.securityAnswer1 || '',
                q2: userData.securityQuestion2 || '',
                a2: userData.securityAnswer2 || '',
                q3: userData.securityQuestion3 || '',
                a3: userData.securityAnswer3 || ''
            },
            emailVerified: userData.emailVerified || false,
            faceIdRegistered: userData.faceIdStatus || false,
            registrationDate: new Date().toISOString(),
            lastLogin: null,
            phone: userData.phone || '',
            dob: userData.dob || '',
            address: userData.address || '',
            profilePicture: userData.profilePicture || ''
        };
        
        data.users.push(newUser);
        
        // Update analytics
        data.analytics.totalUsers = data.users.length;
        data.analytics.registrationsByCountry[userData.country] = 
            (data.analytics.registrationsByCountry[userData.country] || 0) + 1;
        
        if (userData.paymentStatus === 'completed' || userData.paymentStatus === 'waived') {
            const amount = userData.paymentAmount || getFeeByCountry(userData.country);
            if (amount > 0) {
                data.analytics.totalPayments += amount;
            }
            const method = userData.paymentMethod || 'pending';
            if (data.analytics.paymentsByMethod[method] !== undefined) {
                data.analytics.paymentsByMethod[method] = 
                    (data.analytics.paymentsByMethod[method] || 0) + 1;
            }
        }
        
        if (userData.interviewType) {
            data.analytics.totalInterviews += 1;
        }
        
        writeData(data);
        
        console.log('═══════════════════════════════════');
        console.log('🟢 NEW USER REGISTERED');
        console.log(`👤 Name: ${newUser.fullName}`);
        console.log(`📧 Email: ${newUser.email}`);
        console.log(`🌍 Country: ${newUser.country}`);
        console.log(`💳 Payment: ${newUser.payment.method} - $${newUser.payment.amount}`);
        console.log(`🗣️ Interview: ${newUser.interview ? 'Scheduled ✅' : 'Not required'}`);
        console.log(`📅 Registered: ${new Date(newUser.registrationDate).toLocaleString()}`);
        console.log('═══════════════════════════════════');
        
        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                country: newUser.country
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// ============================================================
// 💳 PAYMENT ROUTE
// ============================================================
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, email, fullName } = req.body;
        
        if (!stripe) {
            console.log('💳 Simulated payment:');
            console.log(`   Amount: $${amount}`);
            console.log(`   User: ${fullName} (${email})`);
            
            const data = readData();
            data.payments.push({
                id: `pay_${Date.now()}`,
                amount: amount,
                email: email,
                fullName: fullName,
                method: 'simulated',
                status: 'succeeded',
                timestamp: new Date().toISOString()
            });
            writeData(data);
            
            return res.json({
                clientSecret: 'simulated_secret_' + Date.now(),
                status: 'succeeded'
            });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            metadata: { email, fullName }
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
        
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 📊 ADMIN DASHBOARD ROUTES
// ============================================================

// Get all users
app.get('/api/admin/users', (req, res) => {
    try {
        const data = readData();
        const users = data.users.map(u => ({
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            email: u.email,
            country: u.country,
            payment: u.payment,
            interview: u.interview,
            emailVerified: u.emailVerified,
            faceIdRegistered: u.faceIdRegistered,
            registrationDate: u.registrationDate,
            phone: u.phone,
            dob: u.dob
        }));
        res.json({ users, total: users.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get analytics
app.get('/api/admin/analytics', (req, res) => {
    try {
        const data = readData();
        res.json({
            totalUsers: data.analytics.totalUsers,
            totalPayments: data.analytics.totalPayments,
            totalInterviews: data.analytics.totalInterviews,
            registrationsByCountry: data.analytics.registrationsByCountry,
            paymentsByMethod: data.analytics.paymentsByMethod,
            recentUsers: data.users.slice(-10).map(u => ({
                fullName: u.fullName,
                email: u.email,
                country: u.country,
                registrationDate: u.registrationDate
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payments
app.get('/api/admin/payments', (req, res) => {
    try {
        const data = readData();
        res.json({
            payments: data.payments || [],
            total: (data.payments || []).length,
            totalAmount: (data.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get interviews
app.get('/api/admin/interviews', (req, res) => {
    try {
        const data = readData();
        const interviews = data.users.filter(u => u.interview);
        res.json({
            interviews: interviews,
            total: interviews.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
app.get('/api/admin/users/:id', (req, res) => {
    try {
        const data = readData();
        const user = data.users.find(u => u.id === req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.put('/api/admin/users/:id', (req, res) => {
    try {
        const data = readData();
        const index = data.users.findIndex(u => u.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
        }
        data.users[index] = { ...data.users[index], ...req.body };
        writeData(data);
        res.json({ success: true, user: data.users[index] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/admin/users/:id', (req, res) => {
    try {
        const data = readData();
        data.users = data.users.filter(u => u.id !== req.params.id);
        writeData(data);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🏫 UNIVERSITY MANAGEMENT ROUTES
// ============================================================

// Get all universities
app.get('/api/admin/universities', (req, res) => {
    try {
        const data = readData();
        res.json({
            universities: data.universityAdmins || [],
            total: (data.universityAdmins || []).length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create university admin
app.post('/api/admin/university/create', (req, res) => {
    try {
        const { university, adminEmail, adminPassword, country } = req.body;
        const data = readData();
        
        if (data.universityAdmins?.find(u => u.email === adminEmail)) {
            return res.status(409).json({ error: 'University admin already exists' });
        }
        
        const newAdmin = {
            id: `uni_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            university,
            email: adminEmail,
            password: adminPassword,
            country: country || 'N/A',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        if (!data.universityAdmins) data.universityAdmins = [];
        data.universityAdmins.push(newAdmin);
        writeData(data);
        
        console.log('═══════════════════════════════════');
        console.log('🏫 NEW UNIVERSITY CREATED');
        console.log(`📚 University: ${university}`);
        console.log(`📧 Email: ${adminEmail}`);
        console.log('═══════════════════════════════════');
        
        res.status(201).json({
            success: true,
            message: `University ${university} created successfully!`,
            admin: newAdmin
        });
        
    } catch (error) {
        console.error('Error creating university:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete university
app.delete('/api/admin/university/:id', (req, res) => {
    try {
        const data = readData();
        data.universityAdmins = (data.universityAdmins || []).filter(u => u.id !== req.params.id);
        writeData(data);
        res.json({ success: true, message: 'University removed' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update university status
app.put('/api/admin/university/:id', (req, res) => {
    try {
        const { status } = req.body;
        const data = readData();
        const university = (data.universityAdmins || []).find(u => u.id === req.params.id);
        
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        
        university.status = status || 'active';
        writeData(data);
        res.json({ success: true, university });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 🏠 HEALTH & ROOT ROUTES
// ============================================================
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Azadi Global Backend</h1>
        <p>Status: Running ✅</p>
        <p>Port: ${PORT}</p>
        <hr>
        <h2>📊 API Endpoints:</h2>
        <ul>
            <li><a href="/api/health">GET /api/health</a> - Health check</li>
            <li>POST /api/auth/register - Register user</li>
            <li>POST /api/create-payment-intent - Create payment</li>
            <li><a href="/api/admin/users">GET /api/admin/users</a> - All users</li>
            <li><a href="/api/admin/analytics">GET /api/admin/analytics</a> - Analytics</li>
            <li><a href="/api/admin/payments">GET /api/admin/payments</a> - Payments</li>
            <li><a href="/api/admin/interviews">GET /api/admin/interviews</a> - Interviews</li>
            <li><a href="/api/admin/universities">GET /api/admin/universities</a> - Universities</li>
        </ul>
    `);
});

// ============================================================
// 🌐 START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('═══════════════════════════════════');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/api/admin/users`);
    console.log(`📈 Analytics: http://localhost:${PORT}/api/admin/analytics`);
    console.log(`🏫 Universities: http://localhost:${PORT}/api/admin/universities`);
    console.log('═══════════════════════════════════');
});
