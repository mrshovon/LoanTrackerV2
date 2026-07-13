// Simple static file server for Loan Tracker
const express = require('express');
const path = require('path');
const sendWelcome = require('./api/send-welcome');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies (Vercel does this for us in production)
app.use(express.json());

// API routes - must be registered before the SPA catch-all below.
// In production Vercel serves these from /api directly (see vercel.json).
app.post('/api/send-welcome', sendWelcome);

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for all routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Loan Tracker is running on http://localhost:${PORT}`);
    if (!process.env.RESEND_API_KEY) {
        console.log('Note: RESEND_API_KEY is not set - welcome emails will not be sent.');
    }
    console.log('Press Ctrl+C to stop the server');
});
