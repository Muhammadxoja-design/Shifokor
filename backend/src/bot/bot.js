const { Bot, session } = require('grammy');
const { conversations, createConversation } = require('@grammyjs/conversations');
const { registerConversation } = require('./conversations/register');
require('dotenv').config();

const bot = new Bot(process.env.BOT_TOKEN);

// Install the session plugin
bot.use(session({ initial: () => ({}) }));

// Install the conversations plugin
bot.use(conversations());

// Register the conversation
bot.use(createConversation(registerConversation));

bot.command("start", async (ctx) => {
  await ctx.conversation.enter("registerConversation");
});

// Catch errors
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  console.error(e);
});

module.exports = bot;
