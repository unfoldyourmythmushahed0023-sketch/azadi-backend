const User = require('../models/User');
const axios = require('axios');

// ========== DETECT LOCATION FROM IP ==========
const detectLocation = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    // Use ipapi.co to get location data
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data;

    if (data.error) {
      return res.status(400).json({ message: 'Invalid IP address' });
    }

    res.json({
      success: true,
      location: {
        ip: data.ip,
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude
      }
    });
  } catch (error) {
    console.error('Location detection error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== SAVE USER LOCATION ==========
const saveUserLocation = async (req, res) => {
  try {
    const { ip, city, timezone } = req.body;
    const userId = req.user.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          ip: ip || '',
          city: city || '',
          timezone: timezone || ''
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Location saved successfully',
      location: user.location
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET USER LOCATION ==========
const getUserLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('location');

    res.json({
      success: true,
      location: user?.location || null
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  detectLocation,
  saveUserLocation,
  getUserLocation
};
