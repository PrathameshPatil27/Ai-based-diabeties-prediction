import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { predictionService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const Prediction = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    gender: '',
    pregnancies: '',
    glucose: '',
    bloodPressure: '',
    skinThickness: '',
    insulin: '',
    bmi: '',
    diabetesPedigreeFunction: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Validation rules for each field
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

  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return null;

    // Check if required field is empty
    if (rule.required && (!value || value === '')) {
      return `${name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }

    // Skip validation if field is empty and not required
    if (!value || value === '') return null;

    const numValue = parseFloat(value);

    // Check if value is a valid number
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }

    // Check minimum value
    if (rule.min !== undefined && numValue < rule.min) {
      return `Value must be greater than or equal to ${rule.min}`;
    }

    // Check maximum value
    if (rule.max !== undefined && numValue > rule.max) {
      return `Value must be less than or equal to ${rule.max}`;
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validate on change for immediate feedback
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear pregnancies if gender is changed to male
    if (name === 'gender' && value === 'male') {
      setFormData(prev => ({
        ...prev,
        gender: value,
        pregnancies: ''
      }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.pregnancies;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate gender
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Validate all fields
    Object.keys(validationRules).forEach(fieldName => {
      // Skip pregnancies if gender is male
      if (fieldName === 'pregnancies' && formData.gender !== 'female') {
        return;
      }

      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate entire form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API (ensure pregnancies is only sent if female)
      const submitData = {
        gender: formData.gender,
        pregnancies: formData.gender === 'female' ? parseFloat(formData.pregnancies) || 0 : 0,
        glucose: parseFloat(formData.glucose),
        bloodPressure: parseFloat(formData.bloodPressure) || 0,
        skinThickness: parseFloat(formData.skinThickness) || 0,
        insulin: parseFloat(formData.insulin) || 0,
        bmi: parseFloat(formData.bmi),
        diabetesPedigreeFunction: parseFloat(formData.diabetesPedigreeFunction) || 0,
        age: parseFloat(formData.age)
      };
      
      const doc = await predictionService.predict(submitData);
      const pct = Math.round((doc?.result?.probability || 0) * 100);
      const riskLevel = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
      setPredictionResult({
        probability: pct,
        riskLevel,
        result: doc?.result?.hasDiabetes ? 'Positive' : 'Negative',
      });
      // Clear any previous errors on successful prediction
      setErrors({});
    } catch (error) {
      // Handle validation errors from server
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.join('. ')
        : error.message || 'Prediction failed';
      
      alert('Validation Error: ' + errorMessage);
      
      // If server returns field-specific errors, display them
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          // Try to extract field name from error message
          const fieldMatch = err.match(/(\w+)\s+/);
          if (fieldMatch) {
            serverErrors[fieldMatch[1]] = err;
          }
        });
        if (Object.keys(serverErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...serverErrors }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'from-red-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-primary-500 to-secondary-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Diabetes Risk Prediction
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enter your health metrics to assess your diabetes risk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prediction Form */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Metrics</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gender Selection - First Field */}
              <div className="md:col-span-2">
                <label htmlFor="gender" className="form-label">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={(e) => {
                    const error = !e.target.value ? 'Gender is required' : null;
                    setErrors(prev => error ? { ...prev, gender: error } : { ...prev, gender: undefined });
                  }}
                  className={`form-input ${errors.gender ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              {/* Pregnancies - Only show if female */}
              {formData.gender === 'female' && (
                <div>
                  <label htmlFor="pregnancies" className="form-label">
                    Pregnancies
                  </label>
                  <input
                    id="pregnancies"
                    name="pregnancies"
                    type="number"
                    value={formData.pregnancies}
                    onChange={handleChange}
                    onBlur={(e) => {
                      const error = validateField('pregnancies', e.target.value);
                      setErrors(prev => error ? { ...prev, pregnancies: error } : { ...prev, pregnancies: undefined });
                    }}
                    className={`form-input ${errors.pregnancies ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    min={0}
                    max={20}
                    step={1}
                  />
                  {errors.pregnancies && (
                    <p className="mt-1 text-sm text-red-600">{errors.pregnancies}</p>
                  )}
                </div>
              )}

              {/* Other Health Metrics */}
              {[
                { name: 'glucose', label: 'Glucose (mg/dL)', type: 'number', min: 0, max: 400, required: true },
                { name: 'bloodPressure', label: 'Blood Pressure (mm Hg)', type: 'number', min: 0, max: 220 },
                { name: 'skinThickness', label: 'Skin Thickness (mm)', type: 'number', min: 0, max: 99 },
                { name: 'insulin', label: 'Insulin (μU/ml)', type: 'number', min: 0, max: 846 },
                { name: 'bmi', label: 'BMI', type: 'number', step: '0.1', min: 5, max: 67.1, required: true },
                { name: 'diabetesPedigreeFunction', label: 'Diabetes Pedigree', type: 'number', step: '0.001', min: 0, max: 2.42 },
                { name: 'age', label: 'Age', type: 'number', min: 1, max: 120, required: true }
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="form-label">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name]}
                    onChange={handleChange}
                    onBlur={(e) => {
                      const error = validateField(field.name, e.target.value);
                      setErrors(prev => error ? { ...prev, [field.name]: error } : { ...prev, [field.name]: undefined });
                    }}
                    className={`form-input ${errors[field.name] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required={field.required}
                  />
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
                  )}
                </div>
              ))}
            </form>
            
            <button 
              type="submit" 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 btn-primary flex items-center justify-center space-x-2 text-lg py-4"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Predict Diabetes Risk</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {predictionResult ? (
              <div className="card text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Prediction Result</h2>
                <div className={`bg-gradient-to-r ${getRiskColor(predictionResult.riskLevel)} rounded-2xl p-8 text-white mb-6 transform hover:scale-105 transition-all duration-300`}>
                  <div className="text-6xl font-bold mb-4">{predictionResult.probability}%</div>
                  <div className="text-3xl font-semibold mb-2">
                    {predictionResult.result.toUpperCase()}
                  </div>
                  <div className="text-xl opacity-90">
                    {predictionResult.riskLevel} Risk
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation</h3>
                  <p className="text-gray-700 mb-4">
                    {predictionResult.riskLevel === 'high' 
                      ? 'We recommend consulting with a healthcare professional and following a strict diabetes management plan.'
                      : predictionResult.riskLevel === 'medium'
                      ? 'Maintain a healthy lifestyle with regular exercise and balanced diet. Monitor your health regularly.'
                      : 'Continue with your healthy lifestyle habits and regular health checkups.'
                    }
                  </p>
                  <Link
                    to="/recommendation"
                    className="btn-secondary inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Get Diet Plan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready for Analysis</h3>
                <p className="text-gray-600">
                  Fill out the health metrics form to get your personalized diabetes risk prediction.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prediction;
