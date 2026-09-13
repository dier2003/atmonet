// routes/prediction.js
import { Router } from 'express';
import { calculateRiskWithML } from '../services/riskEngine.js';

const r = Router();

r.post('/', async (req, res) => {
  try {
    const result = await calculateRiskWithML(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default r;