const axios = require('axios');

async function getDietRecommendation({ context }) {
  const apiKey = process.env.GEMINI_API_KEY;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const systemPrompt = `You are a registered dietitian creating diabetes-friendly diet plans.
Return concise JSON with keys: text, meals[], tips[], sources[].
Meals entries must include name, calories, carbs, protein, fat.
Keep carbs moderate and low glycemic. Consider user specifics.`;

  const userContext = JSON.stringify(context || {});
  const dietInstruction = context?.dietType === 'vegetarian'
    ? 'User follows a strict vegetarian diet. Do NOT include meat, fish, eggs, or gelatin. Prefer legumes, tofu, paneer, dairy, grains, vegetables, fruits, nuts, and seeds.'
    : 'User is non-vegetarian. You may include lean proteins like chicken, fish, eggs; avoid processed/red meats; balance plates.';

  // Using Google AI Studio REST format (v1)
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt },
          { text: dietInstruction },
          { text: `User context: ${userContext}. Return JSON only.` },
        ],
      },
    ],
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  let data;
  try {
    ({ data } = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } }));
  } catch (err) {
    // Log full error for debugging and bubble up a clear message
    const status = err?.response?.status;
    const errorBody = err?.response?.data;
    console.error('Gemini API error', { status, errorBody });
    const msg = errorBody?.error?.message || err?.message || 'Gemini API request failed';
    throw new Error(`Gemini error${status ? ' ' + status : ''}: ${msg}`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let parsed;
  try {
    const match = text.match(/\{[\s\S]*\}$/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(text);
  } catch (e) {
    parsed = { text, meals: [], tips: [], sources: [] };
  }

  parsed.model = model;
  return parsed;
}

module.exports = { getDietRecommendation };



