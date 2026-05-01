const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createAlert, getAllAlerts, deleteAlert } = require('../controllers/alertController');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public Routes (No Protection)
router.get('/', getAllAlerts); 
router.post('/', upload.single('image'), createAlert); 
router.delete('/:id', deleteAlert); // New route to delete by ID

module.exports = router;