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
      farmerId: req.user.id, // Linked to the logged-in farmer
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

// @desc    Get Market Prices (Top 10 products for Buyer/Public Home)
// @route   GET /api/v1/products/market
// Update your getMarketProducts to this:
exports.getMarketProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('farmerId', 'name farmName') // Get farmer details
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD THIS NEW FUNCTION:
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmerId', 'name farmName businessAddress location phno');
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products listed by the logged-in farmer
// @route   GET /api/v1/products/farmer
exports.getFarmerProducts = async (req, res) => {
  try {
    // Finds only products where farmerId matches the logged-in user
    const products = await Product.find({ farmerId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product details (Edit function)
// @route   PUT /api/v1/products/:id
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Security check: Ensure the farmer owns this product
    if (product.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to edit this product" });
    }

    // Update the product with the new values from req.body
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product (Delete function)
// @route   DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Security check: Ensure the farmer owns this product
    if (product.farmerId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to delete this product" });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product removed from inventory"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Product Details (For Buyer Product Page)
// @route   GET /api/v1/products/:id
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmerId', 'name farmName businessAddress locationCoords phno');

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};