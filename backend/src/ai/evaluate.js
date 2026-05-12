const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function evaluateRisk(answers) {
  const prompt = `
You are an expert medical triage AI. Analyze the user's diabetes symptoms.
Here are the user's answers to the questionnaire:
${JSON.stringify(answers, null, 2)}

Return ONLY a valid JSON object in this exact format:
{
  "risk_percentage": <number between 0 and 100>,
  "explanation": "<Short, clear actionable text in Uzbek explaining the risk and next steps.>"
}
Do not include any markdown, backticks, or conversational text. Just the JSON.
`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.2,
    });

    let resultText = chatCompletion.choices[0]?.message?.content || "";
    
    // Robust Regex Parsing to handle Hallucinations (e.g. ````json ... ````)
    // Find everything between the first { and the last }
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

module.exports = { evaluateRisk };
