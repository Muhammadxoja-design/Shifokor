const { Bot, session, InlineKeyboard } = require('grammy');
const { conversations, createConversation } = require('@grammyjs/conversations');
const { registerConversation } = require('./conversations/register');
const db = require('../db/database');
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

// Handle profile selection
bot.callbackQuery(/^profile_(.+)$/, async (ctx) => {
  const relationType = ctx.match[1]; // self, father, mother, other
  const telegramId = ctx.from.id;

  // Insert Profile into DB
  try {
    const stmt = db.prepare(`
      INSERT INTO Profiles (user_id, relation_type, name)
      VALUES (?, ?, ?)
    `);
    
    let profileName = "Foydalanuvchi";
    if (relationType === 'father') profileName = "Ota";
    else if (relationType === 'mother') profileName = "Ona";
    else if (relationType === 'other') profileName = "Yaqin inson";

    const info = stmt.run(telegramId, relationType, profileName);
    const profileId = info.lastInsertRowid;

    const webAppUrl = process.env.WEBAPP_URL || 'https://example.com';
    // Append profile_id to the webAppUrl
    const fullUrl = `${webAppUrl}?profile_id=${profileId}`;

    const inlineKeyboard = new InlineKeyboard().webApp("Testni boshlash", fullUrl);
    
    await ctx.editMessageText(`Yaxshi. ${profileName} uchun qandli diabet xavfini baholash uchun quyidagi tugmani bosing:`, {
      reply_markup: inlineKeyboard
    });
    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error("Profile creation error:", error);
    await ctx.answerCallbackQuery("Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
  }
});

// Catch errors
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  console.error(e);
});

module.exports = bot;
