// routes/prediction.js
import { Router } from 'express';
import { calculateRiskWithML } from '../services/riskEngine.js';

const r = Router();

r.post('/', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      error: 'Request body must be a JSON object.',
      code: 'INVALID_REQUEST_BODY'
    });
  }

  if (body.region !== undefined && (typeof body.region !== 'string' || !body.region.trim())) {
    return res.status(400).json({
      error: 'region must be a non-empty string.',
      code: 'INVALID_REGION'
    });
  }

  try {
    const result = await calculateRiskWithML(body);
    res.json(result);
  } catch (err) {
    const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
    console.error('[prediction] Prediction request failed:', {
      message: err.message,
      code: err.code,
      details: err.details,
      stack: err.stack
    });
    res.status(statusCode).json({
      error: err.message || 'Prediction failed.',
      code: err.code || 'PREDICTION_FAILED',
      ...(err.details ? { details: err.details } : {})
    });
  }
});

export default r;