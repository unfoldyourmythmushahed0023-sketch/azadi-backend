const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());
// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running!' });
});
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, email, fullName } = req.body;
        console.log(`Payment for: ${email}, amount: $${amount}`);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            metadata: { email, fullName }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password required' 
        });
    }
    
    if (email.includes('@') && password.length >= 6) {
        res.json({
            success: true,
            message: 'Login successful!',
            data: {
                token: 'demo_token_' + Date.now(),
                fullName: 'Test User',
                email: email
            }
        });
    } else {
        res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }
});
app.listen(5001, () => console.log('Server running on port 5001'));
