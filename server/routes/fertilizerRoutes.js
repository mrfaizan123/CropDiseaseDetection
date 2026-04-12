import express from 'express';
import { getNearbyShops, getFertilizerGuide } from '../controllers/fertilizerController.js';

const router = express.Router();

router.get('/shops', getNearbyShops);
router.get('/guide/:crop', getFertilizerGuide);

export default router;