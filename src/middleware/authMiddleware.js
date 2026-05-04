const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      /**
       * 🟢 THE FIX: 
       * Attach the role from the token to req.user.
       * This matches the 'role' we signed in verifyOTP (user.userType).
       */
      const user = await User.findById(decoded.id).select('-otp');
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      // Attach user info and role to the request
      req.user = {
        id: user._id,
        role: decoded.role, // This will be 'Farmer' or 'Buyer'
        ...user._doc
      };

      return next(); 
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // 2. If no token was found at all
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };