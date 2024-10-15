const express = require('express');
const axios = require('axios');
require('dotenv').config();
const slackApp = require('./src/app'); // Import the Slack Bolt app

const app = express();

// Middleware to parse request bodies
app.use(express.json());

// Route for Slack Events API
// Route for Slack Events API
app.post('/slack/events', async (req, res) => {
    console.log("Incoming Slack Event:", JSON.stringify(req.body, null, 2)); // Log the incoming request body

    const slackRequest = req.body;

    // Check if the event property exists
    if (!slackRequest || !slackRequest.event) {
        console.error("Invalid Slack event payload");
        return res.status(400).send('Invalid request payload');
    }

    try {
        await slackApp.processEvent(slackRequest); // Process the event
        res.sendStatus(200); // Respond back to Slack that the event was received
    } catch (error) {
        console.error("Error processing Slack event:", error);
        res.status(500).send('Error processing event');
    }
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

// Start the Express server
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Express server is running on http://localhost:${PORT}`);
});
