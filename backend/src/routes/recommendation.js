const express = require('express');
const Recommendation = require('../models/Recommendation');
const Prediction = require('../models/Prediction');
const auth = require('../middleware/auth');
const { getDietRecommendation } = require('../services/gemini');

const router = express.Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const { predictionId, context = {} } = req.body || {};
    let mergedContext = { ...context };
    if (predictionId) {
      const pred = await Prediction.findOne({ _id: predictionId, userId: req.userId });
      if (pred) {
        const bmi = pred.input?.bmi;
        mergedContext = {
          ...mergedContext,
          bmi,
          glucose: pred.input?.glucose,
          riskProbability: pred.result?.probability,
        };
      }
    }

    const response = await getDietRecommendation({ context: mergedContext });
    const record = await Recommendation.create({ userId: req.userId, predictionId: predictionId || undefined, context: mergedContext, response });
    res.status(201).json(record);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'Failed to generate recommendation' });
  }
});

router.get('/history', auth, async (req, res) => {
  const items = await Recommendation.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(items);
});

router.get('/:id', auth, async (req, res) => {
  const item = await Recommendation.findOne({ _id: req.params.id, userId: req.userId });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

module.exports = router;



