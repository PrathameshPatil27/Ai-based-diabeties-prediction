import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { predictionService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const Prediction = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const doc = await predictionService.predict(formData);
      const pct = Math.round((doc?.result?.probability || 0) * 100);
      const riskLevel = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
      setPredictionResult({
        probability: pct,
        riskLevel,
        result: doc?.result?.hasDiabetes ? 'Positive' : 'Negative',
      });
    } catch (error) {
      alert('Prediction failed: ' + error.message);
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
            Enter your health metrics to assess your diabetes risk using our AI-powered prediction model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prediction Form */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Metrics</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: 'pregnancies', label: 'Pregnancies', type: 'number', min: 0, max: 20 },
                { name: 'glucose', label: 'Glucose (mg/dL)', type: 'number', min: 0, max: 300 },
                { name: 'bloodPressure', label: 'Blood Pressure (mm Hg)', type: 'number', min: 0, max: 150 },
                { name: 'skinThickness', label: 'Skin Thickness (mm)', type: 'number', min: 0, max: 100 },
                { name: 'insulin', label: 'Insulin (μU/ml)', type: 'number', min: 0, max: 900 },
                { name: 'bmi', label: 'BMI', type: 'number', step: '0.1', min: 0, max: 70 },
                { name: 'diabetesPedigreeFunction', label: 'Diabetes Pedigree', type: 'number', step: '0.001', min: 0, max: 2.5 },
                { name: 'age', label: 'Age', type: 'number', min: 1, max: 120 }
              ].map((field) => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="form-label">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="form-input"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
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
