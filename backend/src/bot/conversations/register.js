const db = require('../../db/database');
const { Keyboard, InlineKeyboard } = require('grammy');

async function registerConversation(conversation, ctx) {
  // 1. First Name
  await ctx.reply("Assalomu alaykum! Iltimos, ismingizni kiriting:");
  const firstNameCtx = await conversation.wait();
  const firstName = firstNameCtx.message?.text;

  if (!firstName) {
    await ctx.reply("Ism noto'g'ri kiritildi. Qaytadan /start ni bosing.");
    return;
  }

  // 2. Last Name
  await ctx.reply("Familiyangizni kiriting:");
  const lastNameCtx = await conversation.wait();
  const lastName = lastNameCtx.message?.text;

  // 3. Gender
  const genderKeyboard = new Keyboard().text("Erkak").text("Ayol").resized().oneTime();
  await ctx.reply("Jinsingizni tanlang:", { reply_markup: genderKeyboard });
  const genderCtx = await conversation.wait();
  const gender = genderCtx.message?.text;

  // 4. Age
  await ctx.reply("Yoshingizni kiriting (masalan: 25):", { reply_markup: { remove_keyboard: true } });
  const ageCtx = await conversation.wait();
  const age = parseInt(ageCtx.message?.text, 10);

  if (isNaN(age)) {
    await ctx.reply("Yosh faqat raqamlarda kiritilishi kerak. Qaytadan /start ni bosing.");
    return;
  }

  // 5. Phone Number
  const phoneKeyboard = new Keyboard().requestContact("Telefon raqamni yuborish").resized().oneTime();
  await ctx.reply("Telefon raqamingizni yuboring (tugmani bosing):", { reply_markup: phoneKeyboard });
  const phoneCtx = await conversation.wait();
  const phoneNumber = phoneCtx.message?.contact?.phone_number || phoneCtx.message?.text;

  if (!phoneNumber) {
    await ctx.reply("Telefon raqam olinmadi. Qaytadan /start ni bosing.");
    return;
  }

  // Hide the keyboard
  const replyMarkup = { remove_keyboard: true };

  // Save User to DB
  try {
    const stmt = db.prepare(`
      INSERT INTO Users (telegram_id, first_name, last_name, gender, age, phone_number)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        first_name=excluded.first_name,
        last_name=excluded.last_name,
        gender=excluded.gender,
        age=excluded.age,
        phone_number=excluded.phone_number
    `);
    stmt.run(ctx.from.id, firstName, lastName, gender, age, phoneNumber);

    const inlineKeyboard = new InlineKeyboard()
      .text("O'zim uchun", "profile_self")
      .text("Otam uchun", "profile_father").row()
      .text("Onam uchun", "profile_mother")
      .text("Boshqa", "profile_other");
    
    await ctx.reply("Ro'yxatdan muvaffaqiyatli o'tdingiz! Kim uchun test topshiryapsiz?", {
      reply_markup: inlineKeyboard
    });

  } catch (error) {
    console.error("DB Error:", error);
    await ctx.reply("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.", { reply_markup: replyMarkup });
  }
}

module.exports = { registerConversation };
