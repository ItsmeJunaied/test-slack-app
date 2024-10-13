const express = require('express');
const axios = require('axios');
require('dotenv').config();
const { App } = require('@slack/bolt');
const { createHmac } = require('crypto');

// Initialize Slack Bolt app with Socket Mode enabled
const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true, // Enable Socket Mode
});

// Create Express app
const app = express();

// Middleware to parse request bodies
app.use(express.json());

// Route for Slack Events API
app.post('/slack/events', async (req, res) => {
    const slackRequest = req.body;

    // Optional: Verify Slack request signature
    const timestamp = req.headers['x-slack-request-timestamp'];
    const sigBasestring = `v0:${timestamp}:${JSON.stringify(slackRequest)}`;
    const signature = req.headers['x-slack-signature'];
    const hmac = createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
    const hash = `v0=${hmac.update(sigBasestring).digest('hex')}`;

    if (hash !== signature) {
        return res.status(400).send('Invalid signature');
    }

    // Process the event
    await slackApp.processEvent(slackRequest);
    res.sendStatus(200);
});

// Serve a basic HTML page at the root
app.get('/', (req, res) => {
    res.send('<h1>Hello from Slack Bolt!</h1><a href="/install">Install the App</a>');
});

// Route to initiate OAuth flow for Slack
app.get('/install', (req, res) => {
    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=channels:history,channels:read,chat:write,chat:write.customize,chat:write.public,commands,groups:history,groups:read,im:history,im:read,im:write,mpim:history,mpim:read,reactions:write,mpim:write,mpim:write.topic&user_scope=chat:write,users:read`;
    res.redirect(installUrl); // Redirect to Slack OAuth page
});

// Route to handle the OAuth redirect
app.get('/slack/oauth_redirect', async (req, res) => {
    const code = req.query.code;
    const clientId = process.env.SLACK_CLIENT_ID; // Use environment variable
    const clientSecret = process.env.SLACK_CLIENT_SECRET;

    try {
        const result = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                code: code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: 'https://your-public-url.com/slack/oauth_redirect'
            }
        });

        if (result.data.ok) {
            res.send('App installed successfully!');
        } else {
            res.status(500).send('Error: ' + result.data.error);
        }
    } catch (error) {
        res.status(500).send('Error during OAuth: ' + error.message);
    }
});

// Start the Slack Bolt app
(async () => {
    await slackApp.start(process.env.PORT || 3002);
    console.log('⚡️ Slack Bolt app is running!');
})();

// Start the Express server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});
