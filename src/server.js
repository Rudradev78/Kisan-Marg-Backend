const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); 

const express = require('express');
const mongoose = require('mongoose'); // Added for index cleanup logic
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

/**
 * 2b. INDEX CLEANUP LOGIC
 * Forces MongoDB to drop the old unique phone index to stop the E11000 error.
 */
mongoose.connection.on('open', async () => {
  try {
    const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    if (collections.length > 0) {
      // Drop the old index if it exists
      await mongoose.connection.db.collection('users').dropIndex('phno_1').catch(() => {
        // Silently fail if index doesn't exist
      });
      console.log('✔ Old unique phone index cleaned up'.yellow);
    }
  } catch (err) {
    console.log('Index cleanup skipped or handled'.grey);
  }
});

// 3. Route File Imports
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sliderRoutes = require('./routes/sliderRoutes');
const alertRoutes = require('./routes/alertRoutes');
const adminRoutes = require('./routes/adminRoutes');
const marketRoutes = require('./routes/marketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();

// 4. Global Middleware
app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

// Logging for Development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 5. Mount Routers
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/sliders', sliderRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Basic Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "Kisan Marg API is live",
    timestamp: new Date().toISOString()
  });
});

// 6. Global Error Handler
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