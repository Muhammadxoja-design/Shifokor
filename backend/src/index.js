require('dotenv').config();
const app = require('./server/app');
const bot = require('./bot/bot');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // Start Express Server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
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
