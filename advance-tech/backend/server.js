const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nocache = require('nocache');
const path = require('path');
const fs = require('fs');
const db = require('./config/db');
const apiRoutes = require('./routes/api');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads and downloads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

// 1. Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"]
    }
  }
}));

app.use(cors({
  origin: '*', // Customize to client URL in production, e.g. http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Prevent client caching for dynamic resources
app.use(nocache());

// Rate Limiter: Limit requests to 150 per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 2. Request parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. API Routes
app.use('/api', apiRoutes);

// Serve static assets in production (if available)
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Advance Tech Full-Stack Backend API is running.' });
  });
}

// 4. Page Not Found (404) Handler for APIs
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API endpoint or page not found (404).' });
});

// 5. Global Error Handler (500)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error (500). Something went wrong on the server.'
  });
});

// 6. Connect to database then start server
const tallyController = require('./controllers/tallyController');

async function startServer() {
  try {
    await db.initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      tallyController.startTallyAutoSync();
    });
  } catch (error) {
    console.error('Could not start server due to database initialization failure.');
    process.exit(1);
  }
}

startServer();
