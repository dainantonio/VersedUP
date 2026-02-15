import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Sparkles, Share2, Library, Settings, 
  ChevronLeft, Save, Copy, Download, Trash2, 
  MoreVertical, Check, RefreshCw, Smartphone, 
  Mail, Video, Hash, FileText, LayoutTemplate,
  Search, Filter, X, Menu, SlidersHorizontal,
  MoveUp, MoveDown, AlertTriangle, Sun, Moon, 
  BookOpen, Camera, FileDown, Volume2, Key, Globe, Mic, StopCircle,
  PenTool, MessageSquare, Heart, ChevronRight,
  Smile, CloudRain, Coffee, Zap, User, Send, Heart as HeartIcon, MessageCircle
} from 'lucide-react';

/**
 * UTILITIES & CONFIGURATION
 */

const APP_ID = 'versed_up_v1';
const GENERATE_DELAY_MS = 1500;

// Platform Constraints
const PLATFORM_LIMITS = {
  tiktok: 2200,
  instagram: 2200,
  youtube: 5000,
  email: 50000,
  generic: 50000
};

// Moods Configuration
const MOODS = [
  { id: 'grateful', label: 'Grateful', icon: Smile, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'anxious', label: 'Anxious', icon: CloudRain, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'hopeful', label: 'Hopeful', icon: Sun, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'weary', label: 'Weary', icon: Coffee, color: 'bg-stone-100 text-stone-700 border-stone-200' },
];

// Theme Definitions - ULTIMATE
const THEMES = {
  classic: {
    label: 'Classic',
    appBg: 'bg-[#F8FAFC]', // Clean slate
    cardBg: 'bg-white',
    textColor: 'text-slate-900',
    subTextColor: 'text-slate-500',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    primaryText: 'text-emerald-600',
    border: 'border-slate-200',
    accent: 'emerald',
    font: 'font-sans',
    ring: 'focus:ring-emerald-500/30',
    navBg: 'bg-white/90',
    heroGradient: 'bg-gradient-to-br from-emerald-500 to-teal-700'
  },
  sunrise: {
    label: 'Sunrise',
    appBg: 'bg-[#FFF7ED]', // Warm orange tint
    cardBg: 'bg-white',
    textColor: 'text-slate-800',
    subTextColor: 'text-slate-500',
    primary: 'bg-orange-500',
    primaryHover: 'hover:bg-orange-600',
    primaryLight: 'bg-orange-50',
    primaryText: 'text-orange-600',
    border: 'border-orange-100',
    accent: 'orange',
    font: 'font-sans',
    ring: 'focus:ring-orange-500/30',
    navBg: 'bg-white/90',
    heroGradient: 'bg-gradient-to-br from-orange-400 via-rose-400 to-pink-500'
  },
  sunset: {
    label: 'Sunset',
    appBg: 'bg-[#0F172A]', // Deep slate
    cardBg: 'bg-[#1E293B]',
    textColor: 'text-white',
    subTextColor: 'text-slate-400',
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    primaryLight: 'bg-[#334155]',
    primaryText: 'text-indigo-300',
    border: 'border-slate-700',
    accent: 'indigo',
    font: 'font-sans',
    ring: 'focus:ring-indigo-500/30',
    navBg: 'bg-[#0F172A]/90',
    heroGradient: 'bg-gradient-to-br from-indigo-600 via-purple-700 to-slate-800'
  }
};

// Default Settings
const DEFAULT_SETTINGS = {
  theme: 'classic',
  preferredTone: 'encouraging',
  preferredLength: 'medium',
  hashtagStyle: 'moderate',
  postFormatMode: 'standard',
  enabledComponents: {
    title: true,
    scripture: true,
    body: true,
    prayer: true,
    reflectionQuestions: true,
    hashtags: true
  },
  enabledPlatforms: ['instagram', 'tiktok', 'youtube', 'email', 'generic'],
  showWatermark: true,
  aiProvider: 'mock',
  openaiKey: '',
  geminiKey: ''
};

// Data Models
const createDevotional = () => ({
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  verseRef: '',
  verseText: '',
  title: '',
  rawText: '', 
  prayer: '', 
  reflectionQuestions: '',
  mood: null, // New field
  versions: [],
  compiledPosts: {},
  tags: [],
  status: 'draft',
});

const generateId = () => crypto.randomUUID();

// Helper: Get Greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Helper: Full Content
const getFullContent = (devotional) => {
  let text = devotional.rawText || "";
  if (devotional.reflectionQuestions) text += `\n\n**Questions:**\n${devotional.reflectionQuestions}`;
  if (devotional.prayer) text += `\n\n**Prayer:**\n${devotional.prayer}`;
  return text;
};

// AI Engine
const runLLM = async ({ task, inputs, settings, platformLimit }) => {
  const { aiProvider, openaiKey, geminiKey } = settings;
  const { rawText, verseText, verseRef, title, prayer, reflectionQuestions, mood } = inputs;
  const tone = settings.preferredTone || 'encouraging';
  const components = settings.enabledComponents || DEFAULT_SETTINGS.enabledComponents;

  // Build Structure Request
  let structureReq = "Title, Scripture, Reflection/Body";
  if (components.prayer) structureReq += ", Prayer";
  if (components.reflectionQuestions) structureReq += ", 2-3 Reflection Questions";

  const moodContext = mood ? `Context: User is feeling ${mood}. Adjust tone to be helpful for this emotion.` : "";

  let prompt = "";
  if (task === 'fix') prompt = `Fix grammar. Tone: ${tone}. ${moodContext} Text: "${rawText}"`;
  else if (task === 'structure') prompt = `Format as a devotional (${structureReq}). Verse: ${verseRef}. ${moodContext}. Content: ${rawText} ${prayer || ''} ${reflectionQuestions || ''}`;
  else if (task === 'shorten') prompt = `Shorten this content: "${rawText}"`;
  else if (task === 'expand') prompt = `Expand deeper: "${rawText}"`;
  else if (task === 'tiktok') prompt = `Write a viral TikTok script. Verse: ${verseRef}. Content: ${rawText}`;
  else if (task === 'autoFit') prompt = `Rewrite to be under ${platformLimit} chars. Text: ${rawText}. Return valid JSON: { "body": "...", "verseText": "..." }`;
  else if (task.startsWith('ocr')) prompt = `Simulate OCR for ${task}. Return realistic text.`;

  // 1. OpenAI
  if (aiProvider === 'openai' && openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      if (task === 'autoFit') { try { return JSON.parse(content); } catch(e) { return { body: content, verseText: verseText.substring(0, 50) + '...' }; } }
      return content;
    } catch (e) { console.error("OpenAI Error", e); }
  }

  // 2. Gemini
  if (aiProvider === 'gemini' && geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      if (task === 'autoFit') { 
         const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
         try { return JSON.parse(cleanJson); } catch(e) { return { body: content, verseText: verseText.substring(0, 50) + '...' }; }
      }
      return content;
    } catch (e) { console.error("Gemini Error", e); }
  }

  // 3. Mock (Context Aware)
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = '';
      
      // Mood-aware mock text
      const moodIntro = mood === 'anxious' ? "In times of worry, remember this truth: " : 
                        mood === 'grateful' ? "My heart overflows with gratitude because " : 
                        mood === 'weary' ? "Even when strength fails, " : "";

      switch (task) {
        case 'fix': result = `${moodIntro}${rawText}`.trim() + ` (Polished)`; break;
        case 'structure': 
           result = `**Title: ${title || 'Untitled'}**\n\n**Scripture:**\n"${verseText}" - ${verseRef}\n\n**Reflection:**\n${moodIntro}${rawText}\n\n`;
           if (components.reflectionQuestions) result += `**Questions:**\n${reflectionQuestions || '1. How does this apply today?\n2. What does this say about God?'}\n\n`;
           if (components.prayer) result += `**Prayer:**\n${prayer || 'Lord, help me apply this word today. Amen.'}`;
           break;
        case 'shorten': result = rawText.substring(0, Math.floor(rawText.length * 0.7)) + '...'; break;
        case 'expand': result = `${moodIntro}${rawText}\n\nMoreover, when we look deeper at ${verseRef}, we see that this truth applies to every season of life.`; break;
        case 'tiktok': result = `POV: You need to hear this ✨\n\n"${verseText}"\n\n${moodIntro}${rawText}\n\n#ChristianTikTok #DailyDevotional`; break;
        case 'autoFit':
          let fittedBody = rawText;
          let fittedVerse = verseText;
          if (rawText.length > (platformLimit * 0.6)) fittedBody = rawText.substring(0, Math.floor(platformLimit * 0.5)) + "...";
          if ((fittedBody.length + fittedVerse.length) > platformLimit) fittedVerse = verseText.substring(0, 100) + "...";
          result = { body: fittedBody, verseText: fittedVerse }; 
          break;
        case 'ocr_verse': result = "For God so loved the world that he gave his one and only Son..."; break;
        case 'ocr_notes': result = "I felt really moved by this verse today. Love is about giving."; break;
        default: result = rawText;
      }
      resolve(result);
    }, GENERATE_DELAY_MS);
  });
};

const compilePost = (platform, content, settings) => {
  const { verseRef, verseText, title, body } = content;
  const isCustom = settings.postFormatMode === 'custom';
  const components = settings.enabledComponents;
  const buildSection = (type, text) => (isCustom && !components[type]) ? '' : text;
  const hashtags = settings.hashtagStyle === 'minimal' ? '#Faith' : '#Faith #Devotional #Jesus #Bible';
  const hashSection = buildSection('hashtags', hashtags);
  let compiled = '';

  switch (platform) {
    case 'tiktok': compiled = `📖 ${verseRef}\n\n${body}\n\n👇 Thoughts?\n\n${hashSection} #fyp`; break;
    case 'instagram':
      const titlePart = buildSection('title', title ? `TITLE: ${title}\n\n` : '');
      const scripturePart = buildSection('scripture', `“${verseText}”\n— ${verseRef}\n`);
      const bodyPart = buildSection('body', body);
      compiled = `${titlePart}${scripturePart}.\n.\n${bodyPart}\n.\n.\nSave this for later 📌\n${hashSection}`;
      break;
    case 'youtube': compiled = `${title || 'Daily Devotional'} | ${verseRef}\n\n${body}\n\nSUBSCRIBE for more encouragement!`; break;
    case 'email': compiled = `Subject: Encouragement for you: ${verseRef}\n\nHi Friend,\n\nI was reading ${verseRef} today:\n\n"${verseText}"\n\n${body}\n\nBlessings,\n[Your Name]`; break;
    default:
      const parts = [];
      if (!isCustom || components.title) parts.push(title ? title.toUpperCase() : '');
      if (!isCustom || components.scripture) parts.push(`"${verseText}" (${verseRef})`);
      if (!isCustom || components.body) parts.push(body);
      if (!isCustom || components.hashtags) parts.push(hashSection);
      compiled = parts.filter(p => p).join('\n\n');
      break;
  }
  return compiled;
};

const exportToDocument = (devotional) => {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${devotional.title || 'Devotional'}</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #059669;">${devotional.title || 'Untitled Devotional'}</h1>
      <p style="color: #666; font-size: 0.9em;">Created with VersedUP on ${new Date(devotional.createdAt).toLocaleDateString()}</p>
      <hr /><h3>Scripture</h3><p><strong>${devotional.verseRef}</strong></p><p><em>"${devotional.verseText}"</em></p>
      <h3>Reflection</h3><p>${devotional.versions.length > 0 ? devotional.versions[0].text : getFullContent(devotional)}</p>
      <br/><p style="text-align: center; color: #999; font-size: 0.8em;">Generated by VersedUP</p>
    </body></html>`;
  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `${devotional.title || 'devotional'}.doc`;
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};

const speakText = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } else { alert("Text-to-speech not supported."); }
};

/**
 * COMPONENTS
 */

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, loading = false, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 duration-200";
  const variants = {
    primary: `${theme.primary} text-white shadow-${theme.accent}-500/20 ${theme.primaryHover}`,
    secondary: `${theme.cardBg} ${theme.textColor} border ${theme.border} hover:${theme.primaryLight}`,
    ghost: `bg-transparent ${theme.subTextColor} hover:${theme.primaryLight}`,
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${baseStyle} ${variants[variant]} ${className} ${theme.font}`}>
      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, multiline = false, className = '', themeKey = 'classic', enableOCR = false, onOCR, icon: FieldIcon }) => {
  const theme = THEMES[themeKey];
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleMicClick = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported."); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    let finalTranscript = value ? value + " " : "";
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; onChange(finalTranscript); }
      }
    };
    recognition.start(); recognitionRef.current = recognition;
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setScanning(true); await onOCR(); setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 group ${className}`}>
      <div className="flex justify-between items-end">
        <label className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${theme.subTextColor} ${theme.font} group-focus-within:${theme.primaryText} transition-colors`}>
          {FieldIcon && <FieldIcon className="w-3.5 h-3.5" />}
          {label}
        </label>
        <div className="flex gap-1">
          <button onClick={handleMicClick} className={`p-1.5 rounded-full transition-all ${listening ? 'bg-red-100 text-red-600 animate-pulse scale-110' : `hover:${theme.primaryLight} ${theme.subTextColor} hover:text-${theme.accent}-600`}`} title="Dictate">
             {listening ? <StopCircle className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          {enableOCR && (
            <>
               <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
               <button onClick={() => fileInputRef.current?.click()} className={`p-1.5 rounded-full transition-all hover:${theme.primaryLight} ${theme.subTextColor} hover:text-${theme.accent}-600`} disabled={scanning} title="Scan Text">
                 {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
               </button>
            </>
          )}
        </div>
      </div>
      {multiline ? (
        <textarea className={`w-full p-4 ${theme.appBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 ${theme.ring} transition-all ${theme.textColor} leading-relaxed resize-none ${theme.font} shadow-sm group-focus-within:shadow-md`} rows={5} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={`w-full p-4 ${theme.appBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 ${theme.ring} transition-all ${theme.textColor} font-medium ${theme.font} shadow-sm group-focus-within:shadow-md`} type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
};

const Card = ({ children, className = '', onClick, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  return (
    <div onClick={onClick} className={`${theme.cardBg} backdrop-blur-sm border ${theme.border} shadow-lg shadow-slate-200/40 rounded-[24px] p-5 ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
};

// NEW: Social Preview Component
const SocialPreview = ({ platform, content, themeKey }) => {
  const theme = THEMES[themeKey];
  // Parsing content for display
  const lines = content.split('\n');
  const caption = lines.slice(2).join('\n'); // Rough heuristic

  if (platform === 'instagram') {
    return (
      <div className="w-full aspect-[4/5] bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold">V</div>
            </div>
            <span className="text-xs font-bold text-slate-800">versed_up_user</span>
          </div>
          <MoreVertical className="w-4 h-4 text-slate-400" />
        </div>
        {/* Content Area */}
        <div className={`flex-1 ${theme.heroGradient} flex items-center justify-center p-6 text-center`}>
          <div className="text-white">
            <p className="font-serif text-lg leading-relaxed">{lines[0] || "Scripture"}</p>
            <p className="text-xs mt-2 font-medium opacity-80 uppercase tracking-widest">Devotional</p>
          </div>
        </div>
        {/* Actions */}
        <div className="p-3">
          <div className="flex gap-3 mb-2">
            <HeartIcon className="w-5 h-5 text-slate-800" />
            <MessageCircle className="w-5 h-5 text-slate-800" />
            <Send className="w-5 h-5 text-slate-800" />
          </div>
          <p className="text-xs text-slate-500 line-clamp-2"><span className="font-bold text-slate-800">versed_up_user</span> {caption}</p>
        </div>
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className="w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden relative shadow-xl text-white">
        {/* Background Placeholder */}
        <div className={`absolute inset-0 opacity-50 ${theme.heroGradient}`}></div>
        <div className="absolute inset-0 flex flex-col justify-end p-4 pb-12 bg-gradient-to-t from-black/80 to-transparent">
          <div className="mb-4">
             <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg inline-block mb-2 text-xs font-bold">Verse of the Day</div>
             <p className="font-bold text-xl drop-shadow-md leading-tight mb-2">{lines[0]}</p>
             <p className="text-sm opacity-90 leading-snug">{caption.substring(0, 100)}...</p>
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center">
           <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><User className="w-5 h-5" /></div>
           <div className="flex flex-col items-center gap-1"><HeartIcon className="w-6 h-6 fill-white" /><span className="text-[10px] font-bold">8.2k</span></div>
           <div className="flex flex-col items-center gap-1"><MessageCircle className="w-6 h-6 fill-white" /><span className="text-[10px] font-bold">142</span></div>
           <div className="flex flex-col items-center gap-1"><Share2 className="w-6 h-6 fill-white" /><span className="text-[10px] font-bold">Share</span></div>
        </div>
      </div>
    );
  }

  // Default / Email / Generic
  return (
    <div className={`w-full min-h-[300px] ${theme.cardBg} border ${theme.border} rounded-2xl p-6 shadow-sm`}>
      <div className="border-b border-dashed border-slate-200 pb-4 mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject: {platform === 'email' ? 'Encouragement for you' : 'Draft'}</p>
      </div>
      <div className={`whitespace-pre-wrap ${theme.font} text-sm ${theme.textColor} leading-relaxed`}>{content}</div>
    </div>
  );
}

const Toast = ({ message, type = 'success', onClose, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 ${type === 'error' ? 'bg-red-600 text-white' : `${theme.primary} text-white`}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
};

// --- Views ---

const CreateView = ({ activeDevotional, updateDevotional, onSave, themeKey, settings }) => {
  const theme = THEMES[themeKey];
  const [fetchingVerse, setFetchingVerse] = useState(false);

  const handleOCR = async (field) => {
    const task = field === 'verse' ? 'ocr_verse' : 'ocr_notes';
    const result = await runLLM({ task, inputs: {}, settings: {} });
    if (field === 'verse') {
       updateDevotional('verseText', (activeDevotional.verseText || '') + ' ' + result);
    } else {
       updateDevotional('rawText', (activeDevotional.rawText || '') + '\n' + result);
    }
  };

  const handleGetDailyVerse = () => {
    const verses = [
      { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases..." },
      { ref: "Philippians 4:13", text: "I can do all things through him who strengthens me." },
      { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." }
    ];
    const dayIndex = new Date().getDate() % verses.length;
    const verse = verses[dayIndex];
    updateDevotional('verseRef', verse.ref);
    updateDevotional('verseText', verse.text);
  };

  const handleVerseLookup = async () => {
    if (!activeDevotional.verseRef) return;
    setFetchingVerse(true);
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(activeDevotional.verseRef)}`);
      const data = await response.json();
      if (data.text) updateDevotional('verseText', data.text.trim());
    } catch (e) { console.error("Verse lookup failed"); } finally { setFetchingVerse(false); }
  };

  const components = settings.enabledComponents || DEFAULT_SETTINGS.enabledComponents;

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className={`text-4xl font-black ${theme.textColor} ${theme.font} tracking-tight`}>New Entry</h1>
        <p className={`${theme.subTextColor} ${theme.font} text-sm font-medium`}>Capture today's inspiration.</p>
      </div>

      <div className={`w-full ${theme.heroGradient} p-5 rounded-3xl shadow-lg text-white relative overflow-hidden group transition-all`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Daily Inspiration</div>
            <div className="font-bold text-lg">Verse of the Day</div>
          </div>
          <button onClick={handleGetDailyVerse} className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors"><Sparkles className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="space-y-2">
        <label className={`text-xs font-bold uppercase tracking-wider ${theme.subTextColor} ${theme.font}`}>How is your heart?</label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map(m => {
            const Icon = m.icon;
            const isSelected = activeDevotional.mood === m.id;
            return (
              <button 
                key={m.id}
                onClick={() => updateDevotional('mood', m.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 ${isSelected ? `${m.color} ring-2 ring-offset-2 ring-${theme.accent}-200 scale-105 shadow-md` : `${theme.cardBg} border-slate-100 text-slate-400 hover:border-slate-300`}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card themeKey={themeKey}>
        <div className="space-y-6">
          <div className="relative">
            <InputGroup themeKey={themeKey} label="Verse Reference" placeholder="e.g. John 3:16" value={activeDevotional.verseRef} onChange={(val) => updateDevotional('verseRef', val)} icon={BookOpen} />
            {activeDevotional.verseRef && <button onClick={handleVerseLookup} disabled={fetchingVerse} className={`absolute right-3 top-9 p-1.5 px-3 rounded-lg text-xs font-bold ${theme.primary} text-white shadow-md`}>{fetchingVerse ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Lookup'}</button>}
          </div>
          <InputGroup themeKey={themeKey} label="Verse Text" placeholder="Paste scripture or Scan..." value={activeDevotional.verseText} onChange={(val) => updateDevotional('verseText', val)} multiline enableOCR={true} onOCR={() => handleOCR('verse')} />
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <div className="space-y-6">
          <InputGroup themeKey={themeKey} label="Title (Optional)" placeholder="Give it a hooky title..." value={activeDevotional.title} onChange={(val) => updateDevotional('title', val)} icon={PenTool} />
          <InputGroup themeKey={themeKey} label="Reflection / Body" placeholder="What is God speaking?" value={activeDevotional.rawText} onChange={(val) => updateDevotional('rawText', val)} multiline enableOCR={true} onOCR={() => handleOCR('notes')} icon={FileText} />
          
          {components.reflectionQuestions && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2 border-t border-dashed border-slate-200 mt-4">
              <InputGroup themeKey={themeKey} label="Reflection Questions" placeholder="Q1... Q2... (Auto-generated if empty)" value={activeDevotional.reflectionQuestions} onChange={(val) => updateDevotional('reflectionQuestions', val)} multiline icon={MessageSquare} className="mt-4" />
            </div>
          )}
          
          {components.prayer && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-2">
              <InputGroup themeKey={themeKey} label="Prayer" placeholder="Lord, help me... (Auto-generated if empty)" value={activeDevotional.prayer} onChange={(val) => updateDevotional('prayer', val)} multiline icon={Heart} />
            </div>
          )}
        </div>
      </Card>

      <Button onClick={onSave} className="w-full shadow-2xl" icon={Sparkles} themeKey={themeKey}>Save & Polish</Button>
    </div>
  );
};

const PolishView = ({ devotional, updateDevotional, onNext, themeKey }) => {
  const theme = THEMES[themeKey];
  const [generating, setGenerating] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState('raw');

  const handleAIAction = async (task) => {
    setGenerating(true);
    const currentSettings = JSON.parse(localStorage.getItem(`${APP_ID}_settings`) || JSON.stringify(DEFAULT_SETTINGS));
    const inputs = { 
      rawText: devotional.rawText, 
      verseRef: devotional.verseRef, 
      verseText: devotional.verseText, 
      title: devotional.title,
      prayer: devotional.prayer,
      reflectionQuestions: devotional.reflectionQuestions,
      mood: devotional.mood
    };
    const result = await runLLM({ task, inputs, settings: currentSettings });
    const newVersion = { id: generateId(), type: task, text: result, createdAt: new Date().toISOString() };
    updateDevotional('versions', [newVersion, ...devotional.versions]);
    setSelectedVersionId(newVersion.id);
    setGenerating(false);
  };

  const currentText = useMemo(() => {
    if (selectedVersionId === 'raw') return getFullContent(devotional);
    return devotional.versions.find(v => v.id === selectedVersionId)?.text || '';
  }, [selectedVersionId, devotional]);

  return (
    <div className="space-y-6 pb-32 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-extrabold ${theme.textColor} ${theme.font}`}>Polish Content</h1>
        <div className="flex items-center gap-2">
           <button onClick={() => speakText(currentText)} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Read Aloud"><Volume2 className="w-5 h-5" /></button>
           <div className={`px-3 py-1 bg-white rounded-full border ${theme.border} text-xs font-bold ${theme.subTextColor} uppercase tracking-wider shadow-sm`}>{devotional.verseRef}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => handleAIAction('fix')} loading={generating} icon={Check} className="text-sm shadow-sm" themeKey={themeKey}>Fix Grammar</Button>
        <Button variant="secondary" onClick={() => handleAIAction('structure')} loading={generating} icon={LayoutTemplate} className="text-sm shadow-sm" themeKey={themeKey}>Structure</Button>
        <Button variant="secondary" onClick={() => handleAIAction('shorten')} loading={generating} className="text-sm shadow-sm" themeKey={themeKey}>Shorten</Button>
        <Button variant="secondary" onClick={() => handleAIAction('expand')} loading={generating} className="text-sm shadow-sm" themeKey={themeKey}>Expand</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 pt-1 no-scrollbar">
        <button onClick={() => setSelectedVersionId('raw')} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedVersionId === 'raw' ? `${theme.primary} text-white shadow-md scale-105` : `${theme.cardBg} ${theme.subTextColor} border ${theme.border}`}`}>Original</button>
        {devotional.versions.map((v, idx) => (
          <button key={v.id} onClick={() => setSelectedVersionId(v.id)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedVersionId === v.id ? `${theme.primary} text-white shadow-md scale-105` : `${theme.cardBg} ${theme.subTextColor} border ${theme.border}`}`}>
            {v.type.charAt(0).toUpperCase() + v.type.slice(1)} #{devotional.versions.length - idx}
          </button>
        ))}
      </div>

      <Card className="min-h-[350px]" themeKey={themeKey}>
        <textarea className={`w-full h-full min-h-[350px] resize-none focus:outline-none ${theme.textColor} leading-relaxed bg-transparent ${theme.font} text-base`} value={currentText} onChange={() => {}} readOnly />
      </Card>
      <Button onClick={() => onNext(currentText)} className="w-full shadow-xl" icon={Share2} themeKey={themeKey}>Compile for Socials</Button>
    </div>
  );
};

const CompileView = ({ devotional, settings, baseText, onBack, themeKey }) => {
  const theme = THEMES[themeKey];
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [compiledContent, setCompiledContent] = useState('');
  const [autoFitContent, setAutoFitContent] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'text' or 'preview'

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: Smartphone },
    { id: 'tiktok', label: 'TikTok', icon: Video },
    { id: 'youtube', label: 'YouTube', icon: Video },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'generic', label: 'Generic', icon: FileText },
  ];

  const currentLimit = PLATFORM_LIMITS[activePlatform] || 100000;
  const charCount = compiledContent.length;
  const isOverLimit = charCount > currentLimit;

  useEffect(() => { setAutoFitContent(null); }, [activePlatform]);
  useEffect(() => {
    const content = {
      verseRef: devotional.verseRef,
      verseText: autoFitContent?.verseText || devotional.verseText,
      title: devotional.title,
      body: autoFitContent?.body || baseText
    };
    setCompiledContent(compilePost(activePlatform, content, settings));
  }, [activePlatform, devotional, baseText, settings, autoFitContent]);

  const handleCopy = async () => { try { await navigator.clipboard.writeText(compiledContent); return true; } catch (err) { return false; } };
  const handleShare = async () => { if (navigator.share) { try { await navigator.share({ title: devotional.title || 'Devotional', text: compiledContent }); } catch (err) { } } else { handleCopy(); } };
  const handleAutoFit = async () => {
    setIsFixing(true);
    const inputs = { rawText: baseText, verseRef: devotional.verseRef, verseText: devotional.verseText, title: devotional.title };
    const result = await runLLM({ task: 'autoFit', inputs, settings, platformLimit: currentLimit });
    setAutoFitContent(result);
    setIsFixing(false);
  };

  return (
    <div className="space-y-6 pb-32 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} hover:${theme.primaryLight} rounded-full`}><ChevronLeft className={`w-6 h-6 ${theme.subTextColor}`} /></button>
          <h1 className={`text-2xl font-extrabold ${theme.textColor} ${theme.font}`}>Compile</h1>
        </div>
        <div className="flex gap-2">
            <button onClick={() => speakText(compiledContent)} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Read Aloud"><Volume2 className="w-5 h-5" /></button>
            <button onClick={() => exportToDocument(devotional)} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Export to Word"><FileDown className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {platforms.filter(p => settings.enabledPlatforms.includes(p.id)).map(p => {
          const Icon = p.icon;
          const isActive = activePlatform === p.id;
          return (
            <button key={p.id} onClick={() => setActivePlatform(p.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all shadow-sm ${isActive ? `${theme.primary} text-white shadow-md scale-105` : `${theme.cardBg} border ${theme.border} ${theme.subTextColor}`}`}>
              <Icon className="w-4 h-4" />{p.label}
            </button>
          )
        })}
      </div>

      <div className="px-1">
        <div className={`flex justify-between text-xs font-bold ${theme.subTextColor} mb-1.5`}><span>{charCount} chars</span><span>Limit: {currentLimit}</span></div>
        <div className={`w-full h-2.5 ${theme.appBg} border ${theme.border} rounded-full overflow-hidden shadow-inner`}><div className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : theme.primary}`} style={{ width: `${Math.min((charCount / currentLimit) * 100, 100)}%` }} /></div>
        {isOverLimit && (
          <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-1 shadow-sm">
             <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
             <div className="flex-1"><p className="text-sm text-red-800 font-bold mb-1">Content too long.</p><button onClick={handleAutoFit} disabled={isFixing} className="text-xs bg-white border border-red-200 hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 mt-2 shadow-sm">{isFixing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Fix with AI</button></div>
          </div>
        )}
      </div>

      <div className="flex justify-center mb-4 bg-white/50 p-1 rounded-xl w-fit mx-auto border border-slate-200">
        <button onClick={() => setViewMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Visual Preview</button>
        <button onClick={() => setViewMode('text')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'text' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Text Only</button>
      </div>

      {viewMode === 'preview' ? (
        <div className="flex justify-center">
          <div className="w-full max-w-[320px] transition-all duration-500 animate-in fade-in zoom-in-95">
            <SocialPreview platform={activePlatform} content={compiledContent} themeKey={themeKey} />
          </div>
        </div>
      ) : (
        <Card className={`${isOverLimit ? 'border-red-200 ring-2 ring-red-100' : ''}`} themeKey={themeKey}>
          <div className={`flex justify-between items-center mb-4 border-b ${theme.border} pb-3`}>
            <span className={`text-xs font-bold ${theme.subTextColor} uppercase tracking-wider`}>Raw Text</span>
            <button onClick={handleCopy} className={`p-1.5 ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-md transition-colors`}><Copy className="w-4 h-4" /></button>
          </div>
          <div className={`whitespace-pre-wrap ${theme.font} text-sm ${theme.textColor} leading-relaxed`}>{compiledContent}</div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6"><Button variant="secondary" onClick={handleCopy} icon={Copy} themeKey={themeKey}>Copy Text</Button><Button variant="primary" onClick={handleShare} icon={Share2} disabled={isOverLimit} themeKey={themeKey}>Share / Post</Button></div>
    </div>
  );
};

const LibraryView = ({ devotionals, onSelect, onDelete, themeKey }) => {
  const theme = THEMES[themeKey];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const filtered = devotionals.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.verseRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-sm font-bold ${theme.primaryText} uppercase tracking-wide mb-1`}>{getGreeting()}, Creator</h2>
          <h1 className={`text-3xl font-extrabold ${theme.textColor} ${theme.font} tracking-tight`}>Library</h1>
        </div>
        <div className={`p-2 rounded-full ${theme.cardBg} border ${theme.border} shadow-sm`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">V</div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-3.5 w-5 h-5 ${theme.subTextColor}`} />
          <input type="text" placeholder="Search..." className={`w-full pl-11 pr-4 py-3.5 ${theme.cardBg} border ${theme.border} rounded-2xl focus:outline-none focus:ring-2 ${theme.ring} ${theme.textColor} ${theme.font} shadow-sm`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={`p-3.5 rounded-2xl border transition-all active:scale-95 ${statusFilter !== 'all' ? `${theme.primaryLight} ${theme.border} ${theme.primaryText}` : `${theme.cardBg} ${theme.border} ${theme.subTextColor} shadow-sm`}`}><Filter className="w-5 h-5" /></button>
      </div>
      {showFilter && (
        <div className={`flex gap-2 p-2 ${theme.appBg} rounded-2xl overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 border ${theme.border}`}>
          {['all', 'draft', 'polished', 'compiled'].map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${statusFilter === status ? `${theme.cardBg} ${theme.primaryText} shadow-md` : `${theme.subTextColor} hover:${theme.textColor}`}`}>{status}</button>
          ))}
        </div>
      )}
      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className={`text-center py-20 ${theme.subTextColor}`}>
            <Library className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-medium">No devotionals found.</p>
            <p className="text-xs opacity-60 mt-1">Tap the + button to start.</p>
          </div>
        ) : filtered.map(d => (
            <Card key={d.id} className="relative group hover:border-slate-300" onClick={() => onSelect(d)} themeKey={themeKey}>
              <div className="flex justify-between items-start mb-2">
                <div><h3 className={`font-bold text-lg ${theme.textColor} ${theme.font} leading-tight`}>{d.title || 'Untitled Devotional'}</h3><p className={`text-sm ${theme.primaryText} font-bold mt-1`}>{d.verseRef}</p></div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${d.status === 'compiled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
              </div>
              <p className={`text-sm ${theme.subTextColor} line-clamp-2 leading-relaxed mb-4`}>{d.rawText}</p>
              <div className={`flex justify-between items-center pt-3 border-t ${theme.border}`}>
                <span className={`text-xs font-medium ${theme.subTextColor}`}>{new Date(d.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); exportToDocument(d); }} className={`p-2 rounded-full hover:bg-slate-50 ${theme.subTextColor} hover:${theme.primaryText} transition-colors`} title="Export"><FileDown className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(d.id); }} className={`p-2 rounded-full hover:bg-red-50 ${theme.subTextColor} hover:text-red-500 transition-colors`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

const SettingsView = ({ settings, updateSetting, themeKey }) => {
  const theme = THEMES[themeKey];
  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-extrabold ${theme.textColor} ${theme.font} tracking-tight`}>Settings</h1>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.primaryText} bg-${theme.accent}-50 px-3 py-1.5 rounded-full border border-${theme.accent}-100`}>
          <Check className="w-3.5 h-3.5" /> Auto-saved
        </div>
      </div>

      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}><Sun className={`w-4 h-4 ${theme.primaryText}`} /> App Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {['classic', 'sunrise', 'sunset'].map((key) => {
            const t = THEMES[key];
            return (
              <button key={key} onClick={() => updateSetting('theme', key)} className={`p-3 rounded-2xl border text-center transition-all ${settings.theme === key ? `${t.primaryLight} ${t.primaryText} border-${t.accent}-200 ring-2 ring-${t.accent}-200 shadow-sm` : `${theme.appBg} ${theme.border} ${theme.subTextColor}`}`}>
                <span className={`block text-xs font-bold ${t.font}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}><Key className={`w-4 h-4 ${theme.primaryText}`} /> AI Configuration</h3>
        <div className="space-y-4">
           <div className={`flex items-center justify-between p-3 ${theme.appBg} rounded-xl border ${theme.border}`}>
             <span className={`text-sm font-medium ${theme.textColor}`}>AI Provider</span>
             <select className={`p-2 bg-transparent text-sm font-bold ${theme.textColor} outline-none`} value={settings.aiProvider} onChange={(e) => updateSetting('aiProvider', e.target.value)}>
               <option value="mock">Built-in (Free/Mock)</option>
               <option value="openai">OpenAI (GPT-3.5)</option>
               <option value="gemini">Google Gemini</option>
             </select>
           </div>
           {settings.aiProvider === 'openai' && (
             <InputGroup themeKey={themeKey} label="OpenAI API Key" placeholder="sk-..." value={settings.openaiKey} onChange={(val) => updateSetting('openaiKey', val)} />
           )}
           {settings.aiProvider === 'gemini' && (
             <InputGroup themeKey={themeKey} label="Gemini API Key" placeholder="AIza..." value={settings.geminiKey} onChange={(val) => updateSetting('geminiKey', val)} />
           )}
           <p className={`text-xs ${theme.subTextColor}`}>Keys are stored locally on your device only.</p>
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}><LayoutTemplate className={`w-4 h-4 ${theme.primaryText}`} /> Post Template</h3>
        <div className="space-y-3">
             <p className={`text-xs ${theme.subTextColor}`}>Enable components to show them in the Create screen:</p>
             {['title', 'scripture', 'body', 'prayer', 'reflectionQuestions', 'hashtags'].map(component => (
               <label key={component} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer hover:${theme.primaryLight} transition-colors border border-transparent hover:border-${theme.accent}-100`}>
                 <span className={`capitalize ${theme.textColor} font-bold text-sm`}>{component.replace(/([A-Z])/g, ' $1').trim()}</span>
                 <input 
                   type="checkbox"
                   checked={settings.enabledComponents?.[component] ?? true}
                   onChange={(e) => {
                     const current = settings.enabledComponents || DEFAULT_SETTINGS.enabledComponents;
                     updateSetting('enabledComponents', { ...current, [component]: e.target.checked });
                   }}
                   className={`w-5 h-5 ${theme.primaryText} rounded focus:ring-${theme.accent}-500 border-gray-300`}
                 />
               </label>
             ))}
        </div>
      </Card>

      <div className="text-center pt-8">
        <p className={`text-xs ${theme.subTextColor} mb-2`}>VersedUP v2.1.0 (Stand Out Edition)</p>
        <Button variant="danger" className="w-full text-sm py-3 shadow-md" onClick={() => localStorage.clear() || window.location.reload()} themeKey={themeKey}>Reset App Data</Button>
      </div>
    </div>
  );
};

const NavBar = ({ currentView, onChangeView, themeKey }) => {
  const theme = THEMES[themeKey];
  const items = [{ id: 'library', icon: Library, label: 'Library' }, { id: 'create', icon: Plus, label: 'New', prominent: true }, { id: 'settings', icon: Settings, label: 'Settings' }];
  return (
    <div className={`fixed bottom-0 left-0 right-0 ${theme.navBg} backdrop-blur-xl border-t ${theme.border} pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transition-colors duration-300`}>
      <div className="flex justify-between items-end max-w-md mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'create' && ['polish', 'compile'].includes(currentView));
          
          if (item.prominent) {
            return (
              <button 
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`relative -top-6 ${theme.primary} text-white p-4 rounded-full shadow-xl shadow-${theme.accent}-500/40 hover:scale-110 hover:-translate-y-1 transition-all duration-300 active:scale-95 group`}
              >
                <Icon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button 
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center gap-1.5 p-2 min-w-[64px] transition-all duration-300 group ${isActive ? theme.primaryText : `${theme.subTextColor} hover:${theme.textColor}`}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-105'}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold tracking-wide ${theme.font} ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App Orchestrator ---

export default function App() {
  const [view, setView] = useState('library');
  const [devotionals, setDevotionals] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const loadedDevos = localStorage.getItem(`${APP_ID}_data`);
    const loadedSettings = localStorage.getItem(`${APP_ID}_settings`);
    if (loadedDevos) setDevotionals(JSON.parse(loadedDevos));
    if (loadedSettings) setSettings({...DEFAULT_SETTINGS, ...JSON.parse(loadedSettings)});
  }, []);

  useEffect(() => { document.title = "VersedUP"; }, []);
  useEffect(() => { localStorage.setItem(`${APP_ID}_data`, JSON.stringify(devotionals)); }, [devotionals]);
  useEffect(() => { localStorage.setItem(`${APP_ID}_settings`, JSON.stringify(settings)); }, [settings]);

  const activeDevotional = useMemo(() => devotionals.find(d => d.id === activeId) || createDevotional(), [devotionals, activeId]);
  const themeKey = settings.theme || 'classic';
  const theme = THEMES[themeKey];

  const handleUpdateActive = (field, value) => {
    setDevotionals(prev => {
      const exists = prev.find(d => d.id === activeId);
      if (exists) return prev.map(d => d.id === activeId ? { ...d, [field]: value, updatedAt: new Date().toISOString() } : d);
      const newDevo = { ...createDevotional(), id: activeId || generateId(), [field]: value };
      setActiveId(newDevo.id);
      return [newDevo, ...prev];
    });
  };

  const handleStartNew = () => {
    const newId = generateId();
    setDevotionals(prev => [{ ...createDevotional(), id: newId }, ...prev]);
    setActiveId(newId);
    setView('create');
  };

  const handleOpen = (devo) => {
    setActiveId(devo.id);
    setView(devo.status === 'draft' ? 'create' : 'polish');
  };

  const handleDelete = (id) => {
    setDevotionals(prev => prev.filter(d => d.id !== id));
    if (activeId === id) setActiveId(null);
    setToast({ message: 'Devotional deleted', type: 'success' });
  };

  return (
    <div className={`min-h-screen ${theme.appBg} ${theme.font} transition-colors duration-500 pb-20 selection:bg-${theme.accent}-100 selection:text-${theme.accent}-900`}>
      {/* Header */}
      <div className={`sticky top-0 z-30 ${theme.navBg} backdrop-blur-xl border-b ${theme.border} px-4 py-3 transition-colors duration-300`}>
        <div
          onClick={() => setView('library')}
          className="flex items-center justify-center relative max-w-md mx-auto cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="VersedUP"
            className="h-16 md:h-20 w-auto object-contain"
            draggable="false"
          />
        </div>
      </div>
      <main className="max-w-md mx-auto p-4 animate-in fade-in duration-500">
        {view === 'library' && <LibraryView devotionals={devotionals} onSelect={handleOpen} onDelete={handleDelete} themeKey={themeKey} />}
        {view === 'create' && <CreateView activeDevotional={activeDevotional} updateDevotional={handleUpdateActive} onSave={() => { handleUpdateActive('status', 'draft'); setView('polish'); setToast({message:'Saved', type:'success'}); }} themeKey={themeKey} settings={settings} />}
        {view === 'polish' && <PolishView devotional={activeDevotional} updateDevotional={handleUpdateActive} onNext={() => { handleUpdateActive('status', 'polished'); setView('compile'); }} themeKey={themeKey} />}
        {view === 'compile' && <CompileView devotional={activeDevotional} settings={settings} baseText={activeDevotional.versions[0]?.text || getFullContent(activeDevotional)} onBack={() => setView('polish')} themeKey={themeKey} />}
        {view === 'settings' && <SettingsView settings={settings} updateSetting={(k, v) => setSettings(p => ({ ...p, [k]: v }))} themeKey={themeKey} />}
      </main>
      <NavBar currentView={view} onChangeView={(v) => v === 'create' ? handleStartNew() : setView(v)} themeKey={themeKey} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} themeKey={themeKey} />}
    </div>
  );
}
