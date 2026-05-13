const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function evaluateRisk(answers) {
  const prompt = `
Sen mehribon, samimiy va O'zbekiston madaniyatini yaxshi biladigan malakali shifokorsan (endokrinolog).
Foydalanuvchining quyidagi savollarga bergan javoblariga asoslanib, qandli diabet xavfini bahola:
${JSON.stringify(answers, null, 2)}

Sening vazifang - bemorga faqatgina quruq tibbiy faktlarni emas, balki samimiy maslahatlarni ham berish (masalan: "Ko'proq piyoda yuring, shirin choy o'rniga ko'k choy iching").

Quyidagi qat'iy talablarga rioya qil:
1. FAQATGINA bitta JSON obyekti qaytar.
2. Hech qanday qo'shimcha matn, markdown (masalan, \`\`\`json) yoki tushuntirishlar yozma.
3. JSON quyidagi formatda bo'lishi SHART:
{
  "risk_percentage": <0 dan 100 gacha bo'lgan raqam>,
  "explanation": "<O'zbek tilida qisqa, tushunarli, samimiy va foydali tibbiy maslahat (1-2 abzas)>"
}
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
    });

    let resultText = chatCompletion.choices[0]?.message?.content || "";
    
    // Robust Regex Parsing to handle Hallucinations (e.g. ```json ... ```)
    // Uses greedy matching to handle nested objects inside the JSON.
    const match = resultText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in AI response");
    }

    const cleanJsonStr = match[0];
    const result = JSON.parse(cleanJsonStr);
    
    return {
      risk_percentage: result.risk_percentage || 0,
      explanation: result.explanation || "Noma'lum xatolik."
    };
  } catch (error) {
    console.error("AI Evaluation Error:", error);
    return {
      risk_percentage: 0,
      explanation: "Tizimda xatolik yuz berdi. Iltimos keyinroq qayta urinib ko'ring."
    };
  }
}

async function chatWithDoctor(messages, context) {
  const systemPrompt = `
Sen mehribon, samimiy va O'zbekiston madaniyatini yaxshi biladigan malakali shifokorsan.
Bemor qandli diabet xavfini baholash testidan o'tdi.
Mana uning test natijasi haqida qisqacha ma'lumot:
${JSON.stringify(context, null, 2)}

Bemordan kelayotgan savollarga samimiy, tushunarli va o'zbek xalq tabobati/madaniyatiga mos (lekin asosan zamonaviy tibbiyotga asoslangan) javoblar ber.
Qisqa va aniq gapir.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    return chatCompletion.choices[0]?.message?.content || "Kechirasiz, hozir javob bera olmayman.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Xatolik yuz berdi, iltimos keyinroq qayta urinib ko'ring.";
  }
}

module.exports = { evaluateRisk, chatWithDoctor };
