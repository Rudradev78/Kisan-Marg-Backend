const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// 1. Load Environment Variables
dotenv.config();

// 2. Connect to Database
connectDB();

// 3. Route File Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 4. Global Middleware
app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

// Logging for Development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Mount Routers (Mapped to your PDF Modules)
app.use('/api/v1/auth', authRoutes);       // Page 7: Auth Logic
app.use('/api/v1/products', productRoutes); // Page 1: Stock/Product Module
app.use('/api/v1/orders', orderRoutes);     // Page 2: Order Module
app.use('/api/v1/sliders', sliderRoutes);   // Page 5: Slider Module
app.use('/api/v1/alerts', alertRoutes);     // Page 5: Alert Module
app.use('/api/v1/admin', adminRoutes);       // Page 4: Admin Module

// Basic Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Kisan Marg API is live",
    timestamp: new Date().toISOString()
  });
});

// 6. Global Error Handler (Critical for 2.5s Response Rule)
app.use(errorHandler);

// 7. Start Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
    🚀 Kisan Marg Server Running!
    📍 Mode: ${process.env.NODE_ENV}
    🔗 Port: ${PORT}
    ───────────────────────────────────────────
  `.cyan.bold);
});

// 8. Graceful Shutdown
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`.red.bold);
  server.close(() => process.exit(1));
});