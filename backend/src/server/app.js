const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../db/database');
const { evaluateRisk, chatWithDoctor } = require('../ai/evaluate');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../../../webapp/dist')));

// API Endpoint
app.post('/api/evaluate', async (req, res) => {
  const { profile_id, answers } = req.body;

  if (!profile_id || !answers) {
    return res.status(400).json({ error: "Missing profile_id or answers" });
  }

  // 1. Evaluate Risk using AI
  const aiResult = await evaluateRisk(answers);

  // 2. Save Assessment to DB
  try {
    const stmt = db.prepare(`
      INSERT INTO Assessments (profile_id, risk_percentage, ai_feedback)
      VALUES (?, ?, ?)
    `);
    stmt.run(profile_id, aiResult.risk_percentage, aiResult.explanation);
  } catch (dbError) {
    console.error("Failed to save assessment:", dbError);
    // Even if db fails, return the AI result to user.
  }

  // 3. Return result to frontend
  res.json(aiResult);
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid messages array" });
  }

  const reply = await chatWithDoctor(messages, context);
  res.json({ reply });
});

// Fallback for React Router if needed (though we don't have routing here, just in case)
app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../webapp/dist/index.html'));
});

module.exports = app;
