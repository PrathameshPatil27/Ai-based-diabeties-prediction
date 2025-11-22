import { api } from './api';

export const predictionService = {
  async predict(data) {
    try {
      const response = await api.post('/prediction/predict', data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Prediction failed');
    }
  },

  async getHistory() {
    try {
      const response = await api.get('/prediction/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prediction history');
    }
  },

  async getPredictionById(id) {
    try {
      const response = await api.get(`/prediction/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prediction');
    }
  }
};
export default predictionService;