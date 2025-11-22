Backend for Diabetes Prediction + Diet Recommendation

Setup

- Copy .env.example to .env and fill values
- npm install
- npm run dev

Endpoints (base /api)

- POST /auth/register { name, email, password }
- POST /auth/login { email, password }
- GET /auth/profile (Bearer token)
- PUT /auth/profile (Bearer token)
- POST /prediction/predict (Bearer token) -> saves result
- GET /prediction/history (Bearer token)
- GET /prediction/:id (Bearer token)
- POST /recommendation/generate { predictionId?, context? } (Bearer token)
- GET /recommendation/history (Bearer token)
- GET /recommendation/:id (Bearer token)

Notes

- Uses MongoDB Atlas via Mongoose
- Uses Google Gemini API for diet recommendation



