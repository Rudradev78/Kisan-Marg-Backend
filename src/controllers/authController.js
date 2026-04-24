const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to User (Handles Role-Specific SignUp & SignIn)
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    const { phno, userType, name, location } = req.body;

    // 1. Search for user by BOTH phone and role
    let user = await User.findOne({ phno, userType });

    /**
     * CASE A: SIGN UP INTENT (Name is provided)
     */
    if (name) {
      // Block only if the account is ALREADY verified/active
      if (user && user.isLogged) {
        return res.status(400).json({ 
          success: false, 
          isExistingUser: true,
          message: `This number is already registered as a ${userType}. Please Sign In.` 
        });
      }
      
      // If user doesn't exist, create a "pending" record
      if (!user) {
        user = new User({ 
          phno, 
          userType, 
          name,
          location: location || "Not Provided",
          isLogged: false // Account remains "pending" until verifyOTP
        });
      } else {
        // Retry logic: Update name/location for the unverified record
        user.name = name;
        user.location = location || user.location;
      }
    }

    /**
     * CASE B: SIGN IN INTENT (No name provided)
     */
    if (!name) {
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: `No ${userType} account found with this number.` 
        });
      }

      // Block sign-in if they never finished the OTP step during Sign Up
      if (!user.isLogged) {
        return res.status(401).json({
          success: false,
          message: "Registration incomplete. Please use the Sign Up page to verify."
        });
      }
    }

    // 2. Generate/Refresh 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpChances = 5; 
    
    // Save the record (Triggers Mongoose validation)
    await user.save();

    // 3. Send OTP via Fast2SMS (Non-blocking)
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;

    axios.get(fast2smsUrl)
      .then(() => console.log(`✔ Fast2SMS [${userType}] OTP sent to ${phno}`))
      .catch(err => {
        console.log(`❌ Fast2SMS Gateway Error:`, err.response?.data?.message || err.message);
      });

    // 4. THE BYPASS: High-Visibility Log for Render
    console.log(`\n==========================================`);
    console.log(`🚀 KISAN MARG [${userType}] OTP BYPASS`);
    console.log(`USER: ${user.name} | PHONE: ${phno}`);
    console.log(`CODE: ${otp} | VERIFIED: ${user.isLogged}`);
    console.log(`==========================================\n`);

    res.status(200).json({ 
        success: true, 
        message: "OTP sent successfully.",
        isExistingUser: user.isLogged 
    });

  } catch (error) {
    console.error("Auth Controller Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

// @desc    Verify OTP and Finalize Account
// @route   POST /api/v1/auth/verify
exports.verifyOTP = async (req, res) => {
  try {
    const { phno, otp, userType } = req.body;

    const user = await User.findOne({ phno, userType });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "No active OTP found. Please resend." });
    }

    // 5 Chances Rule
    if (user.otpChances <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Account locked due to too many attempts. Please try again later." 
      });
    }

    // Expiration Check
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
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

    // --- SUCCESS ---
    user.isLogged = true; // The account is now officially "created" and active
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.userType }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: "Authentication successful",
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