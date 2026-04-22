const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to User
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    const { phno, userType } = req.body;

    // 1. Check if user exists in the Farmer or Buyer module
    let user = await User.findOne({ phno });

    // 2. If exists, check if already logged in
    if (user && user.isLogged) {
      return res.status(400).json({ 
        success: false, 
        message: "Already logged in. Please logout from other devices." 
      });
    }

    // 3. If new user, create account
    if (!user) {
      user = await User.create({ phno, userType, name: "New User" });
    }

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpChances = 5; // Reset chances
    await user.save();

    // 5. Send OTP via Fast2SMS
    // Note: Using the 'otp' route is easiest
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;

    await axios.get(fast2smsUrl);

    // Also console log for easy testing without spending credits
    console.log(`OTP for ${phno} is: ${otp}`);

    res.status(200).json({ success: true, message: "OTP sent successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and Login
// @route   POST /api/v1/auth/verify
exports.verifyOTP = async (req, res) => {
  try {
    const { phno, otp } = req.body;
    const user = await User.findOne({ phno });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "Request a new OTP" });
    }

    // Rate Limiting Check (5 chances rule)
    if (user.otpChances <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Too many failed attempts. Try again later." 
      });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      user.otpChances -= 1;
      await user.save();
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${user.otpChances} chances remaining.` 
      });
    }

    // Check if expired
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    // Success! Log the user in
    user.isLogged = true;
    user.otp = undefined; // Clear OTP
    await user.save();

    // Create JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phno: user.phno,
        userType: user.userType
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};