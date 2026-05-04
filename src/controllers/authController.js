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
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // 1. Basic Info Updates
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.phno) user.phno = req.body.phno;
    if (req.body.farmName) user.farmName = req.body.farmName;
    if (req.body.businessAddress) user.businessAddress = req.body.businessAddress;

    // 2. Profile Image Update
    if (req.file) {
       // Assuming you have your Cloudinary logic here
       const result = await uploadToCloudinary(req.file.buffer, "profiles");
       user.dpImageURL = result.secure_url;
    }

    // 3. Address Update Logic (Modal Functionality)
    if (req.body.addressUpdate) {
      const { addressId, type, name, phone, address } = req.body.addressUpdate;

      // 🛡️ Safety: Initialize array if it doesn't exist
      if (!user.addresses) user.addresses = [];

      if (addressId) {
        // Edit Existing
        const existingAddr = user.addresses.id(addressId);
        if (existingAddr) {
          existingAddr.type = type;
          existingAddr.name = name;
          existingAddr.phone = phone;
          existingAddr.address = address;
        }
      } else {
        // Add New
        user.addresses.push({ type, name, phone, address });
      }
    }

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Wishlist (Add or Remove)
// @route   POST /api/v1/auth/wishlist/:productId
exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { productId } = req.params;

    // 1. SAFETY CHECK: Ensure the array exists (prevents "cannot read property push of undefined")
    if (!user.wishlist) {
      user.wishlist = [];
    }

    // 2. ROBUST MATCHING: Use .toString() to ensure we compare String vs String
    const index = user.wishlist.findIndex(id => id.toString() === productId);

    if (index === -1) {
      // Logic: Add to wishlist if not present
      user.wishlist.push(productId);
    } else {
      // Logic: Remove from wishlist if already present
      user.wishlist.splice(index, 1);
    }

    // 3. Persist and Return
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      wishlist: user.wishlist 
    });
  } catch (error) {
    console.error("Wishlist Toggle Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all addresses
exports.getAddresses = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user.addresses });
};

// Add/Update Address
exports.saveAddress = async (req, res) => {
  const user = await User.findById(req.user.id);
  const { addressId, type, name, phone, address } = req.body;

  if (addressId) {
    // Update existing
    const addr = user.addresses.id(addressId);
    addr.type = type; addr.name = name; addr.phone = phone; addr.address = address;
  } else {
    // Add new
    user.addresses.push({ type, name, phone, address });
  }
  await user.save();
  res.status(200).json({ success: true, data: user.addresses });
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Mongoose "pull" removes sub-document by its _id
    user.addresses.pull(req.params.id);
    
    await user.save();
    res.status(200).json({ success: true, data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get specific profile by ID
// @route   GET /api/v1/auth/profile/:id
exports.getProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};