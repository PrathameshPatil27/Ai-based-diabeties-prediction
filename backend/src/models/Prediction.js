const mongoose = require('mongoose');

const PredictionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    input: {
      pregnancies: Number,
      glucose: Number,
      bloodPressure: Number,
      skinThickness: Number,
      insulin: Number,
      bmi: Number,
      diabetesPedigreeFunction: Number,
      age: Number,
    },
    result: {
      hasDiabetes: { type: Boolean, required: true },
      probability: { type: Number, required: true },
      modelVersion: { type: String, default: 'v1' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prediction', PredictionSchema);



