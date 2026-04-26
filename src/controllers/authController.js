const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');

// @desc    Send OTP to User (Handles Role-Specific SignUp & SignIn)
// @route   POST /api/v1/auth/login
exports.sendOTP = async (req, res) => {
  try {
    const { phno, userType, name, location } = req.body;

    let user = await User.findOne({ phno, userType });

    if (name) {
      if (user && user.isLogged) {
        return res.status(400).json({ 
          success: false, 
          isExistingUser: true,
          message: `This number is already registered as a ${userType}. Please Sign In.` 
        });
      }
      
      if (!user) {
        user = new User({ 
          phno, 
          userType, 
          name,
          location: location || "Not Provided",
          isLogged: false 
        });
      } else {
        user.name = name;
        user.location = location || user.location;
      }
    }

    if (!name && !user) {
      return res.status(404).json({ 
        success: false, 
        message: `No ${userType} account found with this number.` 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    user.otpChances = 5; 
    
    await user.save();

    const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phno}`;

    axios.get(fast2smsUrl)
      .then(() => console.log(`✔ OTP sent to ${phno}`))
      .catch(err => console.log(`❌ Gateway Error:`, err.message));

    console.log(`\n==========================================`);
    console.log(`🚀 KISAN MARG [${userType}] OTP BYPASS: ${otp}`);
    console.log(`==========================================\n`);

    res.status(200).json({ 
        success: true, 
        message: "OTP sent successfully.",
        isExistingUser: user.isLogged 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and Finalize Account
// @route   POST /api/v1/auth/verify
exports.verifyOTP = async (req, res) => {
  try {
    const { phno, otp, userType } = req.body;
    const user = await User.findOne({ phno, userType });

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: "No active OTP found." });
    }

    if (user.otpChances <= 0) {
      return res.status(403).json({ success: false, message: "Account locked. Try later." });
    }

    if (user.otp !== otp) {
      user.otpChances -= 1;
      await user.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. ${user.otpChances} left.` });
    }

    user.isLogged = true;
    user.otp = undefined; 
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.userType }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, phno: user.phno, userType: user.userType, location: user.location }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User Dashboard Stats & Profile Info
// @route   GET /api/v1/auth/stats
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      user, // <--- ADD THIS: Sends the full profile details (farmName, address, etc.)
      stats: {
        orders: 0, 
        rating: user.rating || 0.0,
        profit: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Update Farmer Profile
// @route   PUT /api/v1/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    // 1. Destructure everything EXCEPT the coordinates first
    const { name, farmName, businessAddress, location } = req.body;
    
    // 2. Initialize update object
    let updateData = { name, farmName, businessAddress, location };

    // 3. Handle Profile Image (Upload to Cloudinary)
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_profiles");
      updateData.dpImageURL = result.secure_url;
    }

    // 4. Handle Location Coordinates (Parse string to Object)
    // We only add it to updateData if it exists and is successfully parsed
    if (req.body.locationCoords) {
      try {
        updateData.locationCoords = JSON.parse(req.body.locationCoords);
      } catch (e) {
        console.log("Coords parsing failed, skipping coordinates update.");
      }
    }

    // 5. Update Database
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Wishlist (Add or Remove)
// @route   POST /api/v1/auth/wishlist/:productId
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { productId } = req.params;
    const index = user.wishlist.indexOf(productId);

    if (index === -1) {
      user.wishlist.push(productId); // Add
    } else {
      user.wishlist.splice(index, 1); // Remove
    }

    await user.save();
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};