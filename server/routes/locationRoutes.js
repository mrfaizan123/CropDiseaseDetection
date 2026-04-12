import express from 'express';
import { getLocationFromCoords, suggestCrops } from '../controllers/locationController.js';

const router = express.Router();

router.get('/reverse/:lat/:lon', getLocationFromCoords);
router.get('/suggest-crops', suggestCrops);

export default router;