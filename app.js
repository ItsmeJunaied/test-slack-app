const { App } = require('@slack/bolt');
const grammarRoutes = require('./routes/grammarRoutes'); 

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,

});

// Initialize routes for Slack commands and actions
app.command('/modal', grammarRoutes.handleModalCommand);
app.action('send_button', grammarRoutes.handleSendButton);
app.action('edit_button', grammarRoutes.handleEditButton);
app.view('user_input_modal', grammarRoutes.handleModalSubmit);
app.action('cancel_button', grammarRoutes.handleCancelButton);
app.action('send_original_button', grammarRoutes.handleSendOriginalButton);

module.exports = app;
