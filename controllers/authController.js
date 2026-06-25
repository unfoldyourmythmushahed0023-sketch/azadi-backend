const User = require('../models/User');
const Country = require('../models/Country');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, country, countryCode } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Get country GDP
    const countryData = await Country.findOne({ 
      $or: [{ name: country }, { code: countryCode }] 
    });
    
    const gdpPerCapita = countryData ? countryData.gdpPerCapita : 0;
    
    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      country,
      countryCode: countryCode.toUpperCase(),
      gdpPerCapita
    });
    
    // Calculate discount
    let discountRate = 0;
    if (gdpPerCapita < 1000) discountRate = 50;
    else if (gdpPerCapita < 3000) discountRate = 30;
    else if (gdpPerCapita < 6000) discountRate = 15;
    
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        country: user.country,
        countryCode: user.countryCode,
        gdpPerCapita: user.gdpPerCapita,
        discountRate,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    let discountRate = 0;
    if (user.gdpPerCapita < 1000) discountRate = 50;
    else if (user.gdpPerCapita < 3000) discountRate = 30;
    else if (user.gdpPerCapita < 6000) discountRate = 15;
    
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        country: user.country,
        countryCode: user.countryCode,
        gdpPerCapita: user.gdpPerCapita,
        discountRate,
        isAdmin: user.isAdmin,
        applicationCount: user.applicationCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let discountRate = 0;
    if (user.gdpPerCapita < 1000) discountRate = 50;
    else if (user.gdpPerCapita < 3000) discountRate = 30;
    else if (user.gdpPerCapita < 6000) discountRate = 15;
    
    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        country: user.country,
        countryCode: user.countryCode,
        gdpPerCapita: user.gdpPerCapita,
        discountRate,
        isAdmin: user.isAdmin,
        applicationCount: user.applicationCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getMe };
