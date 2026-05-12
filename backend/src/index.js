require('dotenv').config();
const app = require('./server/app');
const bot = require('./bot/bot');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Start Express Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      
      // Prevent Render from sleeping by pinging itself every 14 minutes
      const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
      if (RENDER_URL) {
        setInterval(() => {
          console.log('Sending keep-alive ping to prevent sleep...');
          fetch(RENDER_URL).then(res => {
            console.log(`Keep-alive ping successful: ${res.status}`);
          }).catch(err => {
            console.error('Keep-alive ping failed:', err);
          });
        }, 14 * 60 * 1000); // 14 minutes
      }
    });

    // Start Telegram Bot
    bot.start({
      onStart: (botInfo) => {
        console.log(`Bot @${botInfo.username} started successfully.`);
      }
    });

  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();
