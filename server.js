// Example Node.js server to handle the LinkedIn OAuth redirect
const express = require('express');
const app = express();

const privacyPolicyContent = `
  <html>
    <head>
      <title>Privacy Policy</title>
    </head>
    <body>
      <h1>Privacy Policy</h1>
      <p>Effective Date: [Insert Date]</p>
      <h2>1. Introduction</h2>
      <p>Welcome to our app. Your privacy is important to us. This privacy policy outlines how we collect, use, and protect your personal information.</p>
      <h2>2. Information We Collect</h2>
      <p>We collect data such as your LinkedIn profile details for the purpose of authentication and content posting.</p>
      <h2>3. How We Use Your Information</h2>
      <p>We use your information to authenticate and post content on your behalf on LinkedIn. We do not share your information with third parties.</p>
      <h2>4. Data Protection</h2>
      <p>We take reasonable steps to protect your information from unauthorized access or disclosure.</p>
      <h2>5. User Rights</h2>
      <p>You can request to delete your data or revoke our access at any time by contacting us.</p>
      <h2>6. Changes to This Policy</h2>
      <p>We may update this privacy policy from time to time. Please check this page regularly for any updates.</p>
      <p>For more information, please contact us at support@yourapp.com.</p>
    </body>
  </html>
`;

app.get('/privacy-policy', (req, res) => {
  res.send(privacyPolicyContent);
});

app.get('/linkedin/callback', (req, res) => {
  const code = req.query.code;
  // Use LinkedIn API to exchange authorization code for access token
  res.send('Received code: ' + code);
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
}); 