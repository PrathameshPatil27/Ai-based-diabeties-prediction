import { api } from './api';

export const recommendationService = {
  async generate(data) {
    try {
      const response = await api.post('/recommendation/generate', data);
      return response.data;
    } catch (error) {
      // Prefer error.message because our axios interceptor already normalizes backend errors
      throw new Error(error?.message || error.response?.data?.message || 'Failed to generate recommendation');
    }
  },

  async getHistory() {
    try {
      const response = await api.get('/recommendation/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recommendation history');
    }
  },

  async getRecommendationById(id) {
    try {
      const response = await api.get(`/recommendation/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recommendation');
    }
  }
};
export default recommendationService;