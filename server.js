const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Step 1: Start OAuth with LinkedIn
app.get('/auth/linkedin', (req, res) => {
  const scope = 'openid profile email w_member_social';

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}`;

  console.log('[LOG] Redirecting to LinkedIn Auth URL:', authUrl);
  res.redirect(authUrl);
});

// 🔁 Step 2: OAuth Callback
app.get('/auth/linkedin/callback', async (req, res) => {
  console.log('[LOG] Callback received with query:', req.query);

  const code = req.query.code;
  if (!code) return res.status(400).send('Missing "code"');

  try {
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;
    console.log('[LOG] LinkedIn access token:', accessToken);

    // ✅ Return to Flutter via deep link
    res.redirect(`yourapp://callback?token=${accessToken}`);
  } catch (err) {
    console.error('[ERROR] Token exchange failed:', err.response?.data || err.message);
    res.status(500).send('LinkedIn authentication failed');
  }
});

// 🧑‍💼 Fetch LinkedIn Profile (optional display)
app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Missing access token');

  try {
    const profile = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('[LOG] Profile fetched:', profile.data);
    res.json(profile.data);
  } catch (err) {
    console.error('[ERROR] Failed to fetch profile:', err.response?.data || err.message);
    res.status(500).send('Failed to fetch profile');
  }
});

// 🤖 Generate LinkedIn Post Content using Gemini
app.post('/generate/content', async (req, res) => {
  const { topic, tone, audience, history } = req.body;
  const prompt = `Generate a LinkedIn post on "${topic}" in a "${tone}" tone for a "${audience}" audience. Base the tone on previous posts like: ${history}`;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const content = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated.';
    console.log('[LOG] Gemini content generated:', content);
    res.json({ content });
  } catch (err) {
    console.error('[ERROR] Gemini API failed:', err.response?.data || err.message);
    res.status(500).send('Gemini content generation failed');
  }
});

app.post('/generate/image', async (req, res) => {
  const { topic } = req.body;
  const prompt = `Create a high-quality illustration relevant to the LinkedIn post topic: "${topic}".`;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'image/png'
        }
      },
      {
        responseType: 'arraybuffer', // Important to receive image data
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const base64Image = Buffer.from(geminiRes.data, 'binary').toString('base64');
    res.send({ image: `data:image/png;base64,${base64Image}` });
  } catch (err) {
    console.error('[ERROR] Gemini image generation failed:', err.response?.data || err.message);
    res.status(500).send('Image generation failed');
  }
});

// ✅ Server start
app.listen(3000, () => {
  console.log('[SERVER] Running on http://localhost:3000');
});
