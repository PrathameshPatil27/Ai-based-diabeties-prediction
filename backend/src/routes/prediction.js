const express = require('express');
const Prediction = require('../models/Prediction');
const auth = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const router = express.Router();

/**
 * Call Python prediction script with input data
 */
async function predictWithRandomForest(input) {
  return new Promise(async (resolve, reject) => {
    try {
      // Set pregnancies to 0 if gender is male or not provided
      const predictionInput = {
        ...input,
        pregnancies: (input.gender === 'female' ? (parseFloat(input.pregnancies) || 0) : 0),
      };

      // Remove gender from prediction input as model doesn't use it
      const { gender, ...modelInput } = predictionInput;

      // Convert all values to numbers
      const numericInput = {
        pregnancies: parseFloat(modelInput.pregnancies) || 0,
        glucose: parseFloat(modelInput.glucose) || 0,
        bloodPressure: parseFloat(modelInput.bloodPressure) || 0,
        skinThickness: parseFloat(modelInput.skinThickness) || 0,
        insulin: parseFloat(modelInput.insulin) || 0,
        bmi: parseFloat(modelInput.bmi) || 0,
        diabetesPedigreeFunction: parseFloat(modelInput.diabetesPedigreeFunction) || 0,
        age: parseFloat(modelInput.age) || 0,
      };

      // Path to Python prediction script
      const scriptPath = path.join(__dirname, '../../ml/predict.py');
      
      // Create temporary file with input data
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `prediction_input_${Date.now()}.json`);
      
      await fs.writeFile(tempFile, JSON.stringify(numericInput));

      // Execute Python script
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const pythonProcess = spawn(pythonCommand, [scriptPath, tempFile]);
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (err) {
          // Ignore cleanup errors
        }

        if (code !== 0) {
          console.error('Python script error:', stderr);
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse JSON output
          const result = JSON.parse(stdout);
          
          if (result.error) {
            reject(new Error(result.error));
            return;
          }

          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      });

      pythonProcess.on('error', async (error) => {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (err) {
          // Ignore cleanup errors
        }
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  }).catch(error => {
    console.error('Random Forest prediction error:', error);
    // Fallback to simple rule-based prediction if Python fails
    console.log('Falling back to simple rule-based prediction');
    const { glucose = 0, bmi = 0, age = 0, bloodPressure = 0 } = input || {};
    let score = 0;
    if (glucose > 125) score += 0.5;
    if (bmi > 30) score += 0.2;
    if (age > 45) score += 0.2;
    if (bloodPressure > 85) score += 0.1;
    const probability = Math.min(0.95, Math.max(0.05, score));
    
    return {
      hasDiabetes: probability >= 0.5,
      probability,
      modelVersion: 'fallback-rules-v1'
    };
  });
}

// Validation rules for input fields
const validationRules = {
  pregnancies: { min: 0, max: 20 },
  glucose: { min: 0, max: 400, required: true },
  bloodPressure: { min: 0, max: 220 },
  skinThickness: { min: 0, max: 99 },
  insulin: { min: 0, max: 846 },
  bmi: { min: 5, max: 67.1, required: true },
  diabetesPedigreeFunction: { min: 0, max: 2.42 },
  age: { min: 1, max: 120, required: true }
};

function validateInput(input) {
  const errors = [];

  // Validate gender
  if (!input.gender || !['male', 'female'].includes(input.gender)) {
    errors.push('Gender is required and must be male or female');
  }

  // Validate each field
  Object.keys(validationRules).forEach(fieldName => {
    const rule = validationRules[fieldName];
    const value = input[fieldName];

    // Skip pregnancies validation if gender is male
    if (fieldName === 'pregnancies' && input.gender === 'male') {
      return;
    }

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null || value === '') {
      return;
    }

    const numValue = parseFloat(value);

    // Check if value is a valid number
    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      return;
    }

    // Check minimum value
    if (rule.min !== undefined && numValue < rule.min) {
      errors.push(`${fieldName} must be greater than or equal to ${rule.min}`);
    }

    // Check maximum value
    if (rule.max !== undefined && numValue > rule.max) {
      errors.push(`${fieldName} must be less than or equal to ${rule.max}`);
    }
  });

  return errors;
}

router.post('/predict', auth, async (req, res) => {
  try {
    const input = req.body || {};
    
    // Validate input values
    const validationErrors = validateInput(input);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid input values',
        errors: validationErrors
      });
    }

    // Ensure pregnancies is 0 for males
    const sanitizedInput = {
      ...input,
      pregnancies: input.gender === 'female' ? (parseFloat(input.pregnancies) || 0) : 0
    };

    // Make prediction using Random Forest model
    const result = await predictWithRandomForest(sanitizedInput);
    
    // Save prediction to database
    const record = await Prediction.create({ 
      userId: req.userId, 
      input: sanitizedInput, 
      result: { 
        hasDiabetes: result.hasDiabetes, 
        probability: result.probability, 
        modelVersion: result.modelVersion || 'random-forest-v1'
      } 
    });
    
    res.status(201).json(record);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: error.message || 'Prediction failed' });
  }
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



