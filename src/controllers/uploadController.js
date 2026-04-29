const { uploadToCloudinary } = require('../utils/cloudinaryHelper');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please select an image file." });
    }

    // Pass the buffer from your multer middleware to your helper
    // We'll store slider images in their own folder
    const result = await uploadToCloudinary(req.file.buffer, "kisan_marg_sliders");

    res.status(200).json({
      success: true,
      url: result.secure_url // This is the Cloudinary link returned to the website
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    res.status(500).json({ success: false, message: "Image upload failed." });
  }
};