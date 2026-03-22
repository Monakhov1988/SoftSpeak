/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  ShieldCheck, 
  Heart, 
  Zap, 
  Mic, 
  Users, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Activity,
  Shield,
  UserPlus,
  Download,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  PolarRadiusAxis
} from 'recharts';

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass px-4 md:px-8 py-3 md:py-4 flex justify-between items-center w-[92%] md:w-[90%] max-w-5xl rounded-full shadow-lg">
    <div className="flex items-center gap-1.5 md:gap-2">
      <div className="w-6 h-6 md:w-8 md:h-8 bg-lavender rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-lavender/20 shrink-0">
        <Sparkles className="text-white w-3.5 h-3.5 md:w-5 md:h-5" />
      </div>
      <span className="font-bold text-base md:text-xl tracking-tight text-lavender whitespace-nowrap">SoftSpeak AI</span>
    </div>
    <div className="hidden md:flex gap-8 text-sm font-medium text-muted-grey">
      <a href="#how-it-works" className="hover:text-lavender transition-colors">Как это работает</a>
      <a href="#features" className="hover:text-lavender transition-colors">Функции</a>
      <a href="#pricing" className="hover:text-lavender transition-colors">Цены</a>
    </div>
    <a 
      href="https://t.me/SoftSpeakAI_bot?start=navbar"
      target="_blank"
      rel="noopener noreferrer"
      className="clay-lavender text-white px-3 md:px-6 py-1.5 md:py-2 text-[10px] md:text-sm font-bold hover:scale-105 transition-transform active:scale-95 text-center whitespace-nowrap"
    >
      Начать
    </a>
  </nav>
);

const Hero = () => {
  const [chatStep, setChatStep] = useState(0);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [botStatus, setBotStatus] = useState<any>(null);

  const checkBotStatus = async () => {
    try {
      const res = await fetch('/api/bot-status');
      const data = await res.json();
      setBotStatus(data);
    } catch (err) {
      console.error('Failed to check bot status', err);
    }
  };

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = "3D isometric high-quality render of a young man and a young woman sitting on soft floating clouds, looking at their glowing smartphones. Between them, a friendly, glowing ethereal orb of light (representing AI) acts as a bridge, connecting them with soft flowing lines. Pastel color palette: lavender, soft mint, and blush pink. Soft studio lighting, 8k, octane render, cinematic composition, minimalistic background, dreamlike atmosphere.";
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: prompt }] }],
      });

      let found = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setHeroImage(`data:image/png;base64,${part.inlineData.data}`);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        throw new Error("No image data found in response");
      }
    } catch (error: any) {
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
        console.warn("Gemini API quota exceeded, using high-quality fallback for hero image.");
      } else {
        console.error("Error generating hero image:", error);
      }
      setHeroImage("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    checkBotStatus();
    const timer = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    generateImage();
  }, []);

  const downloadImage = (dataUrl: string | null, fileName: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="pt-32 md:pt-48 pb-12 md:pb-20 px-6 max-w-7xl mx-auto relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-hero-gradient pointer-events-none" />
      
      <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left"
        >
          {botStatus && !botStatus.initialized && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm animate-pulse">
              <Activity className="w-5 h-5" />
              <span>Бот не инициализирован. Пожалуйста, добавьте <b>TELEGRAM_BOT_TOKEN</b> в Secrets.</span>
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lavender/10 text-lavender rounded-full text-xs md:text-sm font-bold mb-6 animate-float">
            <Activity className="w-4 h-4" />
            <span>Ваш AI-медиатор</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold leading-[1.1] mb-6 md:mb-8 tracking-tight text-gray-900">
            Переводчик с <br />
            <span className="text-lavender bg-lavender/5 px-4 py-1 rounded-2xl inline-block my-1 border border-lavender/10 shadow-sm">«языка обид»</span> <br />
            на язык любви.
          </h1>
          <p className="text-base md:text-xl text-muted-grey mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Ваш личный ИИ-психолог в Telegram — для пар и для одного. Он услышит то, что вы боитесь сказать, и поможет выразить это бережно.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center lg:justify-start">
            <a 
              href="https://t.me/SoftSpeakAI_bot?start=landing"
              target="_blank"
              rel="noopener noreferrer"
              className="clay-lavender text-white px-8 md:px-10 py-4 md:py-5 font-bold text-base md:text-lg flex items-center justify-center gap-3 hover:scale-105 transition-all group"
            >
              Начать бесплатно
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>

        <div className="relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-mint/30 blur-[100px] rounded-full animate-pulse-soft" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blush/50 blur-[100px] rounded-full animate-pulse-soft" />
          
          <motion.div 
            className="relative z-20 mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
          >
            {heroImage ? (
              <div className="relative group">
                <img 
                  src={heroImage} 
                  alt="3D AI Connection Bridge" 
                  className={`w-full h-auto rounded-[48px] shadow-2xl clay-white border-none transition-all duration-700 ${isGenerating ? 'opacity-50 blur-sm scale-95' : 'opacity-100 blur-0 scale-100 animate-float'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-30">
                  <button 
                    onClick={() => downloadImage(heroImage, 'softspeak-hero.png')}
                    className="p-4 clay-white rounded-full text-lavender shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Download className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => generateImage()}
                    disabled={isGenerating}
                    className="p-4 clay-lavender rounded-full text-white shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className={`w-6 h-6 ${isGenerating ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square rounded-[48px] clay-white animate-pulse flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-lavender/20 via-white to-mint/20 animate-pulse" />
                <div className="relative z-10 text-center px-8">
                  <Sparkles className="w-16 h-16 text-lavender mx-auto mb-4 animate-bounce" />
                  <p className="text-lavender font-bold tracking-widest uppercase text-[10px]">Создаем ваш SoftSpeak...</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Chat Overlay Box */}
          <motion.div 
            className="absolute -bottom-10 -left-10 z-30 clay-white p-6 md:p-8 shadow-2xl border-white/50 overflow-hidden max-w-[320px] md:max-w-[400px]"
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lavender to-mint" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 clay-lavender flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">SoftSpeak AI</p>
                <p className="text-[10px] text-lavender font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-lavender rounded-full animate-pulse" />
                  АНАЛИЗ КОНТЕКСТА
                </p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <AnimatePresence mode="wait">
                {chatStep === 0 && (
                  <motion.div 
                    key="step0"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-red-50"
                  >
                    <p className="text-red-400 text-[8px] font-bold uppercase tracking-widest mb-1">Эмоциональный импульс</p>
                    <p className="text-gray-800 text-sm italic">«Ты никогда не слушаешь, что я говорю! Тебе плевать на мои чувства!»</p>
                  </motion.div>
                )}
                {chatStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="py-4 flex flex-col items-center gap-2"
                  >
                    <Activity className="text-lavender w-8 h-8 animate-pulse" />
                    <p className="text-[8px] font-bold text-lavender uppercase tracking-widest">Трансформация смыслов...</p>
                  </motion.div>
                )}
                {chatStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-mint p-4 rounded-2xl rounded-tr-none shadow-sm border border-mint/30"
                  >
                    <p className="text-teal-500 text-[8px] font-bold uppercase tracking-widest mb-1">БЕРЕЖНЫЙ ПЕРЕВОД</p>
                    <p className="text-teal-900 text-sm font-medium">«Мне сейчас очень не хватает твоего внимания и поддержки. Давай поговорим спокойно?»</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const WheelOfLife = () => {
  const [scores, setScores] = useState({
    relationships: 8,
    career: 6,
    money: 5,
    health: 7,
    growth: 9,
    rest: 4,
    environment: 6,
    brightness: 7
  });

  const categories = [
    { id: 'relationships', label: 'Отношения', icon: <Heart className="w-4 h-4" /> },
    { id: 'career', label: 'Карьера', icon: <Zap className="w-4 h-4" /> },
    { id: 'money', label: 'Деньги', icon: <Activity className="w-4 h-4" /> },
    { id: 'health', label: 'Здоровье', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'growth', label: 'Саморазвитие', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'rest', label: 'Отдых', icon: <Download className="w-4 h-4" /> },
    { id: 'environment', label: 'Окружение', icon: <Users className="w-4 h-4" /> },
    { id: 'brightness', label: 'Яркость жизни', icon: <Sparkles className="w-4 h-4" /> }
  ];

  const data = categories.map(cat => ({
    subject: cat.label,
    A: scores[cat.id as keyof typeof scores],
    fullMark: 10,
  }));

  return (
    <section id="wheel" className="py-24 md:py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 leading-tight">Ваше Колесо Баланса</h2>
          <p className="text-lg md:text-xl text-muted-grey mb-10 md:mb-12 leading-relaxed">
            Оцените сферы своей жизни прямо сейчас. SoftSpeak проанализирует ваши результаты и составит персональный план развития в Telegram.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <span className="text-lavender">{cat.icon}</span>
                    {cat.label}
                  </div>
                  <span className="text-lavender font-bold text-sm">{scores[cat.id as keyof typeof scores]} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={scores[cat.id as keyof typeof scores]}
                  onChange={(e) => setScores({ ...scores, [cat.id]: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-lavender/10 rounded-lg appearance-none cursor-pointer accent-lavender"
                />
              </div>
            ))}
          </div>
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={`https://t.me/SoftSpeakAI_bot?start=wheel_${Object.values(scores).join('_')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-12 inline-flex clay-lavender text-white px-10 py-5 font-bold text-lg shadow-xl shadow-lavender/20"
          >
            Получить план в Telegram
          </motion.a>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative flex justify-center items-center"
        >
          <div className="absolute inset-0 bg-lavender/5 rounded-full blur-3xl animate-pulse-soft" />
          <div className="w-full h-[400px] md:h-[500px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke="#6D5DF1" strokeOpacity={0.1} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#6D5DF1', fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  name="Balance"
                  dataKey="A"
                  stroke="#6D5DF1"
                  strokeWidth={3}
                  fill="#6D5DF1"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 clay-white flex items-center justify-center z-20 shadow-xl">
            <Sparkles className="text-lavender w-8 h-8" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const BeforeAfterSlider = () => {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <section className="py-32 px-6 bg-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none overflow-hidden opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1635241161466-541f065683ba?auto=format&fit=crop&q=80&w=1200" 
          alt="3D Transformation Glow" 
          className="w-full h-full object-contain animate-pulse-soft"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-lavender/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Магия трансформации</h2>
          <p className="text-xl text-muted-grey">Потяните за слайдер, чтобы увидеть, как SoftSpeak меняет тон вашего общения</p>
        </div>

        <div className="relative h-[450px] md:h-[400px] rounded-[32px] md:rounded-[48px] overflow-hidden clay-white group">
          {/* After (Soft) */}
          <div className="absolute inset-0 bg-mint flex items-center justify-center p-6 md:p-12">
            <div className="max-w-md text-center">
              <p className="text-teal-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">Бережный перевод</p>
              <p className="text-teal-900 text-lg md:text-2xl font-medium leading-relaxed">
                «Я чувствую себя одиноко, когда мы не проводим время вместе. Давай сегодня отложим телефоны и просто пообщаемся?»
              </p>
            </div>
          </div>

          {/* Before (Toxic) */}
          <div 
            className="absolute inset-0 bg-red-50 flex items-center justify-center p-6 md:p-12 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <div className="max-w-md text-center w-full">
              <p className="text-red-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">Эмоциональный импульс</p>
              <p className="text-gray-800 text-lg md:text-2xl italic leading-relaxed">
                «Тебе вечно не до меня! Опять весь вечер в своем телефоне, как будто меня вообще не существует!»
              </p>
            </div>
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 clay-lavender flex items-center justify-center shadow-xl">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-white/50 rounded-full" />
                <div className="w-1 h-4 bg-white/50 rounded-full" />
              </div>
            </div>
          </div>

          {/* Invisible Input for control */}
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sliderPos} 
            onChange={(e) => setSliderPos(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
          />
        </div>
      </div>
    </section>
  );
};

const PainPoints = () => {
  const pains = [
    {
      title: "Написал(а) лишнего",
      desc: "Знакомое чувство сожаления после отправленного текста? Наш агент — это ваш предохранитель.",
      icon: <Zap className="w-8 h-8 text-orange-400" />,
      bg: "bg-orange-50"
    },
    {
      title: "Стена непонимания",
      desc: "Вы говорите об одном, а партнер слышит другое. Мы переводим смыслы, а не просто слова.",
      icon: <MessageCircle className="w-8 h-8 text-lavender" />,
      bg: "bg-lavender/5"
    },
    {
      title: "Страх честности",
      desc: "Трудно признаться в чем-то важном? Выговоритесь боту — он подскажет, как донести это бережно.",
      icon: <ShieldCheck className="w-8 h-8 text-teal-400" />,
      bg: "bg-mint/30"
    }
  ];

  return (
    <section className="py-32 px-6 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Отношения — это сложно.</h2>
          <p className="text-xl text-muted-grey">Мы делаем их прозрачными и мягкими.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {pains.map((pain, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className={`p-6 md:p-10 clay-white ${pain.bg} border-none flex flex-col items-center text-center`}
            >
              <div className="mb-6 md:mb-8 w-16 h-16 md:w-20 md:h-20 bg-white rounded-[24px] md:rounded-[28px] flex items-center justify-center shadow-sm clay-white border-none">
                {React.cloneElement(pain.icon as React.ReactElement, { className: "w-8 h-8 md:w-10 md:h-10" })}
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4">{pain.title}</h3>
              <p className="text-sm md:text-lg text-muted-grey leading-relaxed">{pain.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { 
      title: "Регистрация", 
      desc: "Вы регистрируетесь и приглашаете партнера по ссылке.",
      icon: <UserPlus className="w-10 h-10 text-lavender" />
    },
    { 
      title: "Приватность", 
      desc: "У каждого — свой личный чат. Пространство абсолютной тайны.",
      icon: <Lock className="w-10 h-10 text-lavender" />
    },
    { 
      title: "Диалог", 
      desc: "Пишите боту всё: жалобы, черновики, голосовые о том, что болит.",
      icon: <MessageCircle className="w-10 h-10 text-lavender" />
    },
    { 
      title: "Гармония", 
      desc: "Бот анализирует контекст и дает каждому бережные советы.",
      icon: <Heart className="w-10 h-10 text-lavender" />
    }
  ];

  return (
    <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-lavender/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-mint/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1635241161466-541f065683ba?auto=format&fit=crop&q=80&w=1200" 
          alt="Background Pattern" 
          className="w-full h-full object-cover rounded-[100px]"
          referrerPolicy="no-referrer"
        />
      </div>
      <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 md:mb-24 relative z-10">Одна подписка. Один агент. <br /> Два союзника.</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex flex-col items-center text-center group">
            <div className="mb-6 md:mb-8 relative">
              <div className="absolute inset-0 bg-lavender/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
              <div className="w-20 h-20 md:w-24 md:h-24 clay-white flex items-center justify-center overflow-hidden relative z-10 group-hover:scale-110 transition-transform duration-500 rounded-[24px] md:rounded-[32px]">
                {React.cloneElement(step.icon as React.ReactElement, { className: "w-8 h-8 md:w-10 md:h-10 text-lavender" })}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 clay-lavender text-white text-xs md:text-sm flex items-center justify-center font-bold z-20">
                {idx + 1}
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{step.title}</h3>
            <p className="text-sm md:text-base text-muted-grey leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Бережный фильтр",
      desc: "Вставьте сообщение, которое хотите отправить. Бот уберет из него токсичность, сохранив вашу искренность.",
      icon: <Sparkles className="w-10 h-10 text-lavender" />,
      color: "from-lavender/20 to-lavender/5"
    },
    {
      title: "Голосовой сейф",
      desc: "Запишите аудио, когда внутри всё кипит. Бот расшифрует, поддержит и выделит главные тезисы.",
      icon: <Mic className="w-10 h-10 text-lavender" />,
      color: "from-blush to-white"
    },
    {
      title: "Адвокат семьи",
      desc: "Бот не принимает чью-то сторону. Он на стороне ваших отношений и видит ситуацию объективно.",
      icon: <Users className="w-10 h-10 text-lavender" />,
      color: "from-mint/40 to-mint/10"
    }
  ];

  return (
    <section id="features" className="py-20 md:py-32 px-4 md:px-6 bg-pastel-gradient relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {features.map((f, idx) => (
            <div key={idx} className={`glass p-8 md:p-12 rounded-[32px] md:rounded-[48px] border-white/60 hover:scale-[1.02] transition-all bg-gradient-to-br ${f.color} flex flex-col items-center text-center`}>
              <div className="mb-8 md:mb-10 w-20 h-20 md:w-24 md:h-24 bg-white/80 rounded-[24px] md:rounded-[32px] flex items-center justify-center shadow-sm clay-white border-none">
                {React.cloneElement(f.icon as React.ReactElement, { className: "w-8 h-8 md:w-10 md:h-10 text-lavender" })}
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{f.title}</h3>
              <p className="text-sm md:text-lg text-muted-grey leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Privacy = () => (
  <section className="py-32 px-6 bg-deep-blue text-white overflow-hidden relative">
    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-lavender rounded-full blur-[150px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500 rounded-full blur-[150px] animate-pulse-soft" />
    </div>
    
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <div className="inline-flex items-center justify-center w-32 h-32 glass-dark rounded-[40px] mb-12 border-white/10 shadow-2xl">
        <Shield className="w-16 h-16 text-lavender" />
      </div>
      <h2 className="text-4xl md:text-6xl font-bold mb-10 leading-tight">Ваше доверие — <br /> наш приоритет.</h2>
      <div className="space-y-8 text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
        <p>Мы не передаем ваши слова партнеру дословно.</p>
        <p>AI синтезирует общую картину, чтобы помочь вам сблизиться, а не чтобы «шпионить».</p>
      </div>
    </div>
  </section>
);

const Pricing = ({ onOpenModal }: { onOpenModal: () => void }) => (
  <section id="pricing" className="py-20 md:py-32 px-4 md:px-6 bg-white">
    <div className="max-w-xl mx-auto relative">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-lavender/20 blur-[40px] rounded-full animate-float" />
      <div className="clay-white p-8 md:p-12 relative overflow-hidden border-2 border-lavender/10">
        <div className="absolute top-0 right-0 bg-lavender text-white px-6 md:px-8 py-2 md:py-3 rounded-bl-[24px] md:rounded-bl-[32px] font-bold text-[10px] md:text-sm tracking-widest uppercase">
          Популярно
        </div>
        <h3 className="text-2xl md:text-3xl font-bold mb-4">Тариф «Гармония»</h3>
        <div className="flex items-baseline gap-2 mb-8 md:mb-10">
          <span className="text-4xl md:text-6xl font-bold text-lavender">1990₽</span>
          <span className="text-muted-grey text-base md:text-lg">/ месяц</span>
        </div>
        
        <ul className="space-y-4 md:space-y-6 mb-10 md:mb-12">
          {[
            "2 индивидуальных доступа к одному агенту",
            "Безлимитная коррекция сообщений",
            "Анализ языков любви и помощь в взаимопонимании",
            "3 дня пробного периода — 0₽"
          ].map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 md:gap-4">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-lavender/10 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-lavender" />
              </div>
              <span className="text-gray-700 text-sm md:text-lg">{item}</span>
            </li>
          ))}
        </ul>
        
        <button 
          onClick={onOpenModal}
          className="block w-full clay-lavender text-white py-4 md:py-5 font-bold text-lg md:text-xl text-center hover:scale-[1.02] transition-all"
        >
          Попробовать бесплатно
        </button>
      </div>
    </div>
  </section>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 py-6 md:py-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-lg md:text-xl hover:text-lavender transition-colors group"
      >
        <span className="pr-4">{question}</span>
        <div className={`p-1.5 md:p-2 rounded-full transition-all shrink-0 ${isOpen ? 'bg-lavender text-white rotate-180' : 'bg-lavender/10 text-lavender'}`}>
          <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-4 md:pt-6 text-muted-grey leading-relaxed text-base md:text-lg">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => (
  <section className="py-20 md:py-32 px-4 md:px-6 max-w-3xl mx-auto relative">
    <div className="absolute top-0 right-0 w-32 h-32 bg-lavender/10 blur-[60px] rounded-full animate-float" />
    <div className="absolute -top-20 -right-40 w-80 h-80 opacity-20 pointer-events-none">
      <img 
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400" 
        alt="Harmony Spark" 
        className="w-full h-full object-contain animate-pulse-soft"
        referrerPolicy="no-referrer"
      />
    </div>
    <h2 className="text-3xl md:text-4xl font-bold mb-12 md:mb-16 text-center">Частые вопросы</h2>
    <div className="space-y-2">
      <FAQItem 
        question="Партнер увидит, что я пишу боту?" 
        answer="Нет. Ваши личные диалоги с ботом полностью скрыты. Партнер получает только общие советы или те сообщения, которые вы сами решите ему отправить после коррекции."
      />
      <FAQItem 
        question="Это заменит нам терапию?" 
        answer="SoftSpeak — это мощный инструмент ежедневной поддержки, который помогает не копить обиды. Он отлично дополняет терапию или помогает парам, которые пока не готовы к очным сессиям."
      />
      <FAQItem 
        question="Как оплатить?" 
        answer="Одна оплата активирует доступ для обоих партнеров. Просто отправьте ссылку-приглашение из бота."
      />
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-20 px-6 border-t border-gray-100 text-center relative overflow-hidden">
    <div className="absolute top-0 left-0 w-32 h-32 bg-lavender/10 blur-[60px] rounded-full animate-float" />
    <div className="absolute bottom-0 right-0 w-48 h-48 bg-mint/10 blur-[80px] rounded-full animate-float" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 bg-pastel-gradient opacity-30 blur-[100px] pointer-events-none" />
    
    <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
      <div className="w-10 h-10 clay-lavender flex items-center justify-center">
        <Sparkles className="text-white w-6 h-6" />
      </div>
      <span className="font-bold text-2xl text-lavender">SoftSpeak AI</span>
    </div>
    
    <p className="text-sm text-muted-grey relative z-10">
      Сделано с любовью для тех, кто хочет её сохранить. <br />
      <span className="mt-2 block opacity-50">© 2026 SoftSpeak AI</span>
    </p>
  </footer>
);

// --- Main App ---

const BotOnboarding = () => {
  const [onboardingImage, setOnboardingImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadImage = (dataUrl: string | null, fileName: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateOnboardingImage = async () => {
    setIsGenerating(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = "3D high-quality isometric render of two stylized, gentle hands holding a glowing, translucent heart-shaped crystal between them. The heart emits a soft lavender light. Surrounding the scene are soft, fluffy clouds and floating soft abstract spheres and ethereal swirls in pastel mint and blush pink. No medical elements, no pill shapes. Minimalist aesthetic, soft studio lighting, Octane render, 8k resolution, dreamlike and peaceful atmosphere, representing emotional connection and safety.";
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ parts: [{ text: prompt }] }],
      });

      let found = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setOnboardingImage(`data:image/png;base64,${part.inlineData.data}`);
            found = true;
            break;
          }
        }
      }

      if (!found) {
        throw new Error("No image data found in response");
      }
    } catch (error: any) {
      // Handle quota exhaustion or other API errors gracefully
      if (error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED') {
        console.warn("Gemini API quota exceeded, using high-quality fallback for onboarding image.");
      } else {
        console.error("Error generating onboarding image:", error);
      }
      // High-quality fallback that matches the theme
      setOnboardingImage("https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1200");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateOnboardingImage();
  }, []);

  const stages = [
    {
      id: 1,
      title: "Приветствие",
      role: "Партнер А (Инициатор)",
      messages: [
        { type: "bot", text: "Привет! Я — SoftSpeak, твой личный ИИ-медиатор. 🌿\n\nМоя цель — сделать так, чтобы в вашей паре было меньше шума и больше понимания. Я не просто чат-бот, я — ваш общий 'цифровой психолог', который на стороне каждого из вас." },
        { type: "bot", text: "Прежде чем начнем, важное правило: Всё, что ты пишешь мне в этом чате — строго конфиденциально. Твой партнер никогда не увидит твои черновики или жалобы." },
        { type: "bot", text: "Согласен(на) создать ваше безопасное пространство?" }
      ],
      button: "Да, поехали!"
    },
    {
      id: 2,
      title: "Профилирование",
      role: "Партнер А",
      messages: [
        { type: "bot", text: "Чтобы я был максимально полезен, ответь на 4 вопроса:\n\n1. Как долго вы вместе?\n2. Какая главная сложность сейчас?\n3. Твой язык любви, который понимаешь?\n4. Статус отношений?" }
      ],
      options: ["1-3 года", "Быт", "Слова", "В браке"]
    },
    {
      id: 3,
      title: "Момент магии",
      role: "Демонстрация пользы",
      messages: [
        { type: "bot", text: "Вспомни что-то, что тебя злит прямо сейчас. Напиши мне это так, как если бы ты кричал(а) в подушку. Не стесняйся — это между нами." },
        { type: "user", text: "Меня бесит, что он опять забыл помыть посуду и весь вечер залипает в телефон! Ему вообще плевать на меня!" },
        { type: "bot", text: "Я тебя слышу. 🫂 Попробуй отправить ему этот вариант, он бьет в цель, но не ранит:\n\n'Милый, я сегодня очень устала. Мне будет ценно, если ты поможешь мне с кухней и мы проведем вечер вместе без телефонов. Мне не хватает твоего внимания'." }
      ],
      button: "Да, это то, что нужно!"
    },
    {
      id: 4,
      title: "Приглашение",
      role: "Виральный рост",
      messages: [
        { type: "bot", text: "Отношения — это танец двоих. Чтобы я мог анализировать вашу динамику, мне нужно познакомиться с ним." },
        { type: "bot", text: "Вот твоя уникальная ссылка-приглашение. Отправь её любимому человеку." }
      ],
      button: "Скопировать ссылку"
    },
    {
      id: 5,
      title: "Вход партнера",
      role: "Партнер Б",
      messages: [
        { type: "bot", text: "Привет! [Имя Партнера А] пригласил(а) тебя в SoftSpeak. 🥂" },
        { type: "bot", text: "Я — ваш ИИ-посредник. Я помогаю переводить сложные эмоции в понятные слова. Твои личные переписки со мной — под замком 🔒." }
      ],
      button: "Начнем?"
    },
    {
      id: 6,
      title: "Пульс пары",
      role: "Совместная активность",
      messages: [
        { type: "bot", text: "Поздравляю! Вы теперь в одной команде. 🥂" },
        { type: "bot", text: "Сегодняшнее задание: напишите мне по одному действию, за которое вы благодарны партнеру на этой неделе. Завтра утром я пришлю вам обоим 'Заряд любви'." }
      ]
    }
  ];

  return (
    <section className="py-32 px-6 bg-soft-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1200" 
          alt="Onboarding Background" 
          className="w-full h-full object-cover blur-[80px]"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20 text-left">
          <div className="md:w-2/3">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">Первая сессия: <br />как это будет</h2>
            <p className="text-xl text-muted-grey max-w-xl">Пролистайте этапы онбординга, чтобы увидеть магию SoftSpeak в действии. Мы создаем пространство, где каждый голос услышан.</p>
          </div>
          <div className="md:w-1/3">
            <div className="clay-white p-6 rounded-[40px] relative animate-float group">
              {onboardingImage ? (
                <>
                  <img 
                    src={onboardingImage} 
                    alt="3D Connection Illustration" 
                    className={`w-full h-auto rounded-[24px] transition-all duration-700 ${isGenerating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => downloadImage(onboardingImage, 'softspeak-hands.png')}
                    className="absolute top-10 right-10 p-3 clay-lavender rounded-full text-white shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-30"
                    title="Скачать изображение"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="w-full aspect-square rounded-[24px] bg-lavender/10 animate-pulse flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-lavender/30" />
                </div>
              )}
              <div className="absolute -top-4 -right-4 w-12 h-12 clay-lavender rounded-full flex items-center justify-center">
                <Sparkles className="text-white w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          {/* Scroll Indicators */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden group-hover:flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-lg cursor-pointer ml-4">
            <ArrowRight className="w-6 h-6 rotate-180 text-lavender" />
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden group-hover:flex items-center justify-center w-12 h-12 bg-white/80 rounded-full shadow-lg cursor-pointer mr-4">
            <ArrowRight className="w-6 h-6 text-lavender" />
          </div>

          <div className="flex gap-4 md:gap-8 overflow-x-auto pb-12 px-4 snap-x snap-mandatory no-scrollbar scroll-smooth">
            {stages.map((stage) => (
              <div key={stage.id} className="snap-center shrink-0 w-[280px] md:w-[380px]">
                <div className="mb-6 flex items-center justify-between px-2">
                  <div>
                    <span className="text-[10px] font-bold text-lavender uppercase tracking-widest">Этап {stage.id}</span>
                    <h3 className="text-lg md:text-xl font-bold">{stage.title}</h3>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold bg-lavender/10 text-lavender px-2 md:px-3 py-1 rounded-full uppercase">{stage.role}</span>
                </div>
                
                <div className="clay-white min-h-[500px] md:min-h-[580px] rounded-[32px] md:rounded-[48px] p-4 md:p-6 border-4 md:border-8 border-gray-50 shadow-2xl flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-12 bg-gray-50/50 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full" />
                  </div>
                  
                  <div className="mt-10 space-y-4 flex-grow">
                    {stage.messages.map((msg, midx) => (
                      <motion.div 
                        key={midx}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: midx * 0.2 }}
                        className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                          msg.type === "bot" 
                            ? "bg-lavender/5 text-gray-800 rounded-tl-none border border-lavender/10" 
                            : "bg-mint text-teal-900 self-end ml-auto rounded-tr-none"
                        }`}
                      >
                        {msg.text.split('\n').map((line, lidx) => (
                          <p key={lidx} className={lidx > 0 ? "mt-2" : ""}>{line}</p>
                        ))}
                      </motion.div>
                    ))}

                    {stage.options && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {stage.options.map((opt, oidx) => (
                          <div key={oidx} className="bg-white border border-lavender/20 text-lavender text-[10px] font-bold py-2 px-3 rounded-xl text-center shadow-sm">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {stage.button && (
                    <div className="mt-6">
                      <div className="clay-lavender text-white py-4 rounded-2xl text-center font-bold text-sm shadow-lg">
                        {stage.button}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Scrollbar UI */}
          <div className="flex justify-center gap-2 mt-4">
            {stages.map((s) => (
              <div key={s.id} className="w-2 h-2 rounded-full bg-lavender/20" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const VisualManifesto = () => (
  <section className="py-12 md:py-20 px-4 md:px-6 overflow-hidden">
    <div className="max-w-7xl mx-auto relative">
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-[450px] md:h-[600px] rounded-[32px] md:rounded-[64px] overflow-hidden clay-white flex items-center justify-center py-12 md:py-0 w-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-lavender/10 via-white to-mint/10" />
        <img 
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200" 
          alt="SoftSpeak Visual Bridge" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 text-center px-4 md:px-12 w-full">
          <div className="w-24 h-24 md:w-48 md:h-48 clay-white mx-auto mb-6 md:mb-10 overflow-hidden rounded-full animate-float">
            <img 
              src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=400" 
              alt="3D Connection Sphere" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl md:text-6xl font-bold mb-6 md:mb-8 leading-tight px-2">Технологии на службе <br className="hidden md:block" /> ваших чувств.</h2>
          <p className="text-sm md:text-xl text-muted-grey max-w-2xl mx-auto leading-relaxed px-2">
            SoftSpeak создан, чтобы технологии не отдаляли нас друг от друга, а помогали найти путь к сердцу самого близкого человека.
          </p>
        </div>
        
        {/* Floating 3D Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blush/40 blur-[60px] rounded-full animate-pulse-soft" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-lavender/30 blur-[80px] rounded-full animate-pulse-soft" />
      </motion.div>
    </div>
  </section>
);

const ComingSoonModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="clay-white p-8 md:p-12 max-w-md w-full relative overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-grey hover:text-lavender transition-colors"
        >
          <Users className="w-6 h-6 rotate-45" />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 clay-lavender mx-auto mb-8 flex items-center justify-center">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Скоро запуск!</h3>
          <p className="text-muted-grey mb-8 leading-relaxed">
            Проект начнет работу в апреле. Оставьте свой контакт, и мы проинформируем вас о запуске!
          </p>

          {!submitted ? (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubmitted(true);
              }}
              className="space-y-4"
            >
              <input 
                type="email" 
                required
                placeholder="Ваш e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border-2 border-lavender/10 focus:border-lavender outline-none transition-all text-lg"
              />
              <button 
                type="submit"
                className="w-full clay-lavender text-white py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all"
              >
                Уведомить меня
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-mint p-6 rounded-2xl text-teal-900 font-medium"
            >
              Спасибо! Мы сообщим вам, как только всё будет готово. ✨
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen selection:bg-lavender/20 selection:text-lavender bg-soft-white">
      <Navbar />
      <main>
        <Hero />
        <PainPoints />
        <BeforeAfterSlider />
        <WheelOfLife />
        <HowItWorks />
        <Features />
        <VisualManifesto />
        <BotOnboarding />
        <Privacy />
        <Pricing onOpenModal={() => setIsModalOpen(true)} />
        <FAQ />
      </main>
      <Footer />
      <ComingSoonModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

