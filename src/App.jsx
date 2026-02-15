import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  Plus, Sparkles, Share2, Library, Settings, 
  ChevronLeft, Save, Copy, Download, Trash2, 
  MoreVertical, Check, RefreshCw, Smartphone, Mail, Video, Hash, FileText, LayoutTemplate, Search, Filter, X, Menu, SlidersHorizontal, MoveUp, MoveDown, AlertTriangle, Sun, Moon, BookOpen, Camera, FileDown, Volume2, Key, Globe, Mic, StopCircle, PenTool, MessageSquare, Heart, ChevronRight, Smile, CloudRain, Coffee, Zap, User, Send, Heart as HeartIcon, MessageCircle 
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
  username: '',
  defaultBibleVersion: 'KJV',
  exportPrefs: {
    tiktokTemplate: 'minimalLight',
    includeTitle: true,
    includeDate: true,
    includeScripture: true,
    includeUsername: true,
    includeLogo: false,
  },
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
  bibleVersion: '',
  scriptureEnabled: false,
  verseTextLocked: false,
  verseTextEdited: false,
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

const isKjv = (version) => String(version || '').toUpperCase() === 'KJV';

const openYouVersion = (passage) => {
  const query = encodeURIComponent(String(passage || '').trim());
  const url = `https://www.bible.com/search/bible?q=${query}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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

  const moodContext = mood ? `Context: User is feeling ${mood}.\nAdjust tone to be helpful for this emotion.` : "";

  let prompt = "";

  if (task === 'fix') prompt = `Fix grammar. Tone: ${tone}. ${moodContext} Text: "${rawText}"`;
  else if (task === 'structure') prompt = `Format as a devotional (${structureReq}). Verse: ${verseRef}. ${moodContext}.\nContent: ${rawText} ${prayer || ''} ${reflectionQuestions || ''}`;
  else if (task === 'shorten') prompt = `Shorten this content: "${rawText}"`;
  else if (task === 'expand') prompt = `Expand deeper: "${rawText}"`;
  else if (task === 'tiktok') prompt = `Write a viral TikTok script. Verse: ${verseRef}. Content: ${rawText}`;
  else if (task === 'autoFit') prompt = `Rewrite to be under ${platformLimit} chars. Text: ${rawText}.\nReturn valid JSON: { "body": "...", "verseText": "..." }`;
  else if (task.startsWith('ocr')) prompt = `Simulate OCR for ${task}. Return realistic text.`;

  // 1. OpenAI
  if (aiProvider === 'openai' && openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      const content = data.choices[0].message.content;
      if (task === 'autoFit') {
        try { return JSON.parse(content); }
        catch (e) { return { body: content, verseText: verseText.substring(0, 50) + '...' }; }
      }
      return content;
    } catch (e) {
      console.error("OpenAI Error", e);
    }
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
        try { return JSON.parse(cleanJson); }
        catch (e) { return { body: content, verseText: verseText.substring(0, 50) + '...' }; }
      }
      return content;
    } catch (e) {
      console.error("Gemini Error", e);
    }
  }

  // 3. Mock (Context Aware)
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = '';

      // Mood-aware mock text
      const moodIntro =
        mood === 'anxious' ? "In times of worry, remember this truth: " :
        mood === 'grateful' ? "My heart overflows with gratitude because " :
        mood === 'weary' ? "Even when strength fails, " :
        "";

      switch (task) {
        case 'fix':
          result = `${moodIntro}${rawText}`.trim() + ` (Polished)`;
          break;
        case 'structure':
          result = `**Title: ${title || 'Untitled'}**\n\n**Scripture:**\n"${verseText}" - ${verseRef}\n\n**Reflection:**\n${moodIntro}${rawText}\n\n`;
          if (components.reflectionQuestions) result += `**Questions:**\n${reflectionQuestions || '1. How does this apply today?\n2. What does this say about God?'}\n\n`;
          if (components.prayer) result += `**Prayer:**\n${prayer || 'Lord, help me apply this word today. Amen.'}`;
          break;
        case 'shorten':
          result = rawText.substring(0, Math.floor(rawText.length * 0.7)) + '...';
          break;
        case 'expand':
          result = `${moodIntro}${rawText}\n\nMoreover, when we look deeper at ${verseRef}, we see that this truth applies to every season of life.`;
          break;
        case 'tiktok':
          result = `POV: You need to hear this ✨\n\n"${verseText}"\n\n${moodIntro}${rawText}\n\n#ChristianTikTok #DailyDevotional`;
          break;
        case 'autoFit': {
          let fittedBody = rawText;
          let fittedVerse = verseText;
          if (rawText.length > (platformLimit * 0.6)) fittedBody = rawText.substring(0, Math.floor(platformLimit * 0.5)) + "...";
          if ((fittedBody.length + fittedVerse.length) > platformLimit) fittedVerse = verseText.substring(0, 100) + "...";
          result = { body: fittedBody, verseText: fittedVerse };
          break;
        }
        case 'ocr_verse':
          result = "For God so loved the world that he gave his one and only Son...";
          break;
        case 'ocr_notes':
          result = "I felt really moved by this verse today. Love is about giving.";
          break;
        default:
          result = rawText;
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
    case 'tiktok':
      compiled = ` ${verseRef}\n\n${body}\n\n Thoughts?\n\n${hashSection} #fyp`;
      break;
    case 'instagram': {
      const titlePart = buildSection('title', title ? `TITLE: ${title}\n\n` : '');
      const scripturePart = buildSection('scripture', `“${verseText}”\n— ${verseRef}\n`);
      const bodyPart = buildSection('body', body);
      compiled = `${titlePart}${scripturePart}.\n.\n${bodyPart}\n.\n.\nSave this for later \n${hashSection}`;
      break;
    }
    case 'youtube':
      compiled = `${title || 'Daily Devotional'} | ${verseRef}\n\n${body}\n\nSUBSCRIBE for more encouragement!`;
      break;
    case 'email':
      compiled = `Subject: Encouragement for you: ${verseRef}\n\nHi Friend,\n\nI was reading ${verseRef} today:\n\n"${verseText}"\n\n${body}\n\nBlessings,\n[Your Name]`;
      break;
    default: {
      const parts = [];
      if (!isCustom || components.title) parts.push(title ? title.toUpperCase() : '');
      if (!isCustom || components.scripture) parts.push(`"${verseText}" (${verseRef})`);
      if (!isCustom || components.body) parts.push(body);
      if (!isCustom || components.hashtags) parts.push(hashSection);
      compiled = parts.filter(p => p).join('\n\n');
      break;
    }
  }
  return compiled;
};

const exportToDocument = (devotional) => {
  const content = ` ${devotional.title || 'Devotional'}
# ${devotional.title || 'Untitled Devotional'}

Created with VersedUP on ${new Date(devotional.createdAt).toLocaleDateString()}

* * *

### Scripture

${devotional.verseRef}

"${devotional.verseText}"
### Reflection

${devotional.versions.length > 0 ? devotional.versions[0].text : getFullContent(devotional)}

Generated by VersedUP
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(devotional.title || 'Devotional').replace(/\s/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * COMPONENTS 
 */

const Card = ({ children, themeKey }) => {
  const theme = THEMES[themeKey];
  return (
    <div className={`${theme.cardBg} rounded-3xl shadow-sm border ${theme.border} p-6`}>
      {children}
    </div>
  );
};

const Button = ({ children, onClick, icon: Icon, className = '', themeKey, disabled = false }) => {
  const theme = THEMES[themeKey];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-white font-bold ${theme.primary} ${theme.primaryHover} transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, multiline = false, readOnly = false, className = '', themeKey = 'classic', enableOCR = false, onOCR, icon: FieldIcon }) => {
  const theme = THEMES[themeKey];
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleMicClick = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition not supported in this browser."); return; }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onChange((value ? value + " " : "") + transcript);
      setListening(false);
    };
    recognitionRef.current.onerror = () => setListening(false);
    recognitionRef.current.start();
    setListening(true);
  };

  const handleOCRClick = async () => {
    if (!enableOCR) return;
    setScanning(true);
    try {
      const res = await runLLM({ task: onOCR, inputs: {}, settings: DEFAULT_SETTINGS, platformLimit: 99999 });
      onChange(res);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`block text-xs font-bold ${theme.subTextColor}`}>{label}</label>
      <div className={`flex items-center gap-2 border ${theme.border} rounded-xl p-3 ${theme.primaryLight}`}>
        {FieldIcon && <FieldIcon className={`w-4 h-4 ${theme.subTextColor}`} />}
        {multiline ? (
          <textarea
            className={`w-full bg-transparent outline-none ${theme.textColor} text-sm font-medium resize-none`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => { if (!readOnly) onChange(e.target.value); }}
            readOnly={readOnly}
            rows={4}
          />
        ) : (
          <input
            className={`w-full bg-transparent outline-none ${theme.textColor} text-sm font-medium`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => { if (!readOnly) onChange(e.target.value); }}
            readOnly={readOnly}
          />
        )}

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleMicClick} className={`p-2 rounded-lg ${theme.cardBg} border ${theme.border}`} title="Voice input">
            {listening ? <StopCircle className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
          </button>

          {enableOCR && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
              <button type="button" onClick={handleOCRClick} disabled={scanning} className={`p-2 rounded-lg ${theme.cardBg} border ${theme.border}`} title="Scan image">
                {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * VIEWS
 */

const WriteView = ({ devotional, settings, onNext, themeKey }) => {
  const theme = THEMES[themeKey];
  const [currentText, setCurrentText] = useState(devotional.rawText || '');

  useEffect(() => setCurrentText(devotional.rawText || ''), [devotional.rawText]);

  return (
    <div className="space-y-6 pb-32 animate-in slide-in-from-left duration-500">
      <Card themeKey={themeKey}>
        <h2 className={`text-xl font-extrabold ${theme.textColor} mb-1`}>{getGreeting()}</h2>
        <p className={`${theme.subTextColor} text-sm font-medium`}>Write what’s on your heart. Then compile it for socials.</p>
      </Card>

      <Card themeKey={themeKey}>
        <textarea
          className={`w-full h-full min-h-[350px] resize-none focus:outline-none ${theme.textColor} leading-relaxed bg-transparent ${theme.font} text-base`}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="Start typing your devotional reflection..."
        />
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
  const [tiktokModalOpen, setTiktokModalOpen] = useState(false);
  const [tiktokTemplate, setTiktokTemplate] = useState(settings.exportPrefs?.tiktokTemplate || 'minimalLight');
  const [tiktokIncludeTitle, setTiktokIncludeTitle] = useState(settings.exportPrefs?.includeTitle ?? true);
  const [tiktokIncludeDate, setTiktokIncludeDate] = useState(settings.exportPrefs?.includeDate ?? true);
  const [tiktokIncludeScripture, setTiktokIncludeScripture] = useState(
    settings.exportPrefs?.includeScripture ?? Boolean(devotional?.scriptureEnabled && (devotional?.verseRef || devotional?.verseText))
  );
  const [tiktokIncludeUsername, setTiktokIncludeUsername] = useState(settings.exportPrefs?.includeUsername ?? true);
  const [tiktokIncludeLogo, setTiktokIncludeLogo] = useState(settings.exportPrefs?.includeLogo ?? false);
  const tiktokExportRef = useRef(null);

  const tiktokTemplateClasses = useMemo(() => {
    switch (tiktokTemplate) {
      case 'paper':
        return { bg: 'bg-[#FAF7F2]', text: 'text-slate-900', sub: 'text-slate-600', border: 'border-slate-200' };
      case 'minimalDark':
        return { bg: 'bg-[#0B1220]', text: 'text-slate-100', sub: 'text-slate-300', border: 'border-slate-700' };
      default:
        return { bg: 'bg-white', text: 'text-slate-900', sub: 'text-slate-600', border: 'border-slate-200' };
    }
  }, [tiktokTemplate]);

  const downloadDataUrl = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const exportTikTokPng = async () => {
    if (!tiktokExportRef.current) return;
    try {
      const dataUrl = await toPng(tiktokExportRef.current, { cacheBust: true, pixelRatio: 2 });
      const safeTitle = (devotional.title || 'devotional').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      downloadDataUrl(dataUrl, `tiktok-${safeTitle || 'devotional'}.png`);
      setTiktokModalOpen(false);
    } catch (e) {
      console.error('TikTok export failed', e);
      alert('Export failed. Try again.');
    }
  };

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

  const compiled = useMemo(() => {
    const body = devotional.versions?.[0]?.text || devotional.rawText || baseText || '';
    return compilePost(activePlatform, {
      verseRef: devotional.verseRef,
      verseText: devotional.verseText,
      title: devotional.title,
      body
    }, settings);
  }, [activePlatform, devotional, baseText, settings]);

  useEffect(() => {
    setCompiledContent(compiled);
    setAutoFitContent(null);
  }, [compiled]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compiledContent);
    alert("Copied!");
  };

  const handleAutoFit = async () => {
    setIsFixing(true);
    try {
      const limit = PLATFORM_LIMITS[activePlatform] || 2200;
      const body = devotional.versions?.[0]?.text || devotional.rawText || baseText || '';
      const fitted = await runLLM({
        task: 'autoFit',
        inputs: { rawText: body, verseText: devotional.verseText, verseRef: devotional.verseRef },
        settings,
        platformLimit: limit
      });
      setAutoFitContent(fitted);
      const next = compilePost(activePlatform, {
        verseRef: devotional.verseRef,
        verseText: fitted.verseText || devotional.verseText,
        title: devotional.title,
        body: fitted.body || body,
      }, settings);
      setCompiledContent(next);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-full border ${theme.border} ${theme.cardBg} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} transition-colors`}><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h2 className={`text-lg font-extrabold ${theme.textColor}`}>Compile</h2>
            <p className={`text-xs ${theme.subTextColor}`}>Pick a platform and export.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Copy"><Copy className="w-5 h-5" /></button>
          <button onClick={handleAutoFit} disabled={isFixing} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Auto Fit">{isFixing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}</button>
          <button onClick={() => exportToDocument(devotional)} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Export to Word"><FileDown className="w-5 h-5" /></button>
          <button onClick={() => setTiktokModalOpen(true)} className={`p-2.5 ${theme.cardBg} shadow-sm border ${theme.border} ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`} title="Export TikTok Image (PNG)"><Camera className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {platforms.filter(p => settings.enabledPlatforms.includes(p.id)).map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm transition-all ${activePlatform === p.id ? `${theme.primary} text-white border-transparent` : `${theme.cardBg} ${theme.border} ${theme.subTextColor} hover:${theme.primaryLight}`}`}
          >
            <p.icon className="w-4 h-4" />
            {p.label}
          </button>
        ))}
      </div>

      {isOverLimit && (
        <Card themeKey={themeKey}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-1" />
            <div>
              <p className={`font-bold ${theme.textColor}`}>Over character limit</p>
              <p className={`text-sm ${theme.subTextColor}`}>This post is {charCount} characters. Limit is {currentLimit}. Tap “Auto Fit” to rewrite.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Scripture (Optional) */}
      <Card themeKey={themeKey}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${theme.subTextColor}`} />
              <h3 className={`font-bold ${theme.textColor}`}>Scripture</h3>
            </div>
            <button
              onClick={() => {
                devotional.scriptureEnabled = !devotional.scriptureEnabled;
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border ${theme.border} ${theme.subTextColor} hover:${theme.primaryLight}`}
            >
              {devotional.scriptureEnabled ? 'Hide' : 'Add Scripture'}
            </button>
          </div>

          {devotional.scriptureEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <InputGroup
                  themeKey={themeKey}
                  label="Passage"
                  placeholder="e.g. John 3:16-18 or Psalm 23"
                  value={devotional.verseRef}
                  onChange={() => {}}
                  icon={BookOpen}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold mb-2 ${theme.subTextColor}`}>Bible Version</label>
                    <select
                      className={`w-full p-3 rounded-xl border ${theme.border} ${theme.cardBg} ${theme.textColor} text-sm font-bold outline-none`}
                      value={(devotional.bibleVersion || settings.defaultBibleVersion || 'KJV')}
                      onChange={() => {}}
                    >
                      <option value="KJV">KJV (Full text)</option>
                      <option value="NLT">NLT (Link only)</option>
                      <option value="ESV">ESV (Link only)</option>
                      <option value="NKJV">NKJV (Link only)</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => openYouVersion(devotional.verseRef)}
                      disabled={!devotional.verseRef}
                      className={`flex-1 p-3 rounded-xl text-sm font-bold border ${theme.border} ${theme.cardBg} ${theme.textColor} hover:${theme.primaryLight} disabled:opacity-50`}
                    >
                      Open in YouVersion
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={!devotional.verseRef || !isKjv(devotional.bibleVersion || settings.defaultBibleVersion)}
                      className={`p-3 px-4 rounded-xl text-sm font-bold ${theme.primary} text-white shadow-md disabled:opacity-50`}
                      title={isKjv(devotional.bibleVersion || settings.defaultBibleVersion) ? 'Fetch KJV text' : 'KJV only'}
                    >
                      Fetch
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className={`text-xs ${theme.subTextColor}`}>
                    {isKjv(devotional.bibleVersion || settings.defaultBibleVersion)
                      ? 'KJV text is fetched from bible-api.com.'
                      : 'Full text for this version opens in YouVersion (free-for-now).'}
                  </p>
                </div>

                <InputGroup
                  themeKey={themeKey}
                  label="Scripture Text"
                  placeholder="KJV will appear here after fetch. You can also paste text you have rights to use."
                  value={devotional.verseText}
                  onChange={() => {}}
                  multiline
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${theme.textColor}`}>Preview</h3>
          <div className="flex gap-2">
            <button onClick={() => setViewMode('preview')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${theme.border} ${viewMode === 'preview' ? `${theme.primary} text-white border-transparent` : `${theme.cardBg} ${theme.subTextColor}`}`}>Preview</button>
            <button onClick={() => setViewMode('text')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${theme.border} ${viewMode === 'text' ? `${theme.primary} text-white border-transparent` : `${theme.cardBg} ${theme.subTextColor}`}`}>Text</button>
          </div>
        </div>

        {viewMode === 'text' ? (
          <textarea className={`w-full h-[420px] resize-none bg-transparent focus:outline-none ${theme.textColor} leading-relaxed text-sm`} value={compiledContent} readOnly />
        ) : (
          <div className={`${theme.textColor} text-sm leading-relaxed whitespace-pre-wrap`}>
            {compiledContent}
          </div>
        )}
      </Card>

      {tiktokModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className={`w-full max-w-lg rounded-2xl border ${theme.border} ${theme.cardBg} shadow-2xl`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.border}`}>
              <div className="flex items-center gap-2">
                <Camera className={`w-5 h-5 ${theme.subTextColor}`} />
                <h3 className={`font-bold ${theme.textColor}`}>TikTok Export (One Screen)</h3>
              </div>
              <button onClick={() => setTiktokModalOpen(false)} className={`p-2 rounded-full ${theme.subTextColor} hover:${theme.primaryText}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-2 ${theme.subTextColor}`}>Template</label>
                  <select
                    className={`w-full p-3 rounded-xl border ${theme.border} ${theme.cardBg} ${theme.textColor} text-sm font-bold outline-none`}
                    value={tiktokTemplate}
                    onChange={(e) => setTiktokTemplate(e.target.value)}
                  >
                    <option value="minimalLight">Minimal (Light)</option>
                    <option value="paper">Paper</option>
                    <option value="minimalDark">Minimal (Dark)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 text-xs font-bold ${theme.subTextColor} border ${theme.border} rounded-xl px-3 py-2`}>
                    <input type="checkbox" checked={tiktokIncludeTitle} onChange={(e) => setTiktokIncludeTitle(e.target.checked)} />
                    Title
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-bold ${theme.subTextColor} border ${theme.border} rounded-xl px-3 py-2`}>
                    <input type="checkbox" checked={tiktokIncludeDate} onChange={(e) => setTiktokIncludeDate(e.target.checked)} />
                    Date
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-bold ${theme.subTextColor} border ${theme.border} rounded-xl px-3 py-2`}>
                    <input type="checkbox" checked={tiktokIncludeScripture} onChange={(e) => setTiktokIncludeScripture(e.target.checked)} />
                    Scripture
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-bold ${theme.subTextColor} border ${theme.border} rounded-xl px-3 py-2`}>
                    <input type="checkbox" checked={tiktokIncludeUsername} onChange={(e) => setTiktokIncludeUsername(e.target.checked)} />
                    Username
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border overflow-hidden">
                <div className="w-full bg-black/5 p-3 flex justify-center">
                  <div className="origin-top" style={{ transform: 'scale(0.22)' }}>
                    <div
                      ref={tiktokExportRef}
                      className={`w-[1080px] h-[1920px] ${tiktokTemplateClasses.bg} ${tiktokTemplateClasses.text} p-24 flex flex-col justify-between`}
                      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}
                    >
                      <div className="space-y-10">
                        {(tiktokIncludeTitle || tiktokIncludeDate) && (
                          <div className="space-y-2">
                            {tiktokIncludeTitle && (
                              <h1 className="text-6xl font-extrabold tracking-tight leading-tight">
                                {devotional.title || 'Untitled Devotional'}
                              </h1>
                            )}
                            {tiktokIncludeDate && (
                              <p className={`${tiktokTemplateClasses.sub} text-2xl font-semibold`}>
                                {new Date(devotional.updatedAt || devotional.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {tiktokIncludeScripture && (devotional.verseRef || devotional.verseText) && (
                          <div className={`rounded-3xl border ${tiktokTemplateClasses.border} p-10`}>
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-2xl font-bold">{devotional.verseRef || 'Scripture'}</p>
                              <p className={`${tiktokTemplateClasses.sub} text-xl font-semibold`}>
                                {(devotional.bibleVersion || settings.defaultBibleVersion || 'KJV')}
                              </p>
                            </div>
                            {Boolean(devotional.verseText) && (
                              <p className={`${tiktokTemplateClasses.sub} text-3xl leading-snug mt-6 whitespace-pre-wrap`}>
                                {devotional.verseText}
                              </p>
                            )}
                            {!Boolean(devotional.verseText) && !isKjv(devotional.bibleVersion || settings.defaultBibleVersion) && (
                              <p className={`${tiktokTemplateClasses.sub} text-2xl mt-6`}>
                                Full text opens in YouVersion.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <p className="text-3xl leading-snug whitespace-pre-wrap">
                            {devotional.versions?.[0]?.text || devotional.rawText || baseText || ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`${tiktokTemplateClasses.sub} text-2xl font-semibold`}>
                          {tiktokIncludeUsername && settings.username ? settings.username : ''}
                        </p>
                        <p className={`${tiktokTemplateClasses.sub} text-2xl font-semibold`}>
                          {settings.showWatermark ? 'VersedUP' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setTiktokModalOpen(false)} className={`flex-1 p-3 rounded-xl text-sm font-bold border ${theme.border} ${theme.cardBg} ${theme.textColor} hover:${theme.primaryLight}`}>
                  Cancel
                </button>
                <button onClick={exportTikTokPng} className={`flex-1 p-3 rounded-xl text-sm font-bold ${theme.primary} text-white shadow-md`}>
                  Download PNG
                </button>
              </div>

              <p className={`text-xs ${theme.subTextColor}`}>
                Tip: TikTok UI covers edges. This export uses generous margins for safety.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsView = ({ settings, updateSetting, themeKey, onReset }) => {
  const theme = THEMES[themeKey];

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <Card themeKey={themeKey}>
        <h2 className={`text-lg font-extrabold ${theme.textColor} mb-2`}>Settings</h2>
        <p className={`${theme.subTextColor} text-sm font-medium`}>Customize your writing and integrations.</p>
      </Card>

      <Card themeKey={themeKey}>
        <div className="space-y-4">
          <div className={`flex justify-between items-center p-3 rounded-xl border ${theme.border}`}>
            <span className={`text-sm font-medium ${theme.textColor}`}>Theme</span>
            <select className={`p-2 bg-transparent text-sm font-bold ${theme.textColor} outline-none`} value={settings.theme} onChange={(e) => updateSetting('theme', e.target.value)}>
              {Object.keys(THEMES).map(key => (
                <option key={key} value={key}>{THEMES[key].label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputGroup themeKey={themeKey} label="Username / Handle" placeholder="@yourname" value={settings.username || ''} onChange={(val) => updateSetting('username', val)} />
            <div>
              <label className={`block text-xs font-bold mb-2 ${theme.subTextColor}`}>Default Bible Version</label>
              <select className={`w-full p-3 rounded-xl border ${theme.border} ${theme.cardBg} ${theme.textColor} text-sm font-bold outline-none`} value={settings.defaultBibleVersion || 'KJV'} onChange={(e) => updateSetting('defaultBibleVersion', e.target.value)}>
                <option value="KJV">KJV</option>
                <option value="NLT">NLT</option>
                <option value="ESV">ESV</option>
                <option value="NKJV">NKJV</option>
              </select>
            </div>
          </div>

          <div className={`flex justify-between items-center p-3 rounded-xl border ${theme.border}`}>
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

      <Button onClick={onReset} themeKey={themeKey} icon={Trash2} className="bg-red-500 hover:bg-red-600">Reset All Data</Button>
    </div>
  );
};

const LibraryView = ({ devotionals, onOpen, onDelete, themeKey }) => {
  const theme = THEMES[themeKey];
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return devotionals;
    const q = query.toLowerCase();
    return devotionals.filter(d =>
      (d.title || '').toLowerCase().includes(q) ||
      (d.rawText || '').toLowerCase().includes(q) ||
      (d.verseRef || '').toLowerCase().includes(q)
    );
  }, [query, devotionals]);

  return (
    <div className="space-y-6 pb-32 animate-in fade-in duration-500">
      <Card themeKey={themeKey}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={`text-lg font-extrabold ${theme.textColor}`}>Library</h2>
            <p className={`${theme.subTextColor} text-sm font-medium`}>Your saved devotionals.</p>
          </div>
        </div>

        <div className="mt-4">
          <InputGroup themeKey={themeKey} label="Search" placeholder="Search by title, verse, or text..." value={query} onChange={setQuery} icon={Search} />
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card themeKey={themeKey}>
            <p className={`${theme.subTextColor} text-sm`}>No devotionals yet.</p>
          </Card>
        )}

        {filtered.map(d => (
          <div key={d.id} onClick={() => onOpen(d.id)} className="cursor-pointer">
            <Card themeKey={themeKey}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className={`font-extrabold ${theme.textColor}`}>{d.title || 'Untitled'}</h3>
                  <p className={`${theme.subTextColor} text-xs font-bold`}>{d.verseRef || 'No scripture'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); exportToDocument(d); }} className={`p-2 rounded-full hover:bg-slate-50 ${theme.subTextColor} hover:${theme.primaryText} transition-colors`} title="Export"><FileDown className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(d.id); }} className={`p-2 rounded-full hover:bg-red-50 ${theme.subTextColor} hover:text-red-500 transition-colors`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className={`text-sm ${theme.subTextColor} line-clamp-2 leading-relaxed mb-4`}>{d.rawText}</p>
              <div className={`flex justify-between items-center pt-3 border-t ${theme.border}`}>
                <span className={`text-xs font-medium ${theme.subTextColor}`}>{new Date(d.createdAt).toLocaleDateString()}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${d.status === 'compiled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{d.status}</span>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(`${APP_ID}_settings`);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [devotionals, setDevotionals] = useState(() => {
    try {
      const raw = localStorage.getItem(`${APP_ID}_devotionals`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [activeId, setActiveId] = useState(() => devotionals?.[0]?.id || null);
  const [view, setView] = useState('write'); // write | compile | library | settings

  const activeDevotional = useMemo(() => {
    return devotionals.find(d => d.id === activeId) || null;
  }, [devotionals, activeId]);

  const themeKey = settings.theme || 'classic';
  const theme = THEMES[themeKey];

  useEffect(() => {
    localStorage.setItem(`${APP_ID}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${APP_ID}_devotionals`, JSON.stringify(devotionals));
  }, [devotionals]);

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const updateDevotional = (key, value) => {
    setDevotionals(prev => prev.map(d => d.id === activeId ? { ...d, [key]: value, updatedAt: new Date().toISOString() } : d));
  };

  const handleNew = () => {
    const d = createDevotional();
    setDevotionals(prev => [d, ...prev]);
    setActiveId(d.id);
    setView('write');
  };

  const handleDelete = (id) => {
    setDevotionals(prev => prev.filter(d => d.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleReset = () => {
    if (!confirm("Reset all data?")) return;
    localStorage.removeItem(`${APP_ID}_settings`);
    localStorage.removeItem(`${APP_ID}_devotionals`);
    setSettings(DEFAULT_SETTINGS);
    setDevotionals([]);
    setActiveId(null);
    setView('write');
  };

  const handleVerseLookup = async () => {
    if (!activeDevotional?.verseRef) return;
    updateDevotional('scriptureEnabled', true);
    updateDevotional('bibleVersion', activeDevotional.bibleVersion || settings.defaultBibleVersion || 'KJV');

    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(activeDevotional.verseRef)}?translation=kjv`);
      const data = await response.json();
      if (data.text) {
        updateDevotional('verseText', data.text.trim());
        updateDevotional('verseTextLocked', true);
        updateDevotional('verseTextEdited', false);
      }
    } catch {
      alert("Verse lookup failed. Check the reference format.");
    }
  };

  const navItems = [
    { id: 'write', label: 'Write', icon: PenTool },
    { id: 'compile', label: 'Compile', icon: Share2 },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`${theme.appBg} min-h-screen ${theme.font}`}>
      <div className={`sticky top-0 z-30 ${theme.navBg} backdrop-blur-xl border-b ${theme.border} px-4 py-3 transition-colors duration-300`}>
        <div className="flex items-center justify-center relative max-w-md mx-auto">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="VersedUP"
            className="h-16 md:h-20 w-auto object-contain"
            draggable="false"
          />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-6">
        {!activeDevotional && view !== 'settings' && view !== 'library' && (
          <Card themeKey={themeKey}>
            <p className={`${theme.subTextColor} text-sm font-medium`}>No devotional selected. Create a new one.</p>
            <div className="mt-4">
              <Button themeKey={themeKey} icon={Plus} onClick={handleNew}>New Devotional</Button>
            </div>
          </Card>
        )}

        {view === 'write' && activeDevotional && (
          <WriteView
            devotional={activeDevotional}
            settings={settings}
            themeKey={themeKey}
            onNext={(text) => {
              updateDevotional('rawText', text);
              setView('compile');
            }}
          />
        )}

        {view === 'compile' && activeDevotional && (
          <CompileView
            devotional={activeDevotional}
            settings={settings}
            themeKey={themeKey}
            baseText={activeDevotional.rawText}
            onBack={() => setView('write')}
          />
        )}

        {view === 'library' && (
          <LibraryView
            devotionals={devotionals}
            themeKey={themeKey}
            onOpen={(id) => { setActiveId(id); setView('write'); }}
            onDelete={handleDelete}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            settings={settings}
            updateSetting={updateSetting}
            themeKey={themeKey}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className={`max-w-md mx-auto ${theme.navBg} backdrop-blur-xl border-t ${theme.border} px-4 py-3`}>
          <div className="grid grid-cols-4 gap-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition-all ${
                  view === item.id ? `${theme.primaryLight} ${theme.primaryText}` : `${theme.subTextColor} hover:${theme.primaryText}`
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-extrabold">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating New Button */}
      <button
        onClick={handleNew}
        className={`fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full ${theme.primary} text-white shadow-2xl flex items-center justify-center ${theme.primaryHover}`}
        title="New Devotional"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
