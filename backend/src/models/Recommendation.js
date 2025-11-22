const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
    context: {
      dietType: { type: String, enum: ['vegetarian', 'non-vegetarian'] },
      age: Number,
      gender: String,
      bmi: Number,
      glucose: Number,
      goal: { type: String, enum: ['weight_loss', 'maintenance', 'gain', 'control_glucose', 'general'] },
      preferences: [String],
      allergies: [String],
      region: String,
    },
    response: {
      text: String,
      meals: [
        {
          name: String,
          calories: Number,
          carbs: Number,
          protein: Number,
          fat: Number,
        },
      ],
      tips: [String],
      sources: [String],
      model: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', RecommendationSchema);



