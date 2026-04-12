
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://cropdection.netlify.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Add this route

// Import Routes
import chatbotRoutes from './routes/chatbotRoutes.js';
import authRoutes from './routes/authRoutes.js';
import detectionRoutes from './routes/detectionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import weatherRoutes from './routes/weatherRoutes.js';
import mandiRoutes from './routes/mandiRoutes.js';
import fertilizerRoutes from './routes/fertilizerRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/mandi', mandiRoutes);
app.use('/api/fertilizers', fertilizerRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




















// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const connectDB = require("./config/db");
// const testRoutes = require("./routes/testRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const cropRoutes = require("./routes/cropRoutes");
// const detectionRoutes = require("./routes/detectionRoutes");

// const app = express();

// connectDB();

// app.use(cors());
// app.use(express.json());


// app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// // Routes
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/detection", require("./routes/detectionRoutes"));

// app.use("/api/test", testRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/crops", cropRoutes);
// app.use("/api/detections", detectionRoutes);

// app.get("/", (req, res) => {
//   res.send("Backend API Running 🚀");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on ${PORT}`));
