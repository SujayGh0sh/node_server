// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());

// // 🔐 Step 1: Start OAuth with LinkedIn
// app.get('/auth/linkedin', (req, res) => {
//   const scope = 'openid profile email w_member_social';

//   const authUrl = `https://www.linkedin.com/oauth/v2/authorization` +
//     `?response_type=code` +
//     `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
//     `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
//     `&scope=${encodeURIComponent(scope)}`;

//   console.log('[LOG] Redirecting to LinkedIn Auth URL:', authUrl);
//   res.redirect(authUrl);
// });

// // 🔁 Step 2: OAuth Callback
// app.get('/auth/linkedin/callback', async (req, res) => {
//   console.log('[LOG] Callback received with query:', req.query);

//   const code = req.query.code;
//   if (!code) return res.status(400).send('Missing "code"');

//   try {
//     const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
//       params: {
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: process.env.REDIRECT_URI,
//         client_id: process.env.LINKEDIN_CLIENT_ID,
//         client_secret: process.env.LINKEDIN_CLIENT_SECRET
//       },
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//     });

//     const accessToken = tokenRes.data.access_token;
//     console.log('[LOG] LinkedIn access token:', accessToken);

//     // ✅ Return to Flutter via deep link
//     res.redirect(`yourapp://callback?token=${accessToken}`);
//   } catch (err) {
//     console.error('[ERROR] Token exchange failed:', err.response?.data || err.message);
//     res.status(500).send('LinkedIn authentication failed');
//   }
// });

// // 🧑‍💼 Fetch LinkedIn Profile (optional display)
// app.get('/profile', async (req, res) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).send('Missing access token');

//   try {
//     const profile = await axios.get('https://api.linkedin.com/v2/userinfo', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     console.log('[LOG] Profile fetched:', profile.data);
//     res.json(profile.data);
//   } catch (err) {
//     console.error('[ERROR] Failed to fetch profile:', err.response?.data || err.message);
//     res.status(500).send('Failed to fetch profile');
//   }
// });

// // 🤖 Generate LinkedIn Post Content using Gemini
// app.post('/generate/content', async (req, res) => {
//   const { topic, tone, audience, history } = req.body;
//   const prompt = `Generate a LinkedIn post on "${topic}" in a "${tone}" tone for a "${audience}" audience. Base the tone on previous posts like: ${history}`;

//   try {
//     const geminiRes = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }]
//       }
//     );

//     const content = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated.';
//     console.log('[LOG] Gemini content generated:', content);
//     res.json({ content });
//   } catch (err) {
//     console.error('[ERROR] Gemini API failed:', err.response?.data || err.message);
//     res.status(500).send('Gemini content generation failed');
//   }
// });

// app.post('/generate/image', async (req, res) => {
//   const { topic } = req.body;
//   const prompt = `Create a high-quality illustration relevant to the LinkedIn post topic: "${topic}".`;

//   try {
//     const geminiRes = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: {
//           responseModalities: ["TEXT", "IMAGE"]
//         }
//       }
//     );

//     const imagePart = geminiRes.data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

//     if (imagePart && imagePart.inlineData) {
//       const base64Image = imagePart.inlineData.data;
//       const mimeType = imagePart.inlineData.mimeType;
//       res.json({ image: `data:${mimeType};base64,${base64Image}` });
//     } else {
//       const generatedText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
//       if (generatedText) {
//         console.log('[LOG] Gemini returned text instead of image:', generatedText);
//         return res.status(500).send('Image generation failed: API returned text.');
//       }
//       console.error('[ERROR] Invalid response from Gemini, expected image:', JSON.stringify(geminiRes.data, null, 2));
//       res.status(500).send('Image generation failed: No image data in response');
//     }

//   } catch (err) {
//     let errorDetails = err.message;
//     if (err.response && err.response.data) {
//         try {
//             errorDetails = JSON.parse(err.response.data.toString('utf-8'));
//         } catch(e) {
//             errorDetails = err.response.data.toString('utf-8');
//         }
//     }
//     console.error('[ERROR] Gemini image generation failed:', JSON.stringify(errorDetails, null, 2));
//     res.status(500).send('Image generation failed');
//   }
// });

// app.post('/post-to-linkedin-auto', async (req, res) => {
//   let { token, content, author } = req.body;

//   if (!token || !content) {
//     return res.status(400).send('Missing required fields: token, content');
//   }

//   // If author is missing or not in the correct format, fetch the userinfo
//   if (!author || !author.startsWith('urn:li:person:')) {
//     try {
//       const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       const sub = profileRes.data.sub;
//       if (!sub) {
//         return res.status(400).send('Unable to fetch LinkedIn user ID');
//       }
//       author = `urn:li:person:${sub}`;
//     } catch (err) {
//       console.error('[ERROR] Failed to fetch LinkedIn user ID:', err.response?.data || err.message);
//       return res.status(500).send('Failed to fetch LinkedIn user ID');
//     }
//   }

//   try {
//     const response = await axios.post(
//       'https://api.linkedin.com/v2/ugcPosts',
//       {
//         author,
//         lifecycleState: 'PUBLISHED',
//         specificContent: {
//           'com.linkedin.ugc.ShareContent': {
//             shareCommentary: {
//               text: content
//             },
//             shareMediaCategory: 'NONE'
//           }
//         },
//         visibility: {
//           'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
//         }
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'X-Restli-Protocol-Version': '2.0.0',
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     console.log('[LOG] LinkedIn post successful:', response.data);
//     res.send({ status: 'success', postUrn: response.data });
//   } catch (err) {
//     console.error('[ERROR] LinkedIn post failed:', err.response?.data || err.message);
//     res.status(500).send('Failed to post to LinkedIn');
//   }
// });

// // ✅ Server start
// app.listen(3000, () => {
//   console.log('[SERVER] Running on http://localhost:3000');
// });

// ✅ Updated Node.js Backend for LinkedIn Content + Image Posting

// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: '10mb' })); // Allow large payload for image

// // 🔐 Step 1: LinkedIn OAuth
// app.get('/auth/linkedin', (req, res) => {
//   const scope = 'openid profile email w_member_social';
//   const authUrl = `https://www.linkedin.com/oauth/v2/authorization` +
//     `?response_type=code` +
//     `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
//     `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
//     `&scope=${encodeURIComponent(scope)}`;
//   res.redirect(authUrl);
// });

// // 🔁 Step 2: OAuth callback
// app.get('/auth/linkedin/callback', async (req, res) => {
//   const code = req.query.code;
//   if (!code) return res.status(400).send('Missing "code"');

//   try {
//     const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
//       params: {
//         grant_type: 'authorization_code',
//         code,
//         redirect_uri: process.env.REDIRECT_URI,
//         client_id: process.env.LINKEDIN_CLIENT_ID,
//         client_secret: process.env.LINKEDIN_CLIENT_SECRET
//       },
//       headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//     });

//     const accessToken = tokenRes.data.access_token;
//     res.redirect(`yourapp://callback?token=${accessToken}`);
//   } catch (err) {
//     console.error('[OAuth ERROR]', err.response?.data || err.message);
//     res.status(500).send('LinkedIn authentication failed');
//   }
// });

// // 👤 Profile
// app.get('/profile', async (req, res) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).send('Missing access token');

//   try {
//     const profile = await axios.get('https://api.linkedin.com/v2/userinfo', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     res.json(profile.data);
//   } catch (err) {
//     res.status(500).send('Failed to fetch profile');
//   }
// });

// // 🤖 Generate text post
// app.post('/generate/content', async (req, res) => {
//   const { topic, tone, audience, history } = req.body;
//   const prompt = `Generate a LinkedIn post on "${topic}" in a "${tone}" tone for a "${audience}" audience. Based on: ${history}`;

//   try {
//     const geminiRes = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }]
//       }
//     );

//     const content = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated.';
//     res.json({ content });
//   } catch (err) {
//     res.status(500).send('Gemini content generation failed');
//   }
// });

// // 🎨 Generate image with Gemini
// app.post('/generate/image', async (req, res) => {
//   const { topic } = req.body;
//   const prompt = `Create a high-quality illustration relevant to the LinkedIn post topic: "${topic}".`;

//   try {
//     const geminiRes = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
//       }
//     );

//     const imagePart = geminiRes.data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
//     if (imagePart && imagePart.inlineData) {
//       const base64Image = imagePart.inlineData.data;
//       const mimeType = imagePart.inlineData.mimeType;
//       res.json({ image: `data:${mimeType};base64,${base64Image}` });
//     } else {
//       res.status(500).send('Image generation failed');
//     }
//   } catch (err) {
//     res.status(500).send('Gemini image generation failed');
//   }
// });

// // 📤 Upload image to LinkedIn
// app.post('/upload-image', async (req, res) => {
//   const { image, token } = req.body;

//   if (!image || !token) return res.status(400).send('Missing image or token');

//   try {
//     // Step 1: Register upload
//     const registerRes = await axios.post(
//       'https://api.linkedin.com/v2/assets?action=registerUpload',
//       {
//         registerUploadRequest: {
//           owner: `urn:li:person:${(await axios.get('https://api.linkedin.com/v2/userinfo', {
//             headers: { Authorization: `Bearer ${token}` },
//           })).data.sub}`,
//           recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
//           serviceRelationships: [
//             {
//               identifier: 'urn:li:userGeneratedContent',
//               relationshipType: 'OWNER',
//             },
//           ],
//           supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//           'X-Restli-Protocol-Version': '2.0.0',
//         },
//       }
//     );

//     const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
//     const asset = registerRes.data.value.asset;

//     // Step 2: Upload image (binary buffer from base64)
//     const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

//     await axios.put(uploadUrl, imageBuffer, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'image/png', // or image/jpeg if you change type
//         'Content-Length': imageBuffer.length,
//       },
//     });

//     res.json({ asset });
//   } catch (err) {
//     console.error('[ERROR] LinkedIn image upload failed:', err.response?.data || err.message);
//     res.status(500).send('Failed to upload image');
//   }
// });


// // 🚀 Post to LinkedIn (text + optional image)
// app.post('/post-to-linkedin-auto', async (req, res) => {
//   const { token, content, asset } = req.body;

//   if (!token || !content) return res.status(400).send('Missing content/token');

//   try {
//     const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     const authorUrn = `urn:li:person:${profileRes.data.sub}`;

//     const body = {
//       author: authorUrn,
//       lifecycleState: 'PUBLISHED',
//       specificContent: {
//         'com.linkedin.ugc.ShareContent': {
//           shareCommentary: { text: content },
//           shareMediaCategory: asset ? 'IMAGE' : 'NONE',
//           media: asset ? [{ status: 'READY', media: asset }] : []
//         }
//       },
//       visibility: {
//         'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
//       }
//     };

//     const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'X-Restli-Protocol-Version': '2.0.0',
//         'Content-Type': 'application/json'
//       }
//     });

//     res.send({ status: 'success', postUrn: response.data });
//   } catch (err) {
//     console.error('[POST ERROR]', err.response?.data || err.message);
//     res.status(500).send('Failed to post to LinkedIn');
//   }
// });

// // 🌐 Start server
// app.listen(3000, () => {
//   console.log('[SERVER] Running on http://localhost:3000');
// });


const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 🔧 Markdown to LinkedIn formatter
function formatMarkdownForLinkedIn(text) {
  return text
    .replace(/^##\s?(.*)$/gm, '🔹 $1'.toUpperCase())
    .replace(/\*\*(.*?)\*\*/g, '$1'.toUpperCase())
    .replace(/^\*\s?\*\*(.*?)\*\*/gm, '• $1')
    .replace(/^\*\s?(.*)$/gm, '• $1');
}

// 🔐 Step 1: LinkedIn OAuth
app.get('/auth/linkedin', (req, res) => {
  const scope = 'openid profile email w_member_social';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

// 🔁 Step 2: OAuth callback
app.get('/auth/linkedin/callback', async (req, res) => {
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
    res.redirect(`yourapp://callback?token=${accessToken}`);
  } catch (err) {
    console.error('[OAuth ERROR]', err.response?.data || err.message);
    res.status(500).send('LinkedIn authentication failed');
  }
});

// 👤 Profile
app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Missing access token');

  try {
    const profile = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(profile.data);
  } catch (err) {
    res.status(500).send('Failed to fetch profile');
  }
});

// 🤖 Generate text post
app.post('/generate/content', async (req, res) => {
  const { topic, tone, audience, history } = req.body;
  const prompt = `Generate a LinkedIn post on "${topic}" in a "${tone}" tone for a "${audience}" audience. Based on: ${history}`;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const content = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No content generated.';
    res.json({ content });
  } catch (err) {
    res.status(500).send('Gemini content generation failed');
  }
});

// 🎨 Generate image
app.post('/generate/image', async (req, res) => {
  const { topic } = req.body;
  const prompt = `Create a high-quality illustration relevant to the LinkedIn post topic: "${topic}".`;

  try {
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
      }
    );

    const imagePart = geminiRes.data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart && imagePart.inlineData) {
      const base64Image = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType;
      res.json({ image: `data:${mimeType};base64,${base64Image}` });
    } else {
      res.status(500).send('Image generation failed');
    }
  } catch (err) {
    res.status(500).send('Gemini image generation failed');
  }
});

// 📤 Upload image
app.post('/upload-image', async (req, res) => {
  const { image, token } = req.body;
  if (!image || !token) return res.status(400).send('Missing image or token');

  try {
    const registerRes = await axios.post(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        registerUploadRequest: {
          owner: `urn:li:person:${(await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          })).data.sub}`,
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          serviceRelationships: [
            { identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' },
          ],
          supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD'],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerRes.data.value.asset;
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
      },
    });

    res.json({ asset });
  } catch (err) {
    console.error('[ERROR] LinkedIn image upload failed:', err.response?.data || err.message);
    res.status(500).send('Failed to upload image');
  }
});

// 🚀 Post to LinkedIn
app.post('/post-to-linkedin-auto', async (req, res) => {
  const { token, content, asset } = req.body;
  if (!token || !content) return res.status(400).send('Missing content/token');

  try {
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const authorUrn = `urn:li:person:${profileRes.data.sub}`;
    const formattedContent = formatMarkdownForLinkedIn(content);

    const body = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: formattedContent },
          shareMediaCategory: asset ? 'IMAGE' : 'NONE',
          media: asset ? [{ status: 'READY', media: asset }] : []
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    });

    res.send({ status: 'success', postUrn: response.data });
  } catch (err) {
    console.error('[POST ERROR]', err.response?.data || err.message);
    res.status(500).send('Failed to post to LinkedIn');
  }
});

// ✅ Start server
app.listen(3000, () => {
  console.log('[SERVER] Running on http://localhost:3000');
});
