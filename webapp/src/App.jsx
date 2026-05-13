import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, ChevronRight, Activity, CheckCircle2, Share2, MessageCircle, Send } from 'lucide-react';
import { clsx } from 'clsx';
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
  
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.backgroundColor = '#0f172a';
      tg.headerColor = '#0f172a';
    }
  }, []);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

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
    
    const params = new URLSearchParams(window.location.search);
    const profile_id = params.get('profile_id') || 1; // fallback for local dev

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id, answers: finalAnswers }),
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ risk_percentage: 0, explanation: "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring." });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (tg) {
      const shareText = `Men qandli diabet xavfini aniqlash testidan o'tdim! Mening xavf ko'rsatkichim ${result.risk_percentage}%. O'zingizni ham tekshirib ko'ring!`;
      tg.switchInlineQuery(shareText, ['users', 'groups', 'channels']);
    } else {
      alert("Faqat Telegram ichida ulashish mumkin.");
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: result
        }),
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!agreed) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-6 animate-fade-in text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4 text-white">Tibbiy Ogohlantirish</h1>
        <p className="text-slate-300 mb-8 max-w-sm leading-relaxed">
          Ushbu tizim qandli diabet xavfini sun'iy intellekt yordamida baholaydi. U aniq tibbiy tashxis emas. Iltimos, har qanday sog'liq bilan bog'liq muammo yuzasidan haqiqiy shifokorga murojaat qiling.
        </p>
        <button 
          onClick={() => setAgreed(true)}
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-colors active:scale-95 text-lg"
        >
          Roziman
        </button>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-white animate-fade-in">
        <div className="p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700 sticky top-0 z-10">
          <h2 className="font-bold flex items-center text-lg"><Activity className="w-5 h-5 mr-2 text-blue-500" /> Shifokor AI</h2>
          <button onClick={() => setShowChat(false)} className="text-sm text-slate-400 hover:text-white">Orqaga</button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-slate-800 p-4 rounded-xl rounded-tl-none border border-slate-700 max-w-[85%]">
            <p className="text-sm">Assalomu alaykum! Men Shifokor AIman. Test natijangiz yoki sog'lig'ingiz bo'yicha savollaringiz bormi?</p>
          </div>
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={cn("max-w-[85%] p-4 rounded-xl", msg.role === 'user' ? "bg-blue-600 rounded-tr-none ml-auto" : "bg-slate-800 rounded-tl-none border border-slate-700")}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}
          {chatLoading && (
            <div className="bg-slate-800 p-4 rounded-xl rounded-tl-none border border-slate-700 max-w-[85%] flex space-x-2">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Savolingizni yozing..." 
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            />
            <button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const isHighRisk = result.risk_percentage >= 50;
    const isMedRisk = result.risk_percentage >= 20 && result.risk_percentage < 50;
    const ringColor = isHighRisk ? '#ef4444' : (isMedRisk ? '#eab308' : '#22c55e');

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 animate-fade-in">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center animate-bloooop border border-slate-700 mb-6 relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>

          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 relative z-10">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="58" stroke="#1e293b" strokeWidth="8" fill="none" />
              <circle cx="64" cy="64" r="58" stroke={ringColor} strokeWidth="8" fill="none" 
                strokeDasharray="364" strokeDashoffset={364 - (364 * result.risk_percentage) / 100} 
                className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-black text-white">{result.risk_percentage}%</span>
              <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">Xavf</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white z-10">Sizning Natijangiz</h2>
          <p className="text-slate-300 mb-2 leading-relaxed z-10 text-sm whitespace-pre-wrap text-left w-full p-4 bg-slate-900/50 rounded-xl">
            {result.explanation}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button 
            onClick={handleShare}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/50"
          >
            <Share2 className="w-5 h-5" /> Natijani Ulashish
          </button>
          
          <button 
            onClick={() => setShowChat(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-4 px-6 rounded-2xl flex justify-center items-center gap-2 transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" /> Shifokor AI bilan suhbat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-slate-900">
      <div className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-xl font-bold flex items-center text-white"><Activity className="w-6 h-6 mr-2 text-blue-500" /> Shifokor AI</h1>
        <span className="text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-full text-sm border border-slate-700">{currentQuestion + 1} / {QUESTIONS.length}</span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-10 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-600 to-cyan-400 h-1.5 rounded-full transition-all duration-500 ease-out" 
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
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-5 px-6 rounded-2xl flex justify-between items-center transition-all active:scale-95 group"
                >
                  <span className="text-xl">Ha</span>
                  <CheckCircle2 className="w-7 h-7 text-slate-500 group-hover:text-green-500 transition-colors" />
                </button>
                <button 
                  onClick={() => handleAnswer("Yo'q")}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-5 px-6 rounded-2xl flex justify-between items-center transition-all active:scale-95 group"
                >
                  <span className="text-xl">Yo'q</span>
                  <div className="w-7 h-7 rounded-full border-2 border-slate-500 group-hover:border-red-500 transition-colors"></div>
                </button>
              </div>
            </div>
          )
        ))}

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 animate-fade-in">
            <div className="w-20 h-20 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            <p className="text-xl font-medium text-white animate-pulse">AI tahlil qilmoqda...</p>
            <p className="text-sm text-slate-400 mt-2">Bu bir necha soniya vaqt olishi mumkin</p>
          </div>
        )}
      </div>
    </div>
  );
}
