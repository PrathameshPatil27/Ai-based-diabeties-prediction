const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectToDatabase } = require('./config');

// Load env
dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/prediction', require('./routes/prediction'));
app.use('/api/recommendation', require('./routes/recommendation'));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Failed to connect to database', error);
    process.exit(1);
  });

module.exports = app;



