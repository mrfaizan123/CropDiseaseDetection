import express from 'express';
import { getMandiPrices, getCropAdvice } from '../controllers/mandiController.js';

const router = express.Router();

router.get('/prices', getMandiPrices);
router.get('/advice/:crop', getCropAdvice);

export default router;