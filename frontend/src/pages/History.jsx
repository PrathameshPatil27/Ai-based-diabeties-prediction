import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { predictionService } from '../services';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';

const History = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await predictionService.getHistory();
      setPredictions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (probability) => {
    const pct = Math.round((probability || 0) * 100);
    if (pct >= 70) return { level: 'high', color: 'red', label: 'High Risk' };
    if (pct >= 40) return { level: 'medium', color: 'yellow', label: 'Medium Risk' };
    return { level: 'low', color: 'green', label: 'Low Risk' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskColorClasses = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return 'from-red-500 to-red-600';
      case 'medium':
        return 'from-yellow-500 to-yellow-600';
      case 'low':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Prediction History
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            View all your diabetes risk predictions and track your health over time.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && predictions.length === 0 && (
          <div className="card text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Predictions Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't made any predictions yet. Start by making your first diabetes risk prediction.
            </p>
            <Link
              to="/prediction"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Make a Prediction</span>
            </Link>
          </div>
        )}

        {/* Predictions List */}
        {predictions.length > 0 && (
          <div className="space-y-6">
            {predictions.map((prediction) => {
              const risk = getRiskLevel(prediction.result?.probability);
              const probability = Math.round((prediction.result?.probability || 0) * 100);
              
              return (
                <div
                  key={prediction._id}
                  className="card hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Side - Prediction Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Prediction #{predictions.length - predictions.indexOf(prediction)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(prediction.createdAt)}
                          </p>
                        </div>
                        
                        {/* Risk Badge */}
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                          risk.level === 'high'
                            ? 'bg-red-100 text-red-800'
                            : risk.level === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {risk.label}
                        </div>
                      </div>

                      {/* Prediction Result */}
                      <div className={`bg-gradient-to-r ${getRiskColorClasses(risk.level)} rounded-xl p-6 text-white mb-4`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-4xl font-bold mb-2">{probability}%</div>
                            <div className="text-xl font-semibold">
                              {prediction.result?.hasDiabetes ? 'Positive' : 'Negative'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm opacity-90 mb-1">Model</div>
                            <div className="text-sm font-medium">
                              {prediction.result?.modelVersion || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Health Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Glucose</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {prediction.input?.glucose || 'N/A'} mg/dL
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">BMI</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {prediction.input?.bmi || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Age</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {prediction.input?.age || 'N/A'} years
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Blood Pressure</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {prediction.input?.bloodPressure || 'N/A'} mm Hg
                          </div>
                        </div>
                        {prediction.input?.gender === 'female' && prediction.input?.pregnancies !== undefined && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Pregnancies</div>
                            <div className="text-sm font-semibold text-gray-900">
                              {prediction.input.pregnancies}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default History;

