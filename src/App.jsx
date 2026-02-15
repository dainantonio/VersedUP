import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Sparkles, Share2, Library, Settings, 
  ChevronLeft, Save, Copy, Download, Trash2, 
  MoreVertical, Check, RefreshCw, Smartphone, 
  Mail, Video, Hash, FileText, LayoutTemplate,
  Search, Filter, X, Menu, SlidersHorizontal,
  MoveUp, MoveDown, AlertTriangle, Sun, Moon, BookOpen, Camera, FileDown
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

// Theme Definitions
const THEMES = {
  classic: {
    label: 'Classic',
    appBg: 'bg-slate-50',
    cardBg: 'bg-white',
    textColor: 'text-slate-900',
    subTextColor: 'text-slate-500',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primaryLight: 'bg-emerald-50',
    primaryText: 'text-emerald-600',
    border: 'border-emerald-100',
    accent: 'emerald',
    font: 'font-sans'
  },
  sunrise: {
    label: 'Sunrise',
    appBg: 'bg-sky-50',
    cardBg: 'bg-white/90',
    textColor: 'text-slate-800',
    subTextColor: 'text-slate-500',
    primary: 'bg-orange-400',
    primaryHover: 'hover:bg-orange-500',
    primaryLight: 'bg-orange-50',
    primaryText: 'text-orange-600',
    border: 'border-orange-100',
    accent: 'orange',
    font: 'font-sans'
  },
  sunset: {
    label: 'Sunset',
    appBg: 'bg-slate-900',
    cardBg: 'bg-slate-800',
    textColor: 'text-slate-100',
    subTextColor: 'text-slate-400',
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    primaryLight: 'bg-slate-700',
    primaryText: 'text-indigo-300',
    border: 'border-slate-700',
    accent: 'indigo',
    font: 'font-sans'
  },
  bible: {
    label: 'Open Bible',
    appBg: 'bg-stone-100',
    cardBg: 'bg-[#fdfbf7]', // Warm paper
    textColor: 'text-stone-900',
    subTextColor: 'text-stone-500',
    primary: 'bg-stone-700',
    primaryHover: 'hover:bg-stone-800',
    primaryLight: 'bg-stone-200',
    primaryText: 'text-stone-800',
    border: 'border-stone-200',
    accent: 'stone',
    font: 'font-serif'
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
    hashtags: true
  },
  enabledPlatforms: ['instagram', 'tiktok', 'youtube', 'email', 'generic'],
  showWatermark: true,
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
  versions: [],
  compiledPosts: {},
  tags: [],
  status: 'draft',
});

const generateId = () => crypto.randomUUID();

// Mock AI Engine
const runLLM = async ({ task, inputs, settings, platformLimit }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = '';
      const { rawText, verseText, verseRef, title } = inputs;
      const tone = settings.preferredTone || 'encouraging';
      
      switch (task) {
        case 'fix':
          result = rawText.replace(/\s+/g, ' ').trim() + ` (Refined for ${tone} clarity)`;
          break;
        case 'structure':
          result = `**Title: ${title || 'Untitled'}**\n\n**Scripture:**\n"${verseText}" - ${verseRef}\n\n**Reflection:**\n${rawText}\n\n**Prayer:**\nLord, help me apply this word today. Amen.`;
          break;
        case 'shorten':
          result = rawText.split(' ').slice(0, Math.floor(rawText.split(' ').length * 0.7)).join(' ') + '...';
          break;
        case 'expand':
          result = `${rawText}\n\nMoreover, when we look deeper at ${verseRef}, we see that this truth applies to every season of life. It invites us to trust deeper and walk closer.`;
          break;
        case 'tiktok':
          result = `POV: You need to hear this today ✨\n\n"${verseText}"\n\n${rawText}\n\n#ChristianTikTok #DailyDevotional #${verseRef.replace(/\s/g, '')}`;
          break;
        case 'autoFit':
          let fittedBody = rawText;
          let fittedVerse = verseText;
          if (rawText.length > (platformLimit * 0.6)) {
             fittedBody = rawText.substring(0, Math.floor(platformLimit * 0.5)) + "...";
          }
          if ((fittedBody.length + fittedVerse.length) > platformLimit) {
             fittedVerse = verseText.substring(0, 100) + "...";
          }
          result = { body: fittedBody, verseText: fittedVerse }; 
          break;
        case 'ocr_verse':
          result = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
          break;
        case 'ocr_notes':
          result = "I felt really moved by this verse today. It reminds me that love is about giving, not just receiving. I need to practice this generosity in my daily walk.";
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

  const buildSection = (type, text) => {
    if (isCustom && !components[type]) return '';
    return text;
  };

  const hashtags = settings.hashtagStyle === 'minimal' ? '#Faith' : '#Faith #Devotional #Jesus #Bible #ChristianLiving';
  const hashSection = buildSection('hashtags', hashtags);

  let compiled = '';

  switch (platform) {
    case 'tiktok':
      compiled = `📖 ${verseRef}\n\n${body}\n\n👇 Thoughts?\n\n${hashSection} #fyp`;
      break;
    case 'instagram':
      const titlePart = buildSection('title', title ? `TITLE: ${title}\n\n` : '');
      const scripturePart = buildSection('scripture', `“${verseText}”\n— ${verseRef}\n`);
      const bodyPart = buildSection('body', body);
      compiled = `${titlePart}${scripturePart}.\n.\n${bodyPart}\n.\n.\nSave this for later 📌\n${hashSection}`;
      break;
    case 'youtube':
      compiled = `${title || 'Daily Devotional'} | ${verseRef}\n\n${body}\n\nSUBSCRIBE for more encouragement!`;
      break;
    case 'email':
      compiled = `Subject: Encouragement for you: ${verseRef}\n\nHi Friend,\n\nI was reading ${verseRef} today:\n\n"${verseText}"\n\n${body}\n\nBlessings,\n[Your Name]`;
      break;
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

// Export to Word/Doc Helper
const exportToDocument = (devotional) => {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${devotional.title || 'Devotional'}</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h1 style="color: #059669;">${devotional.title || 'Untitled Devotional'}</h1>
      <p style="color: #666; font-size: 0.9em;">Created with VersedUP on ${new Date(devotional.createdAt).toLocaleDateString()}</p>
      <hr />
      
      <h3>Scripture</h3>
      <p><strong>${devotional.verseRef}</strong></p>
      <p><em>"${devotional.verseText}"</em></p>
      
      <h3>Reflection</h3>
      <p>${devotional.versions.length > 0 ? devotional.versions[0].text : devotional.rawText}</p>
      
      <br/>
      <p style="text-align: center; color: #999; font-size: 0.8em;">Generated by VersedUP</p>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${devotional.title || 'devotional'}.doc`; // .doc opens in Word and GDocs
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * COMPONENTS
 */

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, loading = false, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: `${theme.primary} text-white shadow-lg shadow-${theme.accent}-500/20 ${theme.primaryHover}`,
    secondary: `${theme.cardBg} ${theme.textColor} border ${theme.border} hover:${theme.primaryLight}`,
    ghost: `bg-transparent ${theme.subTextColor} hover:${theme.primaryLight}`,
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className} ${theme.font}`}
    >
      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, multiline = false, className = '', themeKey = 'classic', enableOCR = false, onOCR }) => {
  const theme = THEMES[themeKey];
  const fileInputRef = useRef(null);
  const [scanning, setScanning] = useState(false);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      setScanning(true);
      // In a real app, send file to OCR API here.
      // Simulating delay and response via callback
      await onOCR(); 
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center">
        <label className={`text-xs font-semibold uppercase tracking-wider ${theme.subTextColor} ${theme.font}`}>{label}</label>
        {enableOCR && (
          <div>
             <input 
               type="file" 
               accept="image/*" 
               capture="environment"
               className="hidden" 
               ref={fileInputRef}
               onChange={handleFileChange}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className={`text-xs flex items-center gap-1 ${theme.primaryText} hover:underline`}
               disabled={scanning}
             >
               {scanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
               {scanning ? 'Scanning...' : 'Scan Text'}
             </button>
          </div>
        )}
      </div>
      
      {multiline ? (
        <textarea 
          className={`w-full p-4 ${theme.appBg} border ${theme.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-${theme.accent}-500/50 transition-all ${theme.textColor} leading-relaxed resize-none ${theme.font}`}
          rows={6}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input 
          className={`w-full p-3 ${theme.appBg} border ${theme.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-${theme.accent}-500/50 transition-all ${theme.textColor} font-medium ${theme.font}`}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

const Card = ({ children, className = '', onClick, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  return (
    <div onClick={onClick} className={`${theme.cardBg} border ${theme.border} shadow-sm rounded-2xl p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose, themeKey = 'classic' }) => {
  const theme = THEMES[themeKey];
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 ${type === 'error' ? 'bg-red-600 text-white' : `${theme.primary} text-white`}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// --- Views ---

const CreateView = ({ activeDevotional, updateDevotional, onSave, themeKey }) => {
  const theme = THEMES[themeKey];
  
  const handleOCR = async (field) => {
    // Determine context for simulation
    const task = field === 'verse' ? 'ocr_verse' : 'ocr_notes';
    const result = await runLLM({ task, inputs: {}, settings: {} });
    
    if (field === 'verse') {
       // Append or replace? For safety, we append if not empty
       const current = activeDevotional.verseText;
       updateDevotional('verseText', current ? current + ' ' + result : result);
    } else {
       const current = activeDevotional.rawText;
       updateDevotional('rawText', current ? current + '\n' + result : result);
    }
  };

  const handleGetDailyVerse = () => {
    const verses = [
      { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness." },
      { ref: "Philippians 4:13", text: "I can do all things through him who strengthens me." },
      { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
      { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." }
    ];
    const dayIndex = new Date().getDate() % verses.length;
    const verse = verses[dayIndex];
    updateDevotional('verseRef', verse.ref);
    updateDevotional('verseText', verse.text);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="space-y-4">
        <h1 className={`text-2xl font-bold ${theme.textColor} ${theme.font}`}>New Devotional</h1>
        <p className={`${theme.subTextColor} ${theme.font}`}>Capture the verse and your raw thoughts. We'll handle the polish later.</p>
      </div>

      <button 
        onClick={handleGetDailyVerse}
        className={`w-full ${theme.cardBg} border ${theme.border} p-4 rounded-xl flex items-center justify-between group shadow-sm hover:shadow-md hover:border-${theme.accent}-300 transition-all active:scale-[0.98]`}
      >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${theme.primaryLight} rounded-full flex items-center justify-center ${theme.primaryText}`}>
                <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
                <div className={`text-sm font-bold ${theme.textColor}`}>Verse of the Day</div>
                <div className={`text-xs ${theme.subTextColor}`}>Tap to load today's scripture</div>
            </div>
        </div>
        <div className={`${theme.appBg} p-2 rounded-full ${theme.subTextColor} group-hover:${theme.primaryLight} group-hover:${theme.primaryText} transition-colors`}>
            <ChevronLeft className="w-4 h-4 rotate-180" />
        </div>
      </button>

      <div className="relative py-2">
        <div className={`absolute inset-0 flex items-center`}>
          <div className={`w-full border-t ${theme.border}`}></div>
        </div>
        <div className="relative flex justify-center">
          <span className={`${theme.appBg} px-2 text-xs font-semibold ${theme.subTextColor} uppercase tracking-wider`}>Or write your own</span>
        </div>
      </div>

      <Card themeKey={themeKey}>
        <div className="space-y-4">
          <InputGroup themeKey={themeKey} label="Verse Reference" placeholder="e.g. John 3:16" value={activeDevotional.verseRef} onChange={(val) => updateDevotional('verseRef', val)} />
          <InputGroup 
            themeKey={themeKey} 
            label="Verse Text" 
            placeholder="Paste scripture or Scan from Bible..." 
            value={activeDevotional.verseText} 
            onChange={(val) => updateDevotional('verseText', val)} 
            multiline 
            enableOCR={true}
            onOCR={() => handleOCR('verse')}
          />
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <InputGroup themeKey={themeKey} label="Title (Optional)" placeholder="Give it a hooky title..." value={activeDevotional.title} onChange={(val) => updateDevotional('title', val)} />
        <div className="mt-4">
          <InputGroup 
            themeKey={themeKey} 
            label="Your Thoughts" 
            placeholder="What is God speaking through this? Write or Scan your notes." 
            value={activeDevotional.rawText} 
            onChange={(val) => updateDevotional('rawText', val)} 
            multiline 
            enableOCR={true}
            onOCR={() => handleOCR('notes')}
          />
        </div>
      </Card>

      <Button onClick={onSave} className="w-full" icon={Sparkles} themeKey={themeKey}>
        Save & Polish
      </Button>
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
    const inputs = { rawText: devotional.rawText, verseRef: devotional.verseRef, verseText: devotional.verseText, title: devotional.title };
    const result = await runLLM({ task, inputs, settings: currentSettings });
    const newVersion = { id: generateId(), type: task, text: result, createdAt: new Date().toISOString() };
    updateDevotional('versions', [newVersion, ...devotional.versions]);
    setSelectedVersionId(newVersion.id);
    setGenerating(false);
  };

  const currentText = useMemo(() => {
    if (selectedVersionId === 'raw') return devotional.rawText;
    return devotional.versions.find(v => v.id === selectedVersionId)?.text || '';
  }, [selectedVersionId, devotional]);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${theme.textColor} ${theme.font}`}>Polish</h1>
        <div className={`text-xs font-medium ${theme.subTextColor} uppercase tracking-wider`}>{devotional.verseRef}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => handleAIAction('fix')} loading={generating} icon={Check} className="text-sm" themeKey={themeKey}>Fix Grammar</Button>
        <Button variant="secondary" onClick={() => handleAIAction('structure')} loading={generating} icon={LayoutTemplate} className="text-sm" themeKey={themeKey}>Structure</Button>
        <Button variant="secondary" onClick={() => handleAIAction('shorten')} loading={generating} className="text-sm" themeKey={themeKey}>Shorten</Button>
        <Button variant="secondary" onClick={() => handleAIAction('expand')} loading={generating} className="text-sm" themeKey={themeKey}>Expand</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setSelectedVersionId('raw')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedVersionId === 'raw' ? `${theme.primary} text-white` : `${theme.cardBg} ${theme.subTextColor}`}`}>Original</button>
        {devotional.versions.map((v, idx) => (
          <button key={v.id} onClick={() => setSelectedVersionId(v.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedVersionId === v.id ? `${theme.primary} text-white` : `${theme.cardBg} ${theme.subTextColor}`}`}>
            {v.type.charAt(0).toUpperCase() + v.type.slice(1)} #{devotional.versions.length - idx}
          </button>
        ))}
      </div>

      <Card className="min-h-[300px]" themeKey={themeKey}>
        <textarea 
          className={`w-full h-full min-h-[300px] resize-none focus:outline-none ${theme.textColor} leading-relaxed bg-transparent ${theme.font}`}
          value={currentText}
          onChange={() => {}}
          readOnly 
        />
      </Card>

      <Button onClick={() => onNext(currentText)} className="w-full" icon={Share2} themeKey={themeKey}>Compile for Socials</Button>
    </div>
  );
};

const CompileView = ({ devotional, settings, baseText, onBack, themeKey }) => {
  const theme = THEMES[themeKey];
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [compiledContent, setCompiledContent] = useState('');
  const [autoFitContent, setAutoFitContent] = useState(null);
  const [isFixing, setIsFixing] = useState(false);

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

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(compiledContent); return true; } catch (err) { return false; }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: devotional.title || 'Devotional', text: compiledContent }); } catch (err) { console.log('Error sharing:', err); }
    } else { handleCopy(); }
  };

  const handleAutoFit = async () => {
    setIsFixing(true);
    const inputs = { rawText: baseText, verseRef: devotional.verseRef, verseText: devotional.verseText, title: devotional.title };
    const result = await runLLM({ task: 'autoFit', inputs, settings, platformLimit: currentLimit });
    setAutoFitContent(result);
    setIsFixing(false);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={`p-2 hover:${theme.primaryLight} rounded-full`}>
            <ChevronLeft className={`w-6 h-6 ${theme.subTextColor}`} />
          </button>
          <h1 className={`text-2xl font-bold ${theme.textColor} ${theme.font}`}>Compile</h1>
        </div>
        <button 
          onClick={() => exportToDocument(devotional)} 
          className={`p-2 ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-full transition-colors`}
          title="Export to Word/Doc"
        >
          <FileDown className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {platforms.filter(p => settings.enabledPlatforms.includes(p.id)).map(p => {
          const Icon = p.icon;
          const isActive = activePlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${isActive ? `${theme.primary} text-white` : `${theme.cardBg} border ${theme.border} ${theme.subTextColor}`}`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
            </button>
          )
        })}
      </div>

      <div className="px-1">
        <div className={`flex justify-between text-xs font-semibold ${theme.subTextColor} mb-1`}>
           <span>{charCount} chars</span>
           <span>Limit: {currentLimit}</span>
        </div>
        <div className={`w-full h-2 ${theme.appBg} border ${theme.border} rounded-full overflow-hidden`}>
          <div className={`h-full transition-all duration-500 ${isOverLimit ? 'bg-red-500' : theme.primary}`} style={{ width: `${Math.min((charCount / currentLimit) * 100, 100)}%` }} />
        </div>
        
        {isOverLimit && (
          <div className="mt-3 bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-1">
             <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
             <div className="flex-1">
               <p className="text-sm text-red-800 font-medium mb-1">Content is too long for {platforms.find(p=>p.id===activePlatform)?.label}</p>
               <button onClick={handleAutoFit} disabled={isFixing} className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 mt-2">
                 {isFixing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                 Fix with AI (Auto-Fit)
               </button>
             </div>
          </div>
        )}
      </div>

      <Card className={`${isOverLimit ? 'border-red-200 ring-1 ring-red-100' : ''}`} themeKey={themeKey}>
        <div className={`flex justify-between items-center mb-4 border-b ${theme.border} pb-3`}>
          <span className={`text-xs font-bold ${theme.subTextColor} uppercase tracking-wider`}>Preview: {activePlatform}</span>
          <button onClick={handleCopy} className={`p-1.5 ${theme.subTextColor} hover:${theme.primaryText} hover:${theme.primaryLight} rounded-md transition-colors`}><Copy className="w-4 h-4" /></button>
        </div>
        <div className={`whitespace-pre-wrap ${theme.font} text-sm ${theme.textColor} leading-relaxed`}>{compiledContent}</div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={handleCopy} icon={Copy} themeKey={themeKey}>Copy Text</Button>
        <Button variant="primary" onClick={handleShare} icon={Share2} disabled={isOverLimit} themeKey={themeKey}>Share / Post</Button>
      </div>
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
    <div className="space-y-6 pb-24">
      <h1 className={`text-2xl font-bold ${theme.textColor} ${theme.font}`}>VersedUP Library</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-3 w-5 h-5 ${theme.subTextColor}`} />
          <input 
            type="text" 
            placeholder="Search by verse or title..." 
            className={`w-full pl-10 pr-4 py-3 ${theme.cardBg} border ${theme.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-${theme.accent}-500/50 ${theme.textColor} ${theme.font}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={`p-3 rounded-xl border transition-colors ${statusFilter !== 'all' ? `${theme.primaryLight} ${theme.border} ${theme.primaryText}` : `${theme.cardBg} ${theme.border} ${theme.subTextColor}`}`}>
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {showFilter && (
        <div className={`flex gap-2 p-2 ${theme.appBg} rounded-xl overflow-x-auto no-scrollbar animate-in slide-in-from-top-2 border ${theme.border}`}>
          {['all', 'draft', 'polished', 'compiled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${statusFilter === status ? `${theme.cardBg} ${theme.primaryText} shadow-sm` : `${theme.subTextColor} hover:${theme.textColor}`}`}
            >
              {status}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className={`text-center py-12 ${theme.subTextColor}`}>
            <Library className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No devotionals found.</p>
          </div>
        ) : (
          filtered.map(d => (
            <Card key={d.id} className="relative group" onClick={() => onSelect(d)} themeKey={themeKey}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-bold ${theme.textColor} ${theme.font}`}>{d.title || 'Untitled Devotional'}</h3>
                  <p className={`text-sm ${theme.primaryText} font-medium mt-1`}>{d.verseRef}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); exportToDocument(d); }}
                    className={`p-1.5 ${theme.subTextColor} hover:${theme.primaryText} hover:bg-slate-100 rounded-full transition-colors`}
                    title="Export"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <span className={`text-xs px-2 py-1 rounded-full ${d.status === 'compiled' ? `${theme.primaryLight} ${theme.primaryText}` : `${theme.appBg} ${theme.subTextColor}`}`}>
                    {d.status}
                  </span>
                </div>
              </div>
              <p className={`text-sm ${theme.subTextColor} mt-3 line-clamp-2`}>{d.rawText}</p>
              <div className={`flex justify-between items-center mt-4 pt-3 border-t ${theme.border}`}>
                <span className={`text-xs ${theme.subTextColor}`}>{new Date(d.createdAt).toLocaleDateString()}</span>
                <button onClick={(e) => { e.stopPropagation(); onDelete(d.id); }} className={`p-2 ${theme.subTextColor} hover:text-red-500 transition-colors`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const SettingsView = ({ settings, updateSetting, themeKey }) => {
  const theme = THEMES[themeKey];
  return (
    <div className="space-y-6 pb-24">
      <h1 className={`text-2xl font-bold ${theme.textColor} ${theme.font}`}>Settings</h1>

      {/* Theme Selector - NEW */}
      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}>
          <Sun className={`w-4 h-4 ${theme.primaryText}`} /> App Theme
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => updateSetting('theme', key)}
              className={`p-3 rounded-xl border text-left transition-all ${settings.theme === key ? `${t.primaryLight} ${t.primaryText} border-${t.accent}-200 ring-1 ring-${t.accent}-200` : `${theme.appBg} ${theme.border} ${theme.subTextColor}`}`}
            >
              <span className={`block text-sm font-bold ${t.font}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}>
          <Sparkles className={`w-4 h-4 ${theme.primaryText}`} /> API Preference
        </h3>
        <div className="space-y-4">
           <InputGroup themeKey={themeKey} label="Preferred Tone" className="w-full" placeholder="" />
           <select 
             className={`w-full p-3 ${theme.appBg} border ${theme.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-${theme.accent}-500/50 ${theme.textColor} font-medium appearance-none`}
             value={settings.preferredTone}
             onChange={(e) => updateSetting('preferredTone', e.target.value)}
           >
             <option value="encouraging">Encouraging</option>
             <option value="teaching">Teaching</option>
             <option value="convicting">Convicting</option>
             <option value="poetic">Poetic</option>
           </select>
        </div>
      </Card>

      <Card themeKey={themeKey}>
        <h3 className={`font-bold ${theme.textColor} mb-4 flex items-center gap-2`}>
          <LayoutTemplate className={`w-4 h-4 ${theme.primaryText}`} /> Post Format
        </h3>
        <div className={`flex items-center justify-between mb-4 p-3 ${theme.appBg} rounded-xl`}>
          <span className={`text-sm font-medium ${theme.textColor}`}>Mode</span>
          <div className={`flex ${theme.cardBg} rounded-lg p-1 border ${theme.border} shadow-sm`}>
            {['standard', 'custom'].map(mode => (
              <button
                key={mode}
                onClick={() => updateSetting('postFormatMode', mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors capitalize ${settings.postFormatMode === mode ? `${theme.primaryLight} ${theme.primaryText}` : theme.subTextColor}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="text-center pt-8">
        <p className={`text-xs ${theme.subTextColor} mb-2`}>VersedUP v1.3.0 (OCR + Export)</p>
        <Button variant="danger" className="w-full text-sm py-2" onClick={() => localStorage.clear() || window.location.reload()} themeKey={themeKey}>
          Reset App Data
        </Button>
      </div>
    </div>
  );
};

const NavBar = ({ currentView, onChangeView, themeKey }) => {
  const theme = THEMES[themeKey];
  const items = [
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'create', icon: Plus, label: 'New', prominent: true },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${theme.cardBg} border-t ${theme.border} pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40`}>
      <div className="flex justify-between items-end max-w-md mx-auto">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'create' && ['polish', 'compile'].includes(currentView));
          
          if (item.prominent) {
            return (
              <button 
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`relative -top-5 ${theme.primary} text-white p-4 rounded-full shadow-lg shadow-${theme.accent}-500/30 hover:scale-105 transition-transform active:scale-95`}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button 
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors ${isActive ? theme.primaryText : `${theme.subTextColor} hover:${theme.textColor}`}`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current opacity-20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${theme.font}`}>{item.label}</span>
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
    <div className={`min-h-screen ${theme.appBg} ${theme.font} transition-colors duration-300 pb-20`}>
      {/* Header */}
      <div className={`sticky top-0 z-30 ${theme.cardBg}/90 backdrop-blur-md border-b ${theme.border} px-4 py-3 transition-colors duration-300`}>
        <div onClick={() => setView('library')} className="flex flex-col items-center justify-center relative max-w-md mx-auto cursor-pointer hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-3">
             <img 
               src="Versedup logo 2.jpg" 
               alt="VersedUP" 
               className="w-10 h-10 object-contain rounded-full shadow-md bg-white"
               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
             />
            <div className={`hidden w-10 h-10 ${theme.primary} rounded-full items-center justify-center text-white font-bold text-xl shadow-lg shadow-${theme.accent}-500/30`}>V</div>
            <span className={`font-bold text-xl tracking-tight ${theme.textColor}`}>VersedUP</span>
          </div>
          <p className={`text-xs ${theme.subTextColor} font-medium mt-1`}>Manage and Polish your devotional content.</p>
        </div>
      </div>

      <main className="max-w-md mx-auto p-4 animate-in fade-in duration-300">
        {view === 'library' && <LibraryView devotionals={devotionals} onSelect={handleOpen} onDelete={handleDelete} themeKey={themeKey} />}
        {view === 'create' && <CreateView activeDevotional={activeDevotional} updateDevotional={handleUpdateActive} onSave={() => { handleUpdateActive('status', 'draft'); setView('polish'); setToast({message:'Saved', type:'success'}); }} themeKey={themeKey} />}
        {view === 'polish' && <PolishView devotional={activeDevotional} updateDevotional={handleUpdateActive} onNext={() => { handleUpdateActive('status', 'polished'); setView('compile'); }} themeKey={themeKey} />}
        {view === 'compile' && <CompileView devotional={activeDevotional} settings={settings} baseText={activeDevotional.versions[0]?.text || activeDevotional.rawText} onBack={() => setView('polish')} themeKey={themeKey} />}
        {view === 'settings' && <SettingsView settings={settings} updateSetting={(k, v) => setSettings(p => ({ ...p, [k]: v }))} themeKey={themeKey} />}
      </main>

      <NavBar currentView={view} onChangeView={(v) => v === 'create' ? handleStartNew() : setView(v)} themeKey={themeKey} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} themeKey={themeKey} />}
    </div>
  );
}
