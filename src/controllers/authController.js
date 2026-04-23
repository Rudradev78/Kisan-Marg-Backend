const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to User (Handles Role-Specific SignUp & SignIn)
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    const { phno, userType, name, location } = req.body;

    // 1. ROLE ISOLATION: Check if user exists for THIS specific role
    let user = await User.findOne({ phno, userType });

    /**
     * CASE A: USER SIGNING UP
     * If 'name' is provided, we treat this as a registration attempt.
     */
    if (name) {
      if (user) {
        return res.status(400).json({ 
          success: false, 
          isExistingUser: true,
          message: `This number is already registered as a ${userType}. Please Sign In.` 
        });
      }
      
      // Create new user record (Account is pending until OTP verification)
      user = await User.create({ 
        phno, 
        userType, 
        name,
        location: location || "Not Provided",
        isLogged: false
      });
    }

    /**
     * CASE B: USER SIGNING IN
     * If no 'name' is provided, we expect an existing account for this role.
     */
    if (!name && !user) {
      return res.status(404).json({ 
        success: false, 
        message: `No ${userType} account found. Please Sign Up first.` 
      });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpChances = 5; 
    await user.save();

    // 3. Send OTP via Fast2SMS (Non-blocking / Bulletproof)
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;

    axios.get(fast2smsUrl)
      .then(response => console.log(`Fast2SMS [${userType}] success:`, response.data.message))
      .catch(err => {
        console.log(`Fast2SMS [${userType}] Gateway Error:`, err.response?.data?.message || err.message);
      });

    // 4. CRITICAL: High-Visibility Log for Render Logs
    console.log(`\n==========================================`);
    console.log(`🚀 KISAN MARG LOGIN ATTEMPT`);
    console.log(`ROLE: ${userType} | NAME: ${user.name}`);
    console.log(`PHONE: ${phno} | OTP: ${otp}`);
    console.log(`==========================================\n`);

    res.status(200).json({ 
        success: true, 
        message: "OTP sent successfully.",
        isExistingUser: !!name // Returns true if we just processed a signup
    });

  } catch (error) {
    console.error("Auth Controller Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Verify OTP and Generate JWT
// @route   POST /api/v1/auth/verify
exports.verifyOTP = async (req, res) => {
  try {
    const { phno, otp, userType } = req.body;

    // Search by both phone and userType to verify the correct account
    const user = await User.findOne({ phno, userType });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "No active OTP found." });
    }

    // Rate Limit Check
    if (user.otpChances <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Account locked due to too many attempts. Try later." 
      });
    }

    // Expiration Check
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    // Validate OTP
    if (user.otp !== otp) {
      user.otpChances -= 1;
      await user.save();
      return res.status(400).json({ 
        success: false, 
        message: `Incorrect OTP. ${user.otpChances} attempts remaining.` 
      });
    }

    // SUCCESS - Finalize Account
    user.isLogged = true;
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.userType }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phno: user.phno,
        userType: user.userType,
        location: user.location
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};