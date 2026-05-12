import React, { useState, useEffect } from 'react';
import { ShieldAlert, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const QUESTIONS = [
  { id: 'q1', text: "Siz tez-tez chanqaysizmi va og'zingiz quriydimi?" },
  { id: 'q2', text: "Tez-tez peshob qilasizmi (ayniqsa tunda)?" },
  { id: 'q3', text: "Doimiy charchoq yoki holsizlik sezasizmi?" },
  { id: 'q4', text: "Oila a'zolaringizda qandli diabet bilan kasallanganlar bormi?" },
  { id: 'q5', text: "So'nggi paytlarda sababsiz vazn yo'qotdingizmi?" },
  { id: 'q6', text: "Yaralar sekin tuzalishi yoki ko'rishning xiralashishi kuzatilyaptimi?" }
];

export default function App() {
  const [agreed, setAgreed] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.backgroundColor = '#0f172a';
      tg.headerColor = '#0f172a';
    }
  }, []);

  const handleAnswer = (answer) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: answer }));
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment({ ...answers, [QUESTIONS[currentQuestion].id]: answer });
    }
  };

  const submitAssessment = async (finalAnswers) => {
    setLoading(true);
    const tg = window.Telegram?.WebApp;
    const telegram_id = tg?.initDataUnsafe?.user?.id || 123456789; // fallback for local dev

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id, answers: finalAnswers }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ risk_percentage: 0, explanation: "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring." });
    } finally {
      setLoading(false);
    }
  };

  if (!agreed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-6 animate-fade-in text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4 text-white">Tibbiy Ogohlantirish</h1>
        <p className="text-slate-300 mb-8 max-w-sm leading-relaxed">
          Ushbu tizim qandli diabet xavfini sun'iy intellekt yordamida **faqat taxminiy** baholaydi. U aniq tibbiy tashxis emas. Iltimos, har qanday sog'liq bilan bog'liq muammo yuzasidan haqiqiy shifokorga murojaat qiling.
        </p>
        <button 
          onClick={() => setAgreed(true)}
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors active:scale-95 text-lg"
        >
          Roziman va tushundim
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center animate-bloooop border border-slate-700">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="45" stroke="#1e293b" strokeWidth="6" fill="none" />
              <circle cx="48" cy="48" r="45" stroke={result.risk_percentage > 50 ? '#ef4444' : '#22c55e'} strokeWidth="6" fill="none" 
                strokeDasharray="283" strokeDashoffset={283 - (283 * result.risk_percentage) / 100} 
                className="transition-all duration-1000 ease-out" />
            </svg>
            <span className="text-3xl font-bold text-white">{result.risk_percentage}%</span>
          </div>
          <h2 className="text-xl font-bold mb-4 text-white">Natija</h2>
          <p className="text-slate-300 mb-6">{result.explanation}</p>
          <button 
            onClick={() => window.Telegram?.WebApp?.close()}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-xl transition-colors active:scale-95"
          >
            Yopish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-slate-900">
      <div className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-xl font-bold flex items-center text-white"><Activity className="w-6 h-6 mr-2 text-blue-500" /> Shifokor AI</h1>
        <span className="text-slate-400 font-medium">{currentQuestion + 1} / {QUESTIONS.length}</span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 mb-10 overflow-hidden">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative overflow-hidden">
        {QUESTIONS.map((q, idx) => (
          idx === currentQuestion && (
            <div key={q.id} className="animate-slide-in absolute inset-0 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-white mb-10 leading-tight">
                {q.text}
              </h2>
              
              <div className="space-y-4 w-full mt-auto mb-8">
                <button 
                  onClick={() => handleAnswer('Ha')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-4 px-6 rounded-2xl flex justify-between items-center transition-colors active:bg-slate-600"
                >
                  <span className="text-xl">Ha</span>
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </button>
                <button 
                  onClick={() => handleAnswer('Yo\'q')}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-4 px-6 rounded-2xl flex justify-between items-center transition-colors active:bg-slate-600"
                >
                  <span className="text-xl">Yo'q</span>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-500"></div>
                </button>
              </div>
            </div>
          )
        ))}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 animate-fade-in">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-lg font-medium text-slate-300">AI tahlil qilmoqda...</p>
          </div>
        )}
      </div>
    </div>
  );
}
