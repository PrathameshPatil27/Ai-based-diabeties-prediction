import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { predictionService, recommendationService } from '../services';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPredictions: 0,
    totalRecommendations: 0,
    recentPrediction: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [predictionsRes, recommendationsRes] = await Promise.all([
        predictionService.getHistory(),
        recommendationService.getHistory()
      ]);

      const predictions = Array.isArray(predictionsRes) ? predictionsRes : (predictionsRes?.data?.predictions || []);
      const recommendations = Array.isArray(recommendationsRes) ? recommendationsRes : (recommendationsRes?.data?.recommendations || []);

      const latest = predictions[0];
      let recentPrediction = null;
      if (latest?.result) {
        const pct = Math.round((latest.result.probability || 0) * 100);
        const riskLevel = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
        recentPrediction = {
          probability: pct,
          riskLevel,
          predictionResult: latest.result.hasDiabetes ? 'Positive' : 'Negative',
          modelUsed: latest.result.modelVersion || 'v1',
        };
      }

      setStats({
        totalPredictions: predictions.length,
        totalRecommendations: recommendations.length,
        recentPrediction
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, <span className="text-gradient">{user?.name}</span>!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your health journey and get personalized recommendations for diabetes management.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="card text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalPredictions}</h3>
            <p className="text-gray-600">Total Predictions</p>
          </div>

          <div className="card text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalRecommendations}</h3>
            <p className="text-gray-600">Diet Plans</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link
                to="/prediction"
                className="w-full btn-primary flex items-center justify-center space-x-3 text-lg py-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Make Prediction</span>
              </Link>
              
              <Link
                to="/recommendation"
                className="w-full btn-secondary flex items-center justify-center space-x-3 text-lg py-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Get Diet Recommendation</span>
              </Link>
            </div>
          </div>

          {/* Recent Prediction */}
          {stats.recentPrediction && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Prediction</h2>
              <div className={`bg-gradient-to-r ${getRiskColor(stats.recentPrediction.riskLevel)} rounded-2xl p-6 text-white transform hover:scale-105 transition-all duration-300`}>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{stats.recentPrediction.probability}%</div>
                  <div className="text-2xl font-semibold mb-4">
                    {stats.recentPrediction.predictionResult.toUpperCase()}
                  </div>
                  <div className="text-lg opacity-90">
                    Risk Level: <span className="font-semibold">{stats.recentPrediction.riskLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Health Tips */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🍎', text: 'Monitor blood sugar regularly' },
              { icon: '🏃', text: 'Exercise for 30 minutes daily' },
              { icon: '🥗', text: 'Eat balanced meals' },
              { icon: '💧', text: 'Stay hydrated throughout the day' }
            ].map((tip, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center hover:bg-primary-50 transition-colors duration-200">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <p className="text-sm text-gray-700">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;