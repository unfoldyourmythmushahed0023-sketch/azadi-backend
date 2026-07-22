// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for: ${email}`);
        
        // For demo, accept any email/password
        // In production, you would check against a database
        
        // Simulate user lookup
        const user = {
            fullName: 'Test User',
            email: email,
            username: 'testuser',
            country: 'US'
        };
        
        // Check if password meets minimum requirements
        if (!password || password.length < 6) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // For demo, accept any valid email/password
        if (email && email.includes('@') && password.length >= 6) {
            res.json({
                success: true,
                message: 'Login successful!',
                data: {
                    token: 'demo_token_' + Date.now(),
                    fullName: user.fullName,
                    email: user.email,
                    username: user.username
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
}); 
