const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../db/database');
const { evaluateRisk } = require('../ai/evaluate');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../../../webapp/dist')));

// API Endpoint
app.post('/api/evaluate', async (req, res) => {
  const { telegram_id, answers } = req.body;

  if (!telegram_id || !answers) {
    return res.status(400).json({ error: "Missing telegram_id or answers" });
  }

  // 1. Evaluate Risk using AI
  const aiResult = await evaluateRisk(answers);

  // 2. Save Assessment to DB
  try {
    const stmt = db.prepare(`
      INSERT INTO Assessments (telegram_id, risk_percentage, ai_feedback)
      VALUES (?, ?, ?)
    `);
    stmt.run(telegram_id, aiResult.risk_percentage, aiResult.explanation);
  } catch (dbError) {
    console.error("Failed to save assessment:", dbError);
    // Even if db fails, return the AI result to user.
  }

  // 3. Return result to frontend
  res.json(aiResult);
});

// Fallback for React Router if needed (though we don't have routing here, just in case)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../webapp/dist/index.html'));
});

module.exports = app;
