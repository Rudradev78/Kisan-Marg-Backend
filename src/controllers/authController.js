const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// @desc    Send OTP to User
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    // 1. Capture name, phno, and userType from frontend
    const { phno, userType, name } = req.body;

    // 2. Check if user already exists
    let user = await User.findOne({ phno });

    /**
     * LOGIC FOR SIGN UP (If name is provided, the user is trying to register)
     */
    if (name && user) {
      return res.status(400).json({ 
        success: false, 
        isExistingUser: true,
        message: "This phone number is already registered. Please Sign In." 
      });
    }

    /**
     * LOGIC FOR SIGN IN (If no name is provided, the user is trying to log in)
     */
    if (!name && !user) {
      return res.status(404).json({ 
        success: false, 
        message: "Account not found. Please Sign Up first." 
      });
    }

    // 3. If exists, check if already logged in (Session Control)
    if (user && user.isLogged) {
      return res.status(400).json({ 
        success: false, 
        message: "Already logged in. Please logout from other devices." 
      });
    }

    // 4. Create account only if it's a new user with a name
    if (!user && name) {
      user = await User.create({ 
        phno, 
        userType, 
        name // Saves the actual name entered in FarmerSignUp
      });
    }

    // 5. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.otpChances = 5; 
    await user.save();

    // 6. Send OTP via Fast2SMS
    try {
        const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;
        await axios.get(fast2smsUrl);
    } catch (smsErr) {
        console.log("Fast2SMS Error: ", smsErr.message);
        // We continue so you can still see the OTP in the console if the SMS fails
    }

    // console log for testing in Render Logs
    console.log(`OTP for ${phno} is: ${otp}`);

    res.status(200).json({ 
        success: true, 
        message: "OTP sent successfully",
        isExistingUser: !!user // returns true if user existed, false if just created
    });

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

    // 5 chances rule
    if (user.otpChances <= 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Too many failed attempts. Try again later." 
      });
    }

    // Verify
    if (user.otp !== otp) {
      user.otpChances -= 1;
      await user.save();
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${user.otpChances} chances remaining.` 
      });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP Expired" });
    }

    // Update login status
    user.isLogged = true;
    user.otp = undefined; 
    await user.save();

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