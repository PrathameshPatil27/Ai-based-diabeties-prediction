const express = require('express');
const Prediction = require('../models/Prediction');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock simple rule-based prediction as placeholder for ML model
function simpleRiskScore(input) {
  const { glucose = 0, bmi = 0, age = 0, bloodPressure = 0 } = input || {};
  let score = 0;
  if (glucose > 125) score += 0.5;
  if (bmi > 30) score += 0.2;
  if (age > 45) score += 0.2;
  if (bloodPressure > 85) score += 0.1;
  return Math.min(0.95, Math.max(0.05, score));
}

router.post('/predict', auth, async (req, res) => {
  const input = req.body || {};
  const probability = simpleRiskScore(input);
  const hasDiabetes = probability >= 0.5;
  const record = await Prediction.create({ userId: req.userId, input, result: { hasDiabetes, probability, modelVersion: 'rules-v1' } });
  res.status(201).json(record);
});

router.get('/history', auth, async (req, res) => {
  const items = await Prediction.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

router.get('/:id', auth, async (req, res) => {
  const item = await Prediction.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

module.exports = router;



