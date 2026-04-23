const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to User (Handles SignUp & SignIn)
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    const { phno, userType, name, location } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ phno });

    /**
     * CASE A: USER SIGNING UP
     * If 'name' is sent, user intent is registration.
     */
    if (name) {
      if (user) {
        return res.status(400).json({ 
          success: false, 
          isExistingUser: true,
          message: "This phone number is already registered. Please Sign In." 
        });
      }
      // Create new user with all details
      user = await User.create({ 
        phno, 
        userType, 
        name,
        location: location || "Not Provided" 
      });
    }

    /**
     * CASE B: USER SIGNING IN
     * If no 'name' is sent, we expect an existing account.
     */
    if (!name && !user) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found. Please Sign Up first." 
      });
    }

    // 2. Prevent Multiple Logins (Optional Session Control)
    if (user && user.isLogged) {
      // For testing, you might want to comment this out, 
      // or implement a force-logout logic.
      // user.isLogged = false; 
    }

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpChances = 5; 
    await user.save();

    // 4. Send OTP via Fast2SMS (The "Bulletproof" Way)
    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;

    // We use a non-blocking call here so the server doesn't wait for Fast2SMS
    axios.get(fast2smsUrl)
      .then(response => console.log("Fast2SMS success:", response.data.message))
      .catch(err => {
        console.log("Fast2SMS Gateway Error (Likely DLT/Balance):", err.response?.data?.message || err.message);
      });

    // 5. CRITICAL: Console log for Render Logs (Your Free Bypass)
    console.log(`------------------------------------------`);
    console.log(`🚀 KISAN MARG DEBUG LOG`);
    console.log(`USER: ${user.name} | PHONE: ${phno}`);
    console.log(`VERIFICATION CODE: ${otp}`);
    console.log(`------------------------------------------`);

    res.status(200).json({ 
        success: true, 
        message: "OTP process initiated. Please check your phone or server logs.",
        isExistingUser: !!user 
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
    const { phno, otp } = req.body;
    const user = await User.findOne({ phno });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "No active OTP found. Request again." });
    }

    // Check rate limit (5 chances)
    if (user.otpChances <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Too many failed attempts. Your account is locked for 1 hour." 
      });
    }

    // Check Expiration
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please resend." });
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

    // SUCCESS - Clear OTP and update status
    user.isLogged = true;
    user.otp = undefined; 
    user.otpExpires = undefined;
    await user.save();

    // Generate Token
    const token = jwt.sign(
      { id: user._id, role: user.userType }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
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