const Product = require('../models/Product');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');

// @desc    Upload new crop (Farmer Only)
// @route   POST /api/v1/products/upload
exports.createProduct = async (req, res) => {
  try {
    const { productName, pricePerUnit, unitGiven, availableQuantity } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Product image is required" });
    }

    // Upload to Cloudinary and get the secure link
    const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_products");

    // Save all inputs in Product module with the link
    const product = await Product.create({
      farmerId: req.user.id,
      productName,
      pricePerUnit,
      unitGiven,
      availableQuantity,
      productImageURL: result.secure_url,
      uploadDate: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Stock updated successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Market Prices (Top 10 products)
// @route   GET /api/v1/products/market
exports.getMarketProducts = async (req, res) => {
  try {
    // Returns 10 product array for the Home Page
    const products = await Product.find()
      .select('productName pricePerUnit unitGiven productImageURL')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};