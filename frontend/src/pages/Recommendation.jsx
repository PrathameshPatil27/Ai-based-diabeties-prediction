import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { recommendationService, predictionService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';

const Recommendation = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    dietType: user?.isVegetarian ? 'vegetarian' : 'non-vegetarian',
    riskLevel: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);

  // Fetch latest prediction and auto-fill risk level
  useEffect(() => {
    const fetchLatestPrediction = async () => {
      try {
        setLoadingPrediction(true);
        const predictions = await predictionService.getHistory();
        
        if (predictions && predictions.length > 0) {
          // Get the most recent prediction (first one in sorted list)
          const latestPrediction = predictions[0];
          
          if (latestPrediction?.result?.probability !== undefined) {
            // Calculate risk level from probability (same logic as Prediction page)
            const pct = Math.round((latestPrediction.result.probability || 0) * 100);
            const riskLevel = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
            
            // Auto-fill the risk level
            setFormData(prev => ({
              ...prev,
              riskLevel: riskLevel
            }));
          }
        }
      } catch (error) {
        // Silently fail - just use default risk level if prediction fetch fails
        console.log('Could not fetch latest prediction:', error.message);
      } finally {
        setLoadingPrediction(false);
      }
    };

    fetchLatestPrediction();
  }, []);

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
      // Backend expects { predictionId?, context }
      const record = await recommendationService.generate({ context: formData });
      // Prefer current form selection and merge any backend-added fields
      const ctx = { ...formData, ...(record?.context || {}) };
      const resp = record?.response || {};

      // Map backend response to UI shape expected here
      const meals = Array.isArray(resp.meals) ? resp.meals : [];
      const breakfast = meals[0]?.name || 'Oatmeal with nuts and seeds';
      const lunch = meals[1]?.name || 'Grilled chicken/sprouts salad with veggies';
      const dinner = meals[2]?.name || 'Dal/lentils with vegetables and brown rice';
      const snacks = meals[3]?.name || 'Greek yogurt or handful of nuts';
      const tipsList = Array.isArray(resp.tips) ? resp.tips : [
        'Stay hydrated and prioritize high-fiber foods',
        'Prefer low GI carbs and balance plates with protein',
      ];

      const oneDay = {
        day: 'day 1',
        meals: { breakfast, lunch, dinner, snacks },
        exercise: '30–45 min brisk walk or light cardio; 10 min stretching',
        tips: tipsList,
      };
      const dailyPlan = Array.from({ length: 7 }, (_, i) => ({
        ...oneDay,
        day: `day ${i + 1}`,
      }));

      // Client-side safeguard for vegetarian selection
      if ((ctx.dietType || formData.dietType) === 'vegetarian') {
        dailyPlan.forEach((day) => {
          const replaceIfNonVeg = (text) => {
            if (!text) return text;
            const lower = text.toLowerCase();
            if (/(chicken|fish|egg|prawn|shrimp|mutton|beef|pork|turkey|salmon|tuna)/.test(lower)) {
              // Replace with common vegetarian alternatives
              if (/breakfast/.test(lower)) return 'Vegetable upma with nuts';
              if (/snack/.test(lower)) return 'Roasted chana and nuts';
              // General replacement
              return 'Paneer/tofu with vegetables and brown rice';
            }
            return text;
          };
          day.meals.breakfast = replaceIfNonVeg(day.meals.breakfast);
          day.meals.lunch = replaceIfNonVeg(day.meals.lunch);
          day.meals.dinner = replaceIfNonVeg(day.meals.dinner);
          day.meals.snacks = replaceIfNonVeg(day.meals.snacks);
        });
      }

      setRecommendation({
        dietType: (ctx.dietType || formData.dietType || 'non-vegetarian'),
        riskLevel: ctx.riskLevel || 'medium',
        dailyPlan,
      });
    } catch (error) {
      alert('Failed to generate recommendation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Personalized Diet Recommendation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get a 7-day diabetes-friendly diet plan tailored to your preferences and risk level.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recommendation Form */}
          <div className="card lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preferences</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="dietType" className="form-label">
                  Diet Type
                </label>
                <select
                  id="dietType"
                  name="dietType"
                  value={formData.dietType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label htmlFor="riskLevel" className="form-label">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loadingPrediction}
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2 text-lg py-4"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Generating Plan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Generate Diet Plan</span>
                  </>
                )}
              </button>
            </form>

            {/* Health Tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Health Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Monitor blood sugar levels regularly</li>
                <li>• Stay hydrated throughout the day</li>
                <li>• Include fiber-rich foods in your diet</li>
                <li>• Exercise for at least 30 minutes daily</li>
              </ul>
            </div>
          </div>

          {/* Recommendation Results */}
          <div className="lg:col-span-2">
            {recommendation ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your 7-Day Diabetes Diet Plan
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                      {recommendation.dietType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      recommendation.riskLevel === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : recommendation.riskLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {recommendation.riskLevel} Risk
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {recommendation.dailyPlan.map((day, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                    >
                      <h3 className="text-xl font-semibold text-primary-600 mb-4 capitalize">
                        {day.day}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Meals
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Breakfast:</span>
                              <p className="text-gray-600">{day.meals.breakfast}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Lunch:</span>
                              <p className="text-gray-600">{day.meals.lunch}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Dinner:</span>
                              <p className="text-gray-600">{day.meals.dinner}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Snacks:</span>
                              <p className="text-gray-600">{day.meals.snacks}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Exercise & Tips
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <span className="font-medium text-gray-700">Exercise:</span>
                              <p className="text-gray-600 text-sm mt-1">{day.exercise}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Health Tips:</span>
                              <ul className="text-gray-600 text-sm mt-1 space-y-1">
                                {day.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex}>• {tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Important Notes</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Consult with your healthcare provider before making dietary changes</li>
                    <li>• Monitor your blood sugar levels regularly</li>
                    <li>• Stay consistent with your meal timings</li>
                    <li>• Drink plenty of water throughout the day</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="card text-center h-full flex items-center justify-center">
                <div className="max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready for Your Diet Plan</h3>
                  <p className="text-gray-600 mb-6">
                    Select your preferences and generate a personalized 7-day diabetes-friendly diet plan powered by AI.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> For best results, complete a diabetes risk prediction first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendation;