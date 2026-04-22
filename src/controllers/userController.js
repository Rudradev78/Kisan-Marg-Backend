const User = require('../models/User');

// @desc    Update Buyer Address
// @route   PUT /api/v1/users/address
exports.updateAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location: address },
      { new: true }
    );
    res.status(200).json({ success: true, data: user.location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Manage Wishlist (Add/Remove)
// @route   POST /api/v1/users/wishlist
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);

    const isAdded = user.wishlist.includes(productId);
    
    if (isAdded) {
      user.wishlist.pull(productId);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    res.status(200).json({ 
      success: true, 
      message: isAdded ? "Removed from wishlist" : "Added to wishlist",
      wishlist: user.wishlist 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};