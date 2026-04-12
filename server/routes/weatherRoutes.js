import express from 'express';
import { getWeatherByCoords, getForecast } from '../controllers/weatherController.js';

const router = express.Router();

router.get('/current/:lat/:lon', getWeatherByCoords);
router.get('/forecast/:lat/:lon', getForecast);

export default router;