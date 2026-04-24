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

      // Get user from the token (Exclude OTP for security)
      req.user = await User.findById(decoded.id).select('-otp');
      
      // If user no longer exists in DB
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }

      return next(); // Use return here to stop execution of this function
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