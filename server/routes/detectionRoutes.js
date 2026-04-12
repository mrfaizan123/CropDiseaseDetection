import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { handleImageUpload } from '../middleware/uploadMiddleware.js';
import { 
  predictDiseasePublic, 
  getDetectionHistory, 
  getDashboardStats,
  getDetectionById 
} from '../controllers/detectionController.js';

const router = express.Router();

// ✅ PUBLIC - No auth required (but will still get req.user if token sent)
router.post('/predict', handleImageUpload, async (req, res, next) => {
  // Check for token even on public route
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      const User = (await import('../models/User.js')).default;
      req.user = await User.findById(decoded.id);
      console.log("User found on public route:", req.user?._id);
    } catch (e) {
      console.log("Invalid token on public route, continuing as anonymous");
    }
  }
  next();
}, predictDiseasePublic);

// ✅ PROTECTED - These need login
router.get('/history', protect, getDetectionHistory);
router.get('/dashboard', protect, getDashboardStats);
router.get('/:id', protect, getDetectionById);

export default router;