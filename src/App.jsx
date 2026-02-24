import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Camera,
  Check,
  CheckCircle,
  Copy,
  Library,
  Loader2,
  PenTool,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  MoreVertical,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogIn,
  LogOut,
  User,
  Trash2,
  Wand2,
  X,
  XCircle,
  ScanLine,
  Flame,
  ArrowRight,
  Quote,
  ExternalLink,
  Sun,
  Maximize2,
  Eye,
  Pencil,
  Download
} from "lucide-react";

/* --- Mocks & Global Styles for Preview --- */

// Mock html-to-image since it's not available in this environment
const toPng = async (node, options) => {
  console.log("Mock export triggered. (html-to-image is not available in preview)");
  alert("PNG Export is mocked in this preview environment.");
  return ""; // Return empty string
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Inter:wght@400;500;600;800&display=swap');

    /* Safe area padding for mobile spacing */
    .pb-safe {
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    /* Utility for hiding scrollbars (used in your code) */
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Animation Keyframes */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeSlideInBottom {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse-soft {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }

    .animate-enter {
      animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .animate-toast {
      animation: fadeSlideInBottom 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .animate-pulse-slow {
      animation: pulse-soft 3s ease-in-out infinite;
    }

    /* Serif class for scripture */
    .font-serif-scripture {
      font-family: 'Merriweather', serif;
    }

    body {
      font-family: 'Inter', sans-serif;
    }
  `}</style>
);

/* --- Original App.jsx Code --- */

const ICONS = Object.freeze({
  actions: Object.freeze({
    makeShareReady: Sparkles,
    compileForSocials: Share2,   // fixed: was Camera (OCR)
    shareNow: Share2,            // fixed: was Check (checkmark)
  }),
  nav: Object.freeze({
    home: BookOpen,
    write: PenTool,
    review: Eye,
    compile: Share2,
  }),
});
const ToastContext = React.createContext({ pushToast: () => {} });

function useToast() {
  return React.useContext(ToastContext);
}

function ToastTicker({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-20 left-0 right-0 z-[60] pointer-events-none flex justify-center">
      <div className="max-w-xs w-full px-4">
        <div className="rounded-full border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl px-4 py-2.5 flex items-center justify-center animate-toast gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <div className="text-xs font-bold text-slate-800">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}

function PageTransition({ children, className }) {
  return <div className={cn("animate-enter", className)}>{children}</div>;
}

/**
 * VersedUP — single file app
 */

const APP_ID = "versedup_v1";
const STORAGE_SETTINGS = `${APP_ID}_settings`;
const STORAGE_DEVOTIONALS = `${APP_ID}_devotionals`;
const STORAGE_STREAK = `${APP_ID}_streak`;
const STORAGE_SESSION = `${APP_ID}_session`;

const PLATFORM_LIMITS = {
  tiktok: 2200,
  instagram: 2200,
  youtube: 5000,
  email: 50000,
  generic: 50000,
};

const MOODS = [
  { id: "grateful", label: "Gratitude" },
  { id: "anxious", label: "Anxiety" },
  { id: "hopeful", label: "Hopeful" },
  { id: "weary", label: "Weary" },
];

const TOPIC_CHIPS = [
  {
    id: "gratitude",
    label: "Gratitude",
    prompt: "What is one specific thing I can thank God for today? How does it change my perspective?\n",
  },
  {
    id: "anxiety",
    label: "Anxiety",
    prompt: "What am I anxious about right now? What truth from Scripture counters that fear?\n",
  },
  {
    id: "identity",
    label: "Identity",
    prompt: "Who does God say I am in Christ? Where have I been believing a lie instead?\n",
  },
  {
    id: "forgiveness",
    label: "Forgiveness",
    prompt: "Is there someone I need to forgive (or ask forgiveness from)? What step can I take today?\n",
  },
  {
    id: "purpose",
    label: "Purpose",
    prompt: "What might God be inviting me to do or become in this season? What is one obedient next step?\n",
  },
  {
    id: "discipline",
    label: "Discipline",
    prompt: "What habit would help me stay rooted in Christ this week? How can I make it simple and consistent?\n",
  },
  {
    id: "relationships",
    label: "Relationships",
    prompt: "Where do I need to love like Jesus in my relationships? What would humility look like today?\n",
  },
];

const BIBLE_VERSIONS = ["KJV", "NLT", "ESV", "NKJV"];

const BIBLE_BOOKS = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation",
];

const VERSE_OF_DAY = {
  verseRef: "Psalm 23:1-2",
  verseText: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.",
  suggestedTitle: "The Shepherd Who Leads Me",
};


const MOOD_VERSES = Object.freeze({
  joy: { label: "Joy", verseRef: "Nehemiah 8:10", verseText: "The joy of the LORD is your strength." },
  anxiety: { label: "Anxiety", verseRef: "Philippians 4:6-7", verseText: "Be anxious for nothing… and the peace of God… shall keep your hearts and minds through Christ Jesus." },
  hope: { label: "Hope", verseRef: "Romans 15:13", verseText: "Now the God of hope fill you with all joy and peace in believing… that ye may abound in hope, through the power of the Holy Ghost." },
  peace: { label: "Peace", verseRef: "John 14:27", verseText: "Peace I leave with you, my peace I give unto you… Let not your heart be troubled." },
  strength: { label: "Strength", verseRef: "Isaiah 41:10", verseText: "Fear thou not; for I am with thee… I will strengthen thee; yea, I will help thee." },
});

const MOOD_VERSE_ORDER = Object.freeze(["joy", "anxiety", "hope", "peace", "strength"]);


const DEFAULT_SETTINGS = {
  username: "",
  theme: "light",
  aiProvider: "mock", // mock | openai | gemini
  openaiKey: "",
  geminiKey: "",
  defaultBibleVersion: "KJV",
  ocrEndpoint: "",
  ocrAutoStructure: true,
  guidedMode: true,

  // NEW
  autoFillEmptyOnTopicTap: true, // title/prayer/questions templates on topic click
  guidedAutoGenerateTikTok: true, // in Guided Fill modal: Apply also generates TikTok script
  onboardingComplete: false,

  exportPrefs: {
    tiktokTemplate: "minimalLight",
    includeTitle: true,
    includeDate: true,
    includeScripture: true,
    includeUsername: true,
    includeWatermark: true,
  },
};


const THEME_OPTIONS = Object.freeze([
  { id: "light",   label: "☀️  Light" },
  { id: "warm",    label: "🌅  Warm" },
  { id: "forest",  label: "🌿  Forest" },
  { id: "ocean",   label: "🌊  Ocean" },
  { id: "slate",   label: "🪨  Slate" },
]);

const THEME_STYLES = Object.freeze({
  light:  "from-emerald-50/60 via-slate-50 to-sky-50",
  warm:   "from-amber-50 via-orange-50/40 to-rose-50/50",
  forest: "from-green-50/80 via-emerald-50/60 to-teal-50/50",
  ocean:  "from-sky-50/80 via-blue-50/60 to-cyan-50/50",
  slate:  "from-slate-100 via-slate-50 to-zinc-50",
});


function getPublicBaseUrl() {
  try {
    // Vite
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) {
      return String(import.meta.env.BASE_URL || "/");
    }
  } catch {
    // ignore
  }
  try {
    // CRA / Webpack
    // eslint-disable-next-line no-undef
    if (typeof process !== "undefined" && process.env && process.env.PUBLIC_URL) {
      const u = String(process.env.PUBLIC_URL || "");
      return u.endsWith("/") ? u : `${u}/`;
    }
  } catch {
    // ignore
  }
  return "/";
}

function assetUrl(path) {
  const base = getPublicBaseUrl();
  const p = String(path || "").replace(/^\//, "");
  return `${base}${p}`;
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeParseJson(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}
function getDisplayName(session, settings) {
  const raw = String(settings?.username || session?.name || "").trim();
  const name = raw.replace(/^@/, "").trim();
  return name || "";
}

function getTimeGreeting(name) {
  const hour = new Date().getHours();
  const base = hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${base}, ${name}` : base;
}


function loadSession() {
  const raw = localStorage.getItem(STORAGE_SESSION);
  const parsed = safeParseJson(raw, null);
  if (!parsed || typeof parsed !== "object") return null;
  return parsed;
}

function persistSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_SESSION);
    return;
  }
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysKey(dateKey, days) {
  const [y, m, d] = dateKey.split("-").map((n) => Number(n));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayKey(dt);
}

function createDevotional(settings) {
  return {
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    mood: "",
    verseRef: "",
    bibleVersion: settings?.defaultBibleVersion || "KJV",
    verseText: "",
    verseTextEdited: false,
    title: "",
    reflection: "",
    prayer: "",
    questions: "",
    tiktokScript: "",
    status: "draft",
  };
}

function isKjv(version) {
  return String(version || "").toUpperCase() === "KJV";
}

function bibleGatewayUrl(passage, version = "KJV") {
  const q = encodeURIComponent(String(passage || "").trim());
  return `https://www.biblegateway.com/passage/?search=${q}&version=${version}`;
}

async function fetchKjvFromBibleApi(passage) {
  const ref = String(passage || "").trim();
  if (!ref) throw new Error("Enter a passage first.");
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data?.text) {
    throw new Error(data?.error || "Passage not found. Try: John 3:16-18 or Psalm 23.");
  }
  return String(data.text).trim();
}

function insertAtCursor(textareaEl, currentValue, insertText) {
  const insertion = String(insertText || "");
  if (!insertion) return currentValue;

  if (!textareaEl) {
    const sep = currentValue?.trim() ? "\n\n" : "";
    return `${currentValue || ""}${sep}${insertion}`.trimStart();
  }

  const start = textareaEl.selectionStart ?? (currentValue || "").length;
  const end = textareaEl.selectionEnd ?? start;
  const before = (currentValue || "").slice(0, start);
  const after = (currentValue || "").slice(end);
  const next = `${before}${insertion}${after}`;
  const nextPos = start + insertion.length;

  requestAnimationFrame(() => {
    try {
      textareaEl.focus();
      textareaEl.setSelectionRange(nextPos, nextPos);
    } catch {
      // no-op
    }
  });

  return next;
}

function templateGuidedFill({ topicLabel, verseRef, mood }) {
  const moodLine = mood ? `Mood: ${mood}` : "";
  const title = topicLabel ? `${topicLabel} — Rooted & Growing` : "Rooted & Growing";
  const reflection = [
    topicLabel ? `Today’s focus: ${topicLabel}.` : "Today’s focus:",
    verseRef ? `Scripture: ${verseRef}.` : "",
    moodLine,
    "",
    "What is God highlighting in my heart right now?",
    "What is one belief I need to release, and one truth I need to hold?",
    "What is one small obedient step I can take today?",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
  const prayer = [
    "Lord Jesus,",
    "Root me in You today. Help me trust Your word more than my feelings.",
    "Grow Your fruit in my life, and lead me into one clear step of obedience.",
    "Amen.",
  ].join("\n");
  const questions = [
    "1) What truth from this passage do I need to remember today?",
    "2) What is one action I can take within 24 hours?",
    "3) Who can I encourage with what I’m learning?",
  ].join("\n");
  return { title, reflection, prayer, questions };
}

/* ---------------- Error Boundary ---------------- */

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, message: String(err?.message || err || "Unknown error") };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", err);
  }
  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5" />
            <div>
              <div className="text-lg font-extrabold text-slate-900">Something went wrong</div>
              <div className="text-sm text-slate-600 mt-1">
                Try refreshing. If this keeps happening, reset local data.
              </div>
              <div className="mt-3 text-xs font-mono text-slate-500 whitespace-pre-wrap">{this.state.message}</div>
              <div className="mt-5 flex gap-2">
                <button
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-extrabold hover:bg-slate-50"
                  onClick={() => location.reload()}
                  type="button"
                >
                  Refresh
                </button>
                <button
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-extrabold hover:bg-emerald-700"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_SETTINGS);
                    localStorage.removeItem(STORAGE_DEVOTIONALS);
                    localStorage.removeItem(STORAGE_STREAK);
                    location.reload();
                  }}
                  type="button"
                >
                  Reset data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* ---------------- AI ---------------- */

function buildMoodHint(mood) {
  if (!mood) return "";
  const map = {
    grateful: "Tone: grateful, joyful, thankful.",
    anxious: "Tone: calm, reassuring, comforting for anxiety.",
    hopeful: "Tone: hopeful, uplifting, forward-looking.",
    weary: "Tone: gentle, comforting, restorative.",
  };
  return map[mood] || "";
}

async function openAiResponseText({ apiKey, prompt }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: prompt,
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();

  if (typeof data.output_text === "string" && data.output_text.length) return data.output_text;

  const parts =
    data.output?.flatMap((item) => item.content || [])?.filter((c) => c.type === "output_text") || [];
  return parts.map((p) => p.text).join("") || "";
}

async function geminiGenerate({ apiKey, prompt }) {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=" +
    encodeURIComponent(apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function ai(settings, prompt) {
  const provider = settings.aiProvider;

  if (provider === "openai" && settings.openaiKey) {
    try {
      return await openAiResponseText({ apiKey: settings.openaiKey, prompt });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("OpenAI failed; falling back to mock:", e);
      return ai({ ...settings, aiProvider: "mock" }, prompt);
    }
  }

  if (provider === "gemini" && settings.geminiKey) {
    try {
      return await geminiGenerate({ apiKey: settings.geminiKey, prompt });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Gemini failed; falling back to mock:", e);
      return ai({ ...settings, aiProvider: "mock" }, prompt);
    }
  }

  await new Promise((r) => setTimeout(r, 650));
  return prompt.slice(0, 2800);
}

async function aiFixGrammar(settings, { text, mood }) {
  const prompt = `Fix grammar and spelling. ${buildMoodHint(mood)} Return ONLY corrected text.\n\nTEXT:\n${text}`;
  return ai(settings, prompt);
}

async function aiStructure(settings, { verseRef, verseText, reflection, mood }) {
  const prompt = `Create a devotional structure with:
- Title
- Reflection (improved)
- Prayer (optional)
- 2-3 Reflection Questions

${buildMoodHint(mood)}
Scripture: ${verseRef}
Verse text:
${verseText}

User reflection:
${reflection}

Return JSON exactly:
{
  "title": "...",
  "reflection": "...",
  "prayer": "...",
  "questions": "..."
}`;
  const raw = await ai(settings, prompt);
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = safeParseJson(cleaned, null);
  if (!parsed) return { title: "", reflection: raw, prayer: "", questions: "" };
  return {
    title: String(parsed.title || ""),
    reflection: String(parsed.reflection || ""),
    prayer: String(parsed.prayer || ""),
    questions: String(parsed.questions || ""),
  };
}

async function aiGuidedFill(settings, { topicLabel, verseRef, verseText, mood }) {
  const prompt = `You are helping a Christian create a devotional journal entry.

Goal: produce ALL four sections: Title, Reflection, Prayer, Questions.
Constraints:
- Keep Reflection 120-220 words.
- Prayer 40-80 words.
- Questions: 2-3 questions, each on its own line.
- If Scripture is missing, still produce something but encourage adding a verse reference.
- Use the topic as the lens for the reflection.
- Return JSON only.

Topic: ${topicLabel}
Scripture reference: ${verseRef || "(not provided)"}
Verse text:
${verseText || "(none)"}

${buildMoodHint(mood)}

Return JSON exactly:
{
  "title": "...",
  "reflection": "...",
  "prayer": "...",
  "questions": "..."
}`;
  const raw = await ai(settings, prompt);
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = safeParseJson(cleaned, null);
  if (!parsed) {
    const fallback = templateGuidedFill({ topicLabel, verseRef, mood });
    return fallback;
  }
  return {
    title: String(parsed.title || ""),
    reflection: String(parsed.reflection || ""),
    prayer: String(parsed.prayer || ""),
    questions: String(parsed.questions || ""),
  };
}

async function aiRewriteLength(settings, { text, mood, direction }) {
  const prompt =
    direction === "shorten"
      ? `Shorten this while keeping meaning. ${buildMoodHint(mood)} Return ONLY text.\n\n${text}`
      : `Lengthen this with more depth and clarity. ${buildMoodHint(mood)} Return ONLY text.\n\n${text}`;
  return ai(settings, prompt);
}

async function aiTikTokScript(settings, { verseRef, verseText, reflection, mood, baseScript, mode }) {
  const style =
    "Write a TikTok script with: Hook (1 line), Scripture reference, 4-8 short punchy lines, soft CTA (save/share), optional 2-4 hashtags. Use line breaks. Keep under 2200 chars.";
  const base =
    mode === "improve"
      ? `Improve this existing TikTok script without changing the meaning too much:\n\n${baseScript}`
      : `Source content:\nVerse: ${verseRef}\nVerse text:\n${verseText}\nReflection:\n${reflection}`;
  const prompt = `${style}\n${buildMoodHint(mood)}\n\n${base}\n\nReturn ONLY the script text.`;
  return ai(settings, prompt);
}

/* ---------------- OCR helpers ---------------- */

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

async function callOcr(endpoint, file) {
  const base64 = await readFileAsBase64(file);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return String(data?.text || "");
}

function normalizeOcrText(t) {
  return String(t || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectVerseRef(text) {
  const t = String(text || "");
  const re =
    /\b((?:[1-3]\s*)?(?:[A-Za-z]+(?:\s+[A-Za-z]+){0,3}))\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?(?:\s*[-–]\s*(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?)?\b/;
  const m = t.match(re);
  if (!m) return "";
  const book = m[1].replace(/\s+/g, " ").trim();
  const chapter = m[2];
  const v1 = m[3];
  const v2 = m[4];
  const ch2 = m[5];
  const vv1 = m[6];
  const vv2 = m[7];

  if (!v1) return `${book} ${chapter}`;
  if (ch2) {
    const end = vv2 ? `${ch2}:${vv1}-${vv2}` : `${ch2}:${vv1 || ""}`.replace(/:$/, "");
    return `${book} ${chapter}:${v1}-${end}`;
  }
  return v2 ? `${book} ${chapter}:${v1}-${v2}` : `${book} ${chapter}:${v1}`;
}

function splitSectionsFromOcr(text) {
  const raw = normalizeOcrText(text);
  const lines = raw.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  const verseRef = detectVerseRef(raw);

  const title =
    nonEmpty.find((l) => l.length <= 60 && (!verseRef || !l.toLowerCase().includes(verseRef.toLowerCase()))) || "";

  const prayerIdx = lines.findIndex((l) => /^prayer[:\s]/i.test(l));
  const questionsIdx = lines.findIndex((l) => /^(questions|reflection questions)[:\s]/i.test(l));
  const verseTextHintIdx = lines.findIndex((l) => /^verse[:\s]/i.test(l) || /^scripture[:\s]/i.test(l));

  let verseText = "";
  if (verseTextHintIdx >= 0) {
    verseText = lines.slice(verseTextHintIdx + 1, verseTextHintIdx + 10).join("\n").trim();
  }

  const startBodyIdx = Math.max(0, verseTextHintIdx >= 0 ? verseTextHintIdx + 1 : 0);
  const endBodyIdx = [prayerIdx, questionsIdx].filter((x) => x >= 0).sort((a, b) => a - b)[0] ?? lines.length;

  let reflection = lines.slice(startBodyIdx, endBodyIdx).join("\n").trim();

  let prayer = "";
  if (prayerIdx >= 0) {
    const end = questionsIdx >= 0 ? questionsIdx : lines.length;
    prayer = lines.slice(prayerIdx + 1, end).join("\n").trim();
  }

  let questions = "";
  if (questionsIdx >= 0) {
    questions = lines.slice(questionsIdx + 1).join("\n").trim();
  }

  if (!verseText && verseRef) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(verseRef.toLowerCase()));
    if (idx >= 0) verseText = lines.slice(idx + 1, idx + 12).join("\n").trim();
  }

  if (reflection === title) reflection = "";

  return {
    verseRef,
    verseText,
    title,
    reflection,
    prayer,
    questions,
  };
}

/* ---------------- UI primitives ---------------- */

function Card({ children, className }) {
  return (
    <div
      className={cn(
        "bg-white/80 rounded-3xl border border-slate-200 shadow-sm p-5",
        "backdrop-blur-md transition-all duration-300 hover:shadow-md hover:border-emerald-100",
        className
      )}
    >
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 relative overflow-hidden group",
        "active:scale-[0.985] will-change-transform shadow-md hover:shadow-lg shadow-emerald-600/20",
        disabled && "opacity-50 cursor-not-allowed shadow-none"
      )}
      type="button"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      {Icon ? <Icon className="w-5 h-5 relative z-10" /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 rounded-full border text-xs font-bold transition-all duration-200 whitespace-nowrap",
        "active:scale-[0.98] will-change-transform",
        active
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
      )}
      type="button"
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick, disabled, icon: Icon, tone = "neutral", type = "button" }) {
  const base =
    "px-3 py-2 rounded-xl text-xs font-extrabold border transition-all duration-200 flex items-center gap-2 justify-center active:scale-[0.98] will-change-transform";
  const variants = {
    neutral: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-sm",
    primary: "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20",
    danger: "bg-white border-slate-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[tone], disabled && "opacity-50 cursor-not-allowed shadow-none")}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-enter">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-sm">
          <div className="font-extrabold text-slate-900 text-lg">{title}</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 active:scale-[0.98] transition-colors" type="button">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer ? <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm">{footer}</div> : null}
      </div>
    </div>
  );
}

function ApplySectionCard({ k, label, value, checked, onToggle, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3 bg-white transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">{label}</div>
        <label className="text-xs font-extrabold text-slate-600 flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => onToggle(e.target.checked)} 
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          Apply
        </label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={k === "reflection" ? 5 : k === "verseText" ? 4 : 3}
        className={cn(
          "mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 resize-none transition-all",
          (k === "verseText" || k === "verseRef") ? "font-serif-scripture" : ""
        )}
      />
    </div>
  );
}

/* ---------------- Streak ---------------- */

function loadStreak() {
  const raw = localStorage.getItem(STORAGE_STREAK);
  const parsed = safeParseJson(raw, { count: 0, lastDay: "" });
  if (!parsed || typeof parsed !== "object") return { count: 0, lastDay: "" };
  const count = Number(parsed.count || 0);
  const lastDay = String(parsed.lastDay || "");
  return { count: Number.isFinite(count) ? count : 0, lastDay };
}

function saveStreak(streak) {
  localStorage.setItem(STORAGE_STREAK, JSON.stringify(streak));
}

function bumpStreakOnSave() {
  const streak = loadStreak();
  const today = todayKey();

  if (!streak.lastDay) {
    const next = { count: 1, lastDay: today };
    saveStreak(next);
    return next;
  }

  if (streak.lastDay === today) return streak;

  const yesterday = addDaysKey(today, -1);
  const next =
    streak.lastDay === yesterday
      ? { count: streak.count + 1, lastDay: today }
      : { count: 1, lastDay: today };

  saveStreak(next);
  return next;
}

/* ---------------- Views ---------------- */

function HomeView({ onNew, onLibrary, onContinue, onReflectVerseOfDay, hasActive, streak, displayName, devotionals, onOpen }) {
  const { pushToast } = useToast();
  const [moodVerseKey, setMoodVerseKey] = useState("joy");
  const moodVerse = MOOD_VERSES[moodVerseKey] || MOOD_VERSES.joy;

  const handleSelectMoodVerse = (key) => {
    setMoodVerseKey(key);
    const label = (MOOD_VERSES[key] || {}).label || "Verse";
    pushToast(`${label} verse ready.`);
  };

  return (
    <div className="space-y-4 pb-20 animate-enter">
      {/* ── Header ── */}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight leading-tight">{getTimeGreeting(displayName)}</div>
      </div>

      {/* ── Streak + CTA ── */}
      <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-sky-50/20 pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <div className="text-5xl font-black text-slate-900 tabular-nums">{streak.count}</div>
            <div className="relative w-7 h-7 flex-shrink-0">
              <Flame className="w-7 h-7 text-orange-500 drop-shadow-sm animate-pulse-slow absolute inset-0" fill="currentColor" />
              <Flame className="w-7 h-7 text-yellow-400 absolute inset-0 mix-blend-overlay" fill="currentColor" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Day streak</div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight">God meets you here.</div>
            </div>
          </div>
          <button
            onClick={hasActive ? onContinue : onNew}
            className="flex-shrink-0 px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-extrabold shadow-lg hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            type="button"
          >
            {hasActive ? "Continue" : "Start"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Verse of the Day ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[1.75rem] p-6 text-white shadow-lg relative overflow-hidden">
        <Quote className="absolute -bottom-4 -right-4 w-28 h-28 text-white/10 rotate-12" fill="currentColor" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Verse of the Day</span>
        </div>
        <div className="text-xl leading-relaxed font-serif-scripture relative z-10">{`"${VERSE_OF_DAY.verseText}"`}</div>
        <div className="mt-3 text-[10px] font-black tracking-widest opacity-70 relative z-10">{VERSE_OF_DAY.verseRef.toUpperCase()}</div>
        <button
          onClick={onReflectVerseOfDay}
          className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-md active:scale-[0.985] transition-all flex items-center gap-2 border border-white/10 relative z-10"
          type="button"
        >
          Reflect on this <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* ── Recent Draft ── */}
      {devotionals.length > 0 ? (() => {
        const last = devotionals[devotionals.length - 1];
        const preview = (last.reflection || last.aiDraft || "").slice(0, 120).trim();
        const ago = (() => {
          const diff = Date.now() - new Date(last.updatedAt || last.createdAt || Date.now()).getTime();
          const mins = Math.floor(diff / 60000);
          if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
          const hrs = Math.floor(mins / 60);
          if (hrs < 24) return `${hrs}h ago`;
          return `${Math.floor(hrs / 24)}d ago`;
        })();
        return (
          <button
            type="button"
            onClick={() => onOpen(last)}
            className="w-full text-left bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 active:scale-[0.99] transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Draft</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{ago}</span>
            </div>
            {last.verseRef ? (
              <div className="text-xs font-bold text-emerald-700 mb-1">{last.verseRef}</div>
            ) : null}
            <div className="text-sm text-slate-700 leading-relaxed line-clamp-2">
              {preview ? `"${preview}${preview.length >= 120 ? "…" : ""}"` : "Tap to continue writing…"}
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-extrabold text-slate-900 group-hover:gap-2 transition-all">
              Continue writing <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        );
      })() : (
        <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[1.75rem] border border-sky-100 p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">Today's Prompt</div>
          <div className="text-sm text-slate-700 leading-relaxed font-serif-scripture italic">
            "What is one thing God has shown you recently that you haven't yet written down?"
          </div>
          <button
            type="button"
            onClick={onNew}
            className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-sky-700 hover:text-sky-900 transition-colors"
          >
            Start writing <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

    </div>
  );
}

function OcrScanModal({ settings, mood, onClose, onApplyToDevotional }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [tab, setTab] = useState("parsed");

  const [parsed, setParsed] = useState({
    verseRef: "",
    verseText: "",
    title: "",
    reflection: "",
    prayer: "",
    questions: "",
  });

  const [structured, setStructured] = useState({
    title: "",
    reflection: "",
    prayer: "",
    questions: "",
  });

  const [applyParsed, setApplyParsed] = useState({
    verseRef: true,
    verseText: true,
    title: true,
    reflection: true,
    prayer: true,
    questions: true,
  });

  const [applyStructured, setApplyStructured] = useState({
    title: true,
    reflection: true,
    prayer: true,
    questions: true,
  });

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const canRun = Boolean(settings.ocrEndpoint?.trim());

  const generateStructure = async ({ fromParsed }) => {
    const src = fromParsed ? parsed : { ...parsed, ...structured };
    const verseRef = String(src.verseRef || "").trim();
    const verseText = String(src.verseText || "").trim();
    const reflection = String(src.reflection || "").trim();

    if (!verseRef && !reflection && !verseText) {
      pushToast("Scan first (or paste text) so there is something to structure.");
      return;
    }

    setAiBusy(true);
    try {
      const out = await aiStructure(settings, { verseRef, verseText, reflection, mood });
      setStructured(out);
      setApplyStructured({ title: true, reflection: true, prayer: true, questions: true });
      setTab("structured");
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const runOcr = async () => {
    if (!canRun) {
      pushToast("Set OCR Endpoint in Settings first (Vercel /api/ocr).");
      return;
    }
    if (!file) {
      pushToast("Select an image first.");
      return;
    }
    setBusy(true);
    try {
      const text = await callOcr(settings.ocrEndpoint.trim(), file);
      const normalized = normalizeOcrText(text);
      setRawText(normalized);
      const p = splitSectionsFromOcr(normalized);
      setParsed(p);
      setApplyParsed({
        verseRef: Boolean(p.verseRef),
        verseText: Boolean(p.verseText),
        title: Boolean(p.title),
        reflection: Boolean(p.reflection),
        prayer: Boolean(p.prayer),
        questions: Boolean(p.questions),
      });
      setTab("parsed");

      if (settings.ocrAutoStructure) {
        await generateStructure({ fromParsed: true });
      }
    } catch (e) {
      pushToast(e?.message || "OCR failed.");
    } finally {
      setBusy(false);
    }
  };

  const applyFields = () => {
    const patch = {};

    if (applyParsed.verseRef) patch.verseRef = parsed.verseRef;
    if (applyParsed.verseText) patch.verseText = parsed.verseText;

    if (tab === "structured") {
      if (applyStructured.title) patch.title = structured.title;
      else if (applyParsed.title) patch.title = parsed.title;

      if (applyStructured.reflection) patch.reflection = structured.reflection;
      else if (applyParsed.reflection) patch.reflection = parsed.reflection;

      if (applyStructured.prayer) patch.prayer = structured.prayer;
      else if (applyParsed.prayer) patch.prayer = parsed.prayer;

      if (applyStructured.questions) patch.questions = structured.questions;
      else if (applyParsed.questions) patch.questions = parsed.questions;
    } else {
      if (applyParsed.title) patch.title = parsed.title;
      if (applyParsed.reflection) patch.reflection = parsed.reflection;
      if (applyParsed.prayer) patch.prayer = parsed.prayer;
      if (applyParsed.questions) patch.questions = parsed.questions;
    }

    onApplyToDevotional(patch);
    onClose();
  };

  return (
    <Modal
      title="Scan (OCR)"
      onClose={onClose}
      footer={
        <div className="flex gap-2 items-center">
          <div className="text-xs text-slate-500 font-medium">{busy ? "Reading..." : aiBusy ? "Structuring..." : ""}</div>
          <div className="flex-1" />
          <SmallButton onClick={onClose}>Close</SmallButton>
          <SmallButton onClick={applyFields} tone="primary" disabled={!rawText}>
            Apply
          </SmallButton>
        </div>
      }
    >
      <div className="space-y-4">
        <Card className="p-4 bg-slate-50 border-0">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UPLOAD OR CAPTURE</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm">
                <Camera className="w-4 h-4" />
                Upload
              </span>
            </label>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-extrabold hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm">
                <ScanLine className="w-4 h-4" />
                Camera
              </span>
            </label>

            <SmallButton onClick={() => void runOcr()} disabled={busy || !file} tone="primary" icon={busy ? Loader2 : null}>
              {busy ? "..." : "Run OCR"}
            </SmallButton>

            <SmallButton onClick={() => void generateStructure({ fromParsed: true })} disabled={aiBusy || (!parsed.reflection && !rawText)} icon={Wand2}>
              Structure
            </SmallButton>
          </div>

          {!canRun ? (
            <div className="mt-3 text-xs font-bold text-amber-700 bg-amber-50 p-2 rounded-lg">
              OCR is not connected yet. Go to <b>Settings</b> → paste your Vercel OCR URL.
            </div>
          ) : null}

          {previewUrl ? (
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={previewUrl} alt="Scan preview" className="w-full h-auto" />
            </div>
          ) : null}
        </Card>

        {rawText ? (
          <div className="space-y-3">
            <Card className="p-4 bg-white">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OCR TEXT (RAW)</div>
              <div className="mt-2 text-xs whitespace-pre-wrap text-slate-600 max-h-40 overflow-auto font-mono bg-slate-50 p-2 rounded-lg">{rawText}</div>
            </Card>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-full w-fit">
              <Chip active={tab === "parsed"} onClick={() => setTab("parsed")}>
                Parsed
              </Chip>
              <Chip active={tab === "structured"} onClick={() => setTab("structured")}>
                Structured (AI)
              </Chip>
            </div>
              {tab === "structured" ? (
                  <div className="flex justify-end">
                <SmallButton onClick={() => void generateStructure({ fromParsed: false })} disabled={aiBusy} icon={RefreshCw}>
                  Regenerate
                </SmallButton>
                  </div>
              ) : null}

            <div className="space-y-3">
              <ApplySectionCard
                k="verseRef"
                label="Verse Ref"
                value={parsed.verseRef}
                checked={applyParsed.verseRef}
                onToggle={(v) => setApplyParsed((s) => ({ ...s, verseRef: v }))}
                onChange={(v) => setParsed((p) => ({ ...p, verseRef: v }))}
              />
              <ApplySectionCard
                k="verseText"
                label="Verse Text"
                value={parsed.verseText}
                checked={applyParsed.verseText}
                onToggle={(v) => setApplyParsed((s) => ({ ...s, verseText: v }))}
                onChange={(v) => setParsed((p) => ({ ...p, verseText: v }))}
              />

              {tab === "parsed" ? (
                <>
                  <ApplySectionCard
                    k="title"
                    label="Title"
                    value={parsed.title}
                    checked={applyParsed.title}
                    onToggle={(v) => setApplyParsed((s) => ({ ...s, title: v }))}
                    onChange={(v) => setParsed((p) => ({ ...p, title: v }))}
                  />
                  <ApplySectionCard
                    k="reflection"
                    label="Reflection"
                    value={parsed.reflection}
                    checked={applyParsed.reflection}
                    onToggle={(v) => setApplyParsed((s) => ({ ...s, reflection: v }))}
                    onChange={(v) => setParsed((p) => ({ ...p, reflection: v }))}
                  />
                  <ApplySectionCard
                    k="prayer"
                    label="Prayer"
                    value={parsed.prayer}
                    checked={applyParsed.prayer}
                    onToggle={(v) => setApplyParsed((s) => ({ ...s, prayer: v }))}
                    onChange={(v) => setParsed((p) => ({ ...p, prayer: v }))}
                  />
                  <ApplySectionCard
                    k="questions"
                    label="Questions"
                    value={parsed.questions}
                    checked={applyParsed.questions}
                    onToggle={(v) => setApplyParsed((s) => ({ ...s, questions: v }))}
                    onChange={(v) => setParsed((p) => ({ ...p, questions: v }))}
                  />
                </>
              ) : (
                <>
                  <ApplySectionCard
                    k="title"
                    label="Title (AI)"
                    value={structured.title}
                    checked={applyStructured.title}
                    onToggle={(v) => setApplyStructured((s) => ({ ...s, title: v }))}
                    onChange={(v) => setStructured((p) => ({ ...p, title: v }))}
                  />
                  <ApplySectionCard
                    k="reflection"
                    label="Reflection (AI)"
                    value={structured.reflection}
                    checked={applyStructured.reflection}
                    onToggle={(v) => setApplyStructured((s) => ({ ...s, reflection: v }))}
                    onChange={(v) => setStructured((p) => ({ ...p, reflection: v }))}
                  />
                  <ApplySectionCard
                    k="prayer"
                    label="Prayer (AI)"
                    value={structured.prayer}
                    checked={applyStructured.prayer}
                    onToggle={(v) => setApplyStructured((s) => ({ ...s, prayer: v }))}
                    onChange={(v) => setStructured((p) => ({ ...p, prayer: v }))}
                  />
                  <ApplySectionCard
                    k="questions"
                    label="Questions (AI)"
                    value={structured.questions}
                    checked={applyStructured.questions}
                    onToggle={(v) => setApplyStructured((s) => ({ ...s, questions: v }))}
                    onChange={(v) => setStructured((p) => ({ ...p, questions: v }))}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function WriteView({ devotional, settings, onUpdate, onGoCompile, onGoPolish, onSaved, onGoSettings }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureDraft, setStructureDraft] = useState({ title: "", reflection: "", prayer: "", questions: "" });
  const [apply, setApply] = useState({ title: true, reflection: true, prayer: true, questions: true });
  const [fetching, setFetching] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [guidedBusy, setGuidedBusy] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_CHIPS[0]?.id || "");

  const [guidedDraft, setGuidedDraft] = useState({ title: "", reflection: "", prayer: "", questions: "" });
  const [guidedApply, setGuidedApply] = useState({ title: true, reflection: true, prayer: true, questions: true });

  const [guidedScriptBusy, setGuidedScriptBusy] = useState(false);
  const [guidedGenerateScript, setGuidedGenerateScript] = useState(Boolean(settings.guidedAutoGenerateTikTok));
  const [shareReadyBusy, setShareReadyBusy] = useState(false);
  const [shareReadyStep, setShareReadyStep] = useState("");
  const [unsaved, setUnsaved] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [writeTab, setWriteTab] = useState("write");
  const [pvPlatform, setPvPlatform] = useState("instagram");
  const [toneMenuOpen, setToneMenuOpen] = useState(false);

  const reflectionRef = useRef(null);
  const verseRefInputRef = useRef(null);

  const version = devotional.bibleVersion || settings.defaultBibleVersion || "KJV";
  const guidedMode = Boolean(settings.guidedMode);

  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

  const handleSave = () => {
      onSaved();
      setSaveSuccess(true);
      setUnsaved(false);
      setLastSaved(new Date());
      setTimeout(() => setSaveSuccess(false), 2000);
  }

  // Auto-save: mark unsaved on any devotional change
  useEffect(() => {
    setUnsaved(true);
    const t = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devotional.verseRef, devotional.verseText, devotional.title, devotional.reflection, devotional.prayer, devotional.questions, devotional.mood]);

  const doChangeTone = async (tone) => {
    setToneMenuOpen(false);
    if (!devotional.reflection?.trim()) return;
    setBusy(true);
    try {
      const tonePrompts = {
        Reverent:       "Rewrite in a reverent, worshipful tone. Keep all meaning. Return ONLY text.",
        Poetic:         "Rewrite in a poetic, lyrical tone with vivid imagery. Keep all meaning. Return ONLY text.",
        Direct:         "Rewrite in a direct, punchy, bold tone. Keep all meaning. Return ONLY text.",
        Encouraging:    "Rewrite in an encouraging, warm, uplifting tone. Keep all meaning. Return ONLY text.",
        Conversational: "Rewrite in a casual, conversational tone like talking to a friend. Keep all meaning. Return ONLY text.",
      };
      const prompt = `${tonePrompts[tone] || "Rewrite. Return ONLY text."}

${devotional.reflection}`;
      const out = await ai(settings, prompt);
      onUpdate({ reflection: out });
    } catch (e) {
      pushToast(e?.message || "Tone change failed.");
    } finally {
      setBusy(false);
    }
  };

  const doFetch = async () => {
    setFetching(true);
    try {
      if (!isKjv(version)) {
        window.open(bibleGatewayUrl(devotional.verseRef, version), "_blank", "noopener,noreferrer");
        return;
      }
      const text = await fetchKjvFromBibleApi(devotional.verseRef);
      onUpdate({ verseText: text, verseTextEdited: false });
    } catch (e) {
      pushToast(e?.message || "Fetch failed.");
    } finally {
      setFetching(false);
    }
  };

  const doFixReflection = async () => {
    setBusy(true);
    try {
      const fixed = await aiFixGrammar(settings, { text: devotional.reflection || "", mood: devotional.mood });
      onUpdate({ reflection: fixed });
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setBusy(false);
    }
  };

  const doStructure = async () => {
    setBusy(true);
    try {
      const out = await aiStructure(settings, {
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        reflection: devotional.reflection,
        mood: devotional.mood,
      });
      setStructureDraft(out);
      setApply({ title: true, reflection: true, prayer: true, questions: true });
      setStructureOpen(true);
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setBusy(false);
    }
  };

  const applyStructure = () => {
    const patch = {};
    if (apply.title) patch.title = structureDraft.title;
    if (apply.reflection) patch.reflection = structureDraft.reflection;
    if (apply.prayer) patch.prayer = structureDraft.prayer;
    if (apply.questions) patch.questions = structureDraft.questions;
    onUpdate(patch);
    setStructureOpen(false);
  };

  const doLength = async (direction) => {
    setBusy(true);
    try {
      const out = await aiRewriteLength(settings, { text: devotional.reflection || "", mood: devotional.mood, direction });
      onUpdate({ reflection: out });
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setBusy(false);
    }
  };

  const doShareReady = async () => {
    const hasSource = Boolean((devotional.reflection || "").trim() || (devotional.verseRef || "").trim());
    if (!hasSource) {
      pushToast("Add a verse reference or reflection first.");
      return;
    }

    setShareReadyBusy(true);
    try {
      setShareReadyStep("Correcting grammar & spelling...");
      const fixed = (devotional.reflection || "").trim()
        ? await aiFixGrammar(settings, { text: devotional.reflection || "", mood: devotional.mood })
        : devotional.reflection || "";

      setShareReadyStep("Structuring your devotional...");
      const structured = await aiStructure(settings, {
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        reflection: fixed,
        mood: devotional.mood,
      });

      setShareReadyStep("Preparing share-ready draft...");
      onUpdate({
        reflection: structured.reflection || fixed,
        title: structured.title || devotional.title,
        prayer: structured.prayer || devotional.prayer,
        questions: structured.questions || devotional.questions,
      });

      handleSave();
      onGoCompile();
    } catch (e) {
      pushToast(e?.message || "We couldn’t complete the share-ready flow. Continue manually.");
    } finally {
      setShareReadyBusy(false);
      setShareReadyStep("");
    }
  };

  const topic = TOPIC_CHIPS.find((t) => t.id === selectedTopic) || TOPIC_CHIPS[0];

  const applyGuidedDraft = () => {
    const patch = {};
    if (guidedApply.title) patch.title = guidedDraft.title;
    if (guidedApply.reflection) patch.reflection = guidedDraft.reflection;
    if (guidedApply.prayer) patch.prayer = guidedDraft.prayer;
    if (guidedApply.questions) patch.questions = guidedDraft.questions;
    onUpdate(patch);
    setGuidedOpen(false);
  };

  const applyGuidedDraftAndScript = async () => {
    const patch = {};
    if (guidedApply.title) patch.title = guidedDraft.title;
    if (guidedApply.reflection) patch.reflection = guidedDraft.reflection;
    if (guidedApply.prayer) patch.prayer = guidedDraft.prayer;
    if (guidedApply.questions) patch.questions = guidedDraft.questions;

    onUpdate(patch);

    if (!guidedGenerateScript) {
      setGuidedOpen(false);
      return;
    }

    setGuidedScriptBusy(true);
    try {
      const verseRef = String(devotional.verseRef || "").trim();
      const verseText = String(devotional.verseText || "").trim();
      const reflection = String(patch.reflection ?? devotional.reflection ?? "").trim();

      const out = await aiTikTokScript(settings, {
        verseRef,
        verseText,
        reflection,
        mood: devotional.mood,
        baseScript: "",
        mode: "regenerate",
      });

      onUpdate({ tiktokScript: out });
      setGuidedOpen(false);
      pushToast("Applied + generated TikTok script ✅ (see Compile → TikTok Script)");
    } catch (e) {
      setGuidedOpen(false);
      pushToast(e?.message || "Applied, but TikTok script generation failed.");
    } finally {
      setGuidedScriptBusy(false);
    }
  };

  const openGuidedDraftFromTemplate = () => {
    const draft = templateGuidedFill({
      topicLabel: topic?.label || "",
      verseRef: devotional.verseRef,
      mood: devotional.mood,
    });
    setGuidedDraft(draft);
    setGuidedApply({ title: true, reflection: true, prayer: true, questions: true });
    setGuidedGenerateScript(Boolean(settings.guidedAutoGenerateTikTok));
    setGuidedOpen(true);
  };

  const openGuidedDraftFromAI = async () => {
    setGuidedBusy(true);
    try {
      const out = await aiGuidedFill(settings, {
        topicLabel: topic?.label || "",
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        mood: devotional.mood,
      });
      setGuidedDraft(out);
      setGuidedApply({ title: true, reflection: true, prayer: true, questions: true });
      setGuidedGenerateScript(Boolean(settings.guidedAutoGenerateTikTok));
      setGuidedOpen(true);
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setGuidedBusy(false);
    }
  };

  const onTopicClick = (t) => {
    setSelectedTopic(t.id);

    const next = insertAtCursor(reflectionRef.current, devotional.reflection || "", `${t.prompt}\n`);
    const patch = { reflection: next };

    const autoFillEmpty = Boolean(settings.autoFillEmptyOnTopicTap);

    if (guidedMode && autoFillEmpty) {
      const templ = templateGuidedFill({ topicLabel: t.label, verseRef: devotional.verseRef, mood: devotional.mood });
      if (!String(devotional.prayer || "").trim()) patch.prayer = templ.prayer;
      if (!String(devotional.questions || "").trim()) patch.questions = templ.questions;
      if (!String(devotional.title || "").trim()) patch.title = templ.title;
    }

    onUpdate(patch);
  };

  const openScan = () => {
    if (!settings.ocrEndpoint?.trim()) {
      pushToast("To scan a page, add your OCR endpoint in Settings → AI & Tools.");
      return;
    }
    setScanOpen(true);
  };

  const hasVerseRef = Boolean(String(devotional.verseRef || "").trim());
  const hasVerseText = Boolean(String(devotional.verseText || "").trim());
  const hasReflection = Boolean(String(devotional.reflection || "").trim());

  return (
    <div className="space-y-5 pb-20 animate-enter">
      {/* ── Draft Preview Modal — rendered at top level to avoid overflow-hidden trapping ── */}
      {writeTab === "preview" && (
        <DraftPreviewModal
          devotional={devotional}
          settings={settings}
          compileForPlatform={compileForPlatform}
          onClose={() => setWriteTab("write")}
          onShare={() => { handleSave(); setWriteTab("write"); onGoCompile(); }}
        />
      )}

      {/* ── Header: title + auto-save status ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-extrabold text-slate-900">New Entry</div>
          <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">CAPTURE WHAT GOD IS SPEAKING</div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {unsaved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-extrabold text-amber-700 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Unsaved
            </span>
          ) : lastSaved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">
              <Check className="w-3 h-3" />
              Saved
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Write / Preview tab bar ── */}
      <div className="flex items-center border-b border-slate-200">
        <button
          onClick={() => setWriteTab("write")}
          className={cn(
            "px-5 py-2.5 text-sm font-extrabold border-b-2 -mb-px transition-colors",
            writeTab === "write"
              ? "border-emerald-500 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-700"
          )}
        >
          Write
        </button>
        <button
          onClick={() => setWriteTab("preview")}
          className="ml-auto mb-1 flex items-center gap-1.5 px-3 py-1.5 mr-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Preview
        </button>
      </div>

      {/* ── PREVIEW TAB ── */}


      {/* ── WRITE TAB ── */}
      {writeTab === "write" ? (
      <div className="space-y-5">

      {/* ── Mood strip (compact, no card) ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mb-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Heart:</span>
        {MOODS.map((m) => (
          <Chip
            key={m.id}
            active={devotional.mood === m.id}
            onClick={() => onUpdate({ mood: devotional.mood === m.id ? "" : m.id })}
          >
            {m.label}
          </Chip>
        ))}
      </div>

      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onUpdate({ verseRef: VERSE_OF_DAY.verseRef, verseText: VERSE_OF_DAY.verseText, verseTextEdited: false })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-extrabold hover:bg-amber-100 active:scale-[0.97] transition-all"
                >
                  <Sun className="w-3 h-3" /> Today's Verse
                </button>
                <button
                  type="button"
                  onClick={() => { onUpdate({ verseRef: "", verseText: "", verseTextEdited: false }); setTimeout(() => verseRefInputRef.current?.focus(), 50); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-extrabold hover:bg-slate-200 active:scale-[0.97] transition-all"
                >
                  <BookOpen className="w-3 h-3" /> My Own Verse
                </button>
                <SmallButton onClick={openScan} icon={ScanLine}>
                  Scan
                </SmallButton>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <datalist id="bible-books-list">
                  {BIBLE_BOOKS.map(b => <option key={b} value={b} />)}
                </datalist>
                <input
                  ref={verseRefInputRef}
                  list="bible-books-list"
                  value={devotional.verseRef}
                  onChange={(e) => onUpdate({ verseRef: e.target.value })}
                  placeholder="e.g. John 3:16 or Psalms 23"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 bg-white transition-all shadow-sm focus:border-emerald-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void doFetch();
                  }}
                />
                <select
                  value={version}
                  onChange={(e) => onUpdate({ bibleVersion: e.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-extrabold bg-white"
                >
                  {BIBLE_VERSIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={doFetch}
                disabled={!hasVerseRef || fetching}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-extrabold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {fetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                )}
                {fetching ? "Loading verse..." : "Load Verse"}
              </button>
            </div>

            {guidedMode && !hasVerseRef ? (
              <div className="text-xs font-medium text-slate-500">
                Try: <span className="font-extrabold text-slate-700">John 3:16-18</span> or{" "}
                <span className="font-extrabold text-slate-700">Psalm 23</span>
              </div>
            ) : null}
            {hasVerseRef && !hasVerseText && !fetching ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-enter">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                Tap <span className="underline">Load Verse</span> above to fetch the text →
              </div>
            ) : null}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERSE TEXT</label>
              <textarea
                value={devotional.verseText}
                onChange={(e) => onUpdate({ verseText: e.target.value, verseTextEdited: true })}
                placeholder={
                  isKjv(version)
                    ? "Load Verse to auto-fill KJV, or type your own..."
                    : "Type or paste your verse here..."
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:ring-4 focus:ring-emerald-100 bg-white resize-none font-serif-scripture shadow-sm focus:border-emerald-300 transition-all"
              />
              {!isKjv(version) && hasVerseRef ? (
                <div className="mt-1.5 text-[11px] text-slate-400">
                  Need the text?{" "}
                  <button
                    type="button"
                    onClick={() => window.open(bibleGatewayUrl(devotional.verseRef, version), "_blank", "noopener,noreferrer")}
                    className="underline text-slate-500 hover:text-emerald-700 font-semibold transition-colors"
                  >
                    Look it up ↗
                  </button>
                  {" "}then paste above.
                </div>
              ) : null}
              {devotional.verseTextEdited ? (
                <div className="mt-2 text-[11px] font-bold text-amber-700">Edited override</div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TITLE (OPTIONAL)</label>
            <input
              value={devotional.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Give it a holy title..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-serif-scripture font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-shadow focus:border-emerald-300"
            />
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REFLECTION / BODY</label>
              {guidedMode ? <div className="text-[11px] font-bold text-emerald-600">Type your verse, then tap ✨ Draft for Me in the toolbar below</div> : null}
            </div>

            {guidedMode && aiNeedsKey ? (
              <div className="mt-2 text-xs font-bold text-amber-700">
                AI selected but no key. Go to <b>Settings</b> to add a key (or switch to Built-in).
              </div>
            ) : null}

            <textarea
              ref={reflectionRef}
              value={devotional.reflection}
              onChange={(e) => onUpdate({ reflection: e.target.value })}
              placeholder="Start writing your reflection..."
              rows={8}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-relaxed outline-none focus:ring-4 focus:ring-emerald-100 resize-none shadow-sm transition-shadow focus:border-emerald-300"
            />

            {guidedMode && !hasReflection ? (
              <div className="mt-2 text-xs font-bold text-slate-500">Starter: “What is God showing me about this verse today?”</div>
            ) : null}

            {/* ── Per-platform character count pills ── */}
            {hasReflection ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { id: "twitter", label: "Twitter", limit: 280 },
                  { id: "tiktok", label: "TikTok", limit: 150 },
                  { id: "instagram", label: "Instagram", limit: 2200 },
                ].map(({ id, label, limit }) => {
                  const count = (devotional.reflection || "").length;
                  const over = count > limit;
                  return (
                    <span
                      key={id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border transition-colors",
                        over
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      )}
                    >
                      {label} {count}/{limit}{!over ? " ✓" : " ✗"}
                    </span>
                  );
                })}
              </div>
            ) : null}

            {/* ── Inline AI toolbar (HubSpot-inspired) ── */}
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-visible">
              {/* Row 1: quick AI actions */}
              <div className="flex items-center gap-px p-1.5 flex-wrap">
                <button
                  onClick={() => void (aiNeedsKey ? openGuidedDraftFromTemplate() : openGuidedDraftFromAI())}
                  disabled={guidedBusy || busy}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guidedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {guidedBusy ? "Drafting..." : "Draft for Me"}
                </button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                  onClick={doFixReflection}
                  disabled={busy || !hasReflection}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >Fix</button>
                <button
                  onClick={() => void doLength("shorten")}
                  disabled={busy || !hasReflection}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >Shorten</button>
                <button
                  onClick={() => void doLength("lengthen")}
                  disabled={busy || !hasReflection}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >Expand</button>
                <button
                  onClick={doStructure}
                  disabled={busy || (!hasReflection && !hasVerseRef)}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >Structure</button>
                <div className="relative ml-auto">
                  <button
                    onClick={() => setToneMenuOpen((o) => !o)}
                    disabled={busy || !hasReflection}
                    className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tone <ChevronDown className="w-3 h-3" />
                  </button>
                  {toneMenuOpen ? (
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      {["Reverent", "Poetic", "Direct", "Encouraging", "Conversational"].map((t) => (
                        <button
                          key={t}
                          onClick={() => void doChangeTone(t)}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              {shareReadyStep ? <div className="px-3 pb-2 text-[11px] font-bold text-emerald-700">{shareReadyStep}</div> : null}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PRAYER</label>
            <textarea
              value={devotional.prayer}
              onChange={(e) => onUpdate({ prayer: e.target.value })}
              placeholder="Lord, help me..."
              rows={4}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none shadow-sm focus:border-emerald-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REFLECTION QUESTIONS</label>
            <textarea
              value={devotional.questions}
              onChange={(e) => onUpdate({ questions: e.target.value })}
              placeholder={"1) ...\n2) ..."}
              rows={3}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none shadow-sm focus:border-emerald-300"
            />
          </div>
        </div>
      </Card>

      {/* ── Bottom actions ── */}
      <div className="rounded-2xl border border-slate-100 bg-white/60 p-3 flex items-center gap-2 shadow-sm">
        <SmallButton
          onClick={handleSave}
          icon={saveSuccess ? Check : null}
          disabled={saveSuccess}
        >
          {saveSuccess ? "Saved ✓" : "Save"}
        </SmallButton>
        <div className="flex-1" />
        <SmallButton
          onClick={() => { handleSave(); onGoPolish(); }}
          icon={BookOpen}
        >
          Review
        </SmallButton>
        <SmallButton
          onClick={() => { handleSave(); onGoCompile(); }}
          icon={Share2}
          tone="primary"
        >
          Share →
        </SmallButton>
      </div>
      </div>
      ) : null}{/* end writeTab === "write" */}

      {structureOpen ? (
        <Modal
          title="Structure Preview"
          onClose={() => setStructureOpen(false)}
          footer={
            <div className="flex gap-2">
              <SmallButton onClick={() => setApply({ title: true, reflection: true, prayer: true, questions: true })} tone="neutral">
                Replace all
              </SmallButton>
              <div className="flex-1" />
              <SmallButton onClick={() => setStructureOpen(false)} tone="neutral">
                Cancel
              </SmallButton>
              <SmallButton onClick={applyStructure} tone="primary">
                Apply
              </SmallButton>
            </div>
          }
        >
          <div className="space-y-4">
            {["title", "reflection", "prayer", "questions"].map((k) => (
              <div key={k} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-500 uppercase">{k}</div>
                  <label className="text-xs font-extrabold text-slate-600 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={apply[k]} onChange={(e) => setApply((s) => ({ ...s, [k]: e.target.checked }))} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Replace
                  </label>
                </div>
                <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{structureDraft[k] || "—"}</div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}

      {guidedOpen ? (
        <Modal
          title={`Draft Preview — ${topic?.label || "Topic"}`}
          onClose={() => setGuidedOpen(false)}
          footer={
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guidedGenerateScript}
                    onChange={(e) => setGuidedGenerateScript(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Also generate TikTok script
                </label>
                <div className="text-xs text-slate-500">
                  {guidedScriptBusy ? "Generating..." : guidedGenerateScript ? "One-click: Apply + Script" : "Apply only"}
                </div>
              </div>

              <div className="flex gap-2">
                <SmallButton onClick={() => setGuidedApply({ title: true, reflection: true, prayer: true, questions: true })}>
                  Apply all
                </SmallButton>
                <div className="flex-1" />
                <SmallButton onClick={() => setGuidedOpen(false)}>Cancel</SmallButton>
                <SmallButton
                  onClick={() => void applyGuidedDraftAndScript()}
                  tone="primary"
                  disabled={guidedScriptBusy || (guidedGenerateScript && aiNeedsKey)}
                >
                  {guidedGenerateScript ? "Apply + Script" : "Apply"}
                </SmallButton>
              </div>

              {guidedGenerateScript && aiNeedsKey ? (
                <div className="text-xs font-bold text-amber-700">
                  Add an AI key in <b>Settings</b> (or toggle off script generation).
                </div>
              ) : null}
            </div>
          }
        >
          <div className="space-y-3">
            {[
              { k: "title", label: "Title" },
              { k: "reflection", label: "Reflection" },
              { k: "prayer", label: "Prayer" },
              { k: "questions", label: "Questions" },
            ].map(({ k, label }) => (
              <ApplySectionCard
                key={k}
                k={k}
                label={label}
                value={guidedDraft[k]}
                checked={guidedApply[k]}
                onToggle={(v) => setGuidedApply((s) => ({ ...s, [k]: v }))}
                onChange={(v) => setGuidedDraft((s) => ({ ...s, [k]: v }))}
              />
            ))}
          </div>
        </Modal>
      ) : null}

      {scanOpen ? (
        <OcrScanModal
          settings={settings}
          mood={devotional.mood}
          onClose={() => setScanOpen(false)}
          onApplyToDevotional={(patch) => onUpdate(patch)}
        />
      ) : null}
    </div>
  );
}

function PolishView({ devotional, onBackToWrite, onGoShare }) {
  return (
    <div className="space-y-6 pb-20 animate-enter">
      <Card>
        <div className="text-2xl font-black text-slate-900">Polish</div>
        <div className="text-sm text-slate-500 mt-1 font-medium">Review and refine. Then export.</div>
      </Card>

      <Card>
        <div className="space-y-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scripture</div>
          <div className="text-sm font-bold text-emerald-800">{devotional.verseRef || "—"}</div>
          <div className="text-lg whitespace-pre-wrap text-slate-800 font-serif-scripture leading-relaxed">{devotional.verseText || "—"}</div>
        </div>
      </Card>

      <Card>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reflection</div>
        <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800 leading-relaxed font-medium">{devotional.reflection || "—"}</div>
      </Card>

      {!!devotional.prayer && (
        <Card>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prayer</div>
          <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800 italic">{devotional.prayer}</div>
        </Card>
      )}

      {!!devotional.questions && (
        <Card>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions</div>
          <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{devotional.questions}</div>
        </Card>
      )}

      <div className="flex gap-2 pb-4">
        <SmallButton onClick={onBackToWrite} icon={ChevronLeft}>Edit</SmallButton>
        <div className="flex-1" />
        <SmallButton onClick={onGoShare} tone="primary" icon={Share2}>Share →</SmallButton>
      </div>
    </div>
  );
}

function LibraryView({ devotionals, onOpen, onDelete }) {
  const [q, setQ] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let results = devotionals;
    if (query) {
      results = results.filter((d) => {
        const hay = `${d.title} ${d.verseRef} ${d.reflection}`.toLowerCase();
        return hay.includes(query);
      });
    }
    return [...results].sort((a, b) => {
      const da = new Date(a.updatedAt).getTime();
      const db = new Date(b.updatedAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
  }, [q, devotionals, sortOrder]);

  return (
    <div className="space-y-5 pb-20 animate-enter">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">Library</div>
            <div className="text-sm text-slate-500 mt-0.5 font-medium">{devotionals.length} {devotionals.length === 1 ? "entry" : "entries"}</div>
          </div>
          <button
            type="button"
            onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === "newest" ? "Newest" : "Oldest"}
          </button>
        </div>
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your devotionals..."
            className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-shadow bg-slate-50 focus:bg-white focus:border-emerald-300"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-emerald-100">
            {/* Main row */}
            <button
              onClick={() => onOpen(d.id)}
              className="w-full text-left p-5 active:scale-[0.99] transition-transform"
              type="button"
            >
              <div className="font-extrabold text-slate-900 text-[15px] leading-snug">{d.title || "Untitled"}</div>
              {d.verseRef ? (
                <div className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wide">{d.verseRef}</div>
              ) : null}
              {d.reflection ? (
                <div className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{d.reflection}</div>
              ) : null}
              <div className="text-[11px] text-slate-300 mt-2 font-medium">
                {new Date(d.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </button>

            {/* Action bar */}
            <div className="border-t border-slate-100 flex">
              <button
                type="button"
                onClick={() => onOpen(d.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <div className="w-px bg-slate-100" />
              {confirmDeleteId === d.id ? (
                <div className="flex-1 flex items-center justify-center gap-2 py-3">
                  <span className="text-xs font-bold text-slate-500">Delete?</span>
                  <button
                    type="button"
                    onClick={() => { onDelete(d.id); setConfirmDeleteId(null); }}
                    className="text-xs font-extrabold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Yes
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(d.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-extrabold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-sm font-bold text-slate-400">
              {q ? "No matches found." : "No entries yet. Start one!"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AiKeyTestButton({ provider, apiKey }) {
  const [status, setStatus] = useState(null); // null | "testing" | "ok" | "fail"
  const [msg, setMsg] = useState("");

  const test = async () => {
    if (!apiKey?.trim()) { setStatus("fail"); setMsg("Enter a key first."); return; }
    setStatus("testing");
    try {
      if (provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        if (res.ok) { setStatus("ok"); setMsg("Connected ✓"); }
        else { const j = await res.json().catch(() => ({})); setStatus("fail"); setMsg(j?.error?.message || `Error ${res.status}`); }
      } else if (provider === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
        if (res.ok) { setStatus("ok"); setMsg("Connected ✓"); }
        else { const j = await res.json().catch(() => ({})); setStatus("fail"); setMsg(j?.error?.message || `Error ${res.status}`); }
      }
    } catch (e) {
      setStatus("fail"); setMsg(e?.message || "Network error");
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={() => void test()}
        disabled={status === "testing"}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {status === "testing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {status === "testing" ? "Testing..." : "Test Connection"}
      </button>
      {status === "ok" && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle className="w-3.5 h-3.5" />{msg}</span>}
      {status === "fail" && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><XCircle className="w-3.5 h-3.5" />{msg}</span>}
    </div>
  );
}

function SettingsView({ settings, onUpdate, onReset, onLogout, devotionals }) {
  const { pushToast } = useToast();
  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

  const handleExport = () => {
    try {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), entries: devotionals || [] }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `versedup-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast({ message: "Export downloaded ✓", tone: "success" });
    } catch {
      pushToast({ message: "Export failed", tone: "error" });
    }
  };

  const SectionLabel = ({ children }) => (
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{children}</div>
  );

  const FieldLabel = ({ children }) => (
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</label>
  );

  const Toggle = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <div className={cn(
        "relative w-10 h-5.5 rounded-full transition-colors",
        checked ? "bg-emerald-500" : "bg-slate-200"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )} />
      </div>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </label>
  );

  return (
    <div className="space-y-5 pb-20 animate-enter">

      {/* ── Header ── */}
      <div>
        <div className="text-2xl font-black text-slate-900">Settings</div>
        <div className="text-sm text-slate-500 mt-0.5 font-medium">Customize your experience.</div>
      </div>

      {/* ── PROFILE ── */}
      <Card>
        <SectionLabel>Profile</SectionLabel>
        <FieldLabel>Display Name</FieldLabel>
        <input
          value={settings.username || ""}
          onChange={(e) => onUpdate({ username: e.target.value })}
          placeholder="How should we greet you?"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-shadow focus:border-emerald-300"
        />
        <div className="text-[11px] text-slate-400 mt-1.5">Used in the greeting and email exports. Not synced anywhere.</div>
      </Card>

      {/* ── APPEARANCE ── */}
      <Card>
        <SectionLabel>Appearance</SectionLabel>
        <FieldLabel>Theme</FieldLabel>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onUpdate({ theme: t.id })}
              className={cn(
                "rounded-2xl py-2.5 text-xs font-bold border transition-all",
                settings.theme === t.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── WRITING ── */}
      <Card>
        <SectionLabel>Writing</SectionLabel>
        <div className="space-y-4">
          <div>
            <FieldLabel>Default Bible Version</FieldLabel>
            <select
              value={settings.defaultBibleVersion}
              onChange={(e) => onUpdate({ defaultBibleVersion: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {BIBLE_VERSIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Guided Mode</div>
                <div className="text-xs text-slate-500 mt-0.5">Show hints and suggested flows.</div>
              </div>
              <input type="checkbox" checked={Boolean(settings.guidedMode)} onChange={(e) => onUpdate({ guidedMode: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Auto-fill on Topic tap</div>
                <div className="text-xs text-slate-500 mt-0.5">Fill Title / Prayer / Questions when empty.</div>
              </div>
              <input type="checkbox" checked={Boolean(settings.autoFillEmptyOnTopicTap)} onChange={(e) => onUpdate({ autoFillEmptyOnTopicTap: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Auto-generate TikTok script</div>
                <div className="text-xs text-slate-500 mt-0.5">Default for "Draft for Me" checkbox.</div>
              </div>
              <input type="checkbox" checked={Boolean(settings.guidedAutoGenerateTikTok)} onChange={(e) => onUpdate({ guidedAutoGenerateTikTok: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Include watermark on shares</div>
                <div className="text-xs text-slate-500 mt-0.5">Adds "VersedUP" to shared posts.</div>
              </div>
              <input type="checkbox" checked={Boolean(settings.includeWatermark !== false)} onChange={(e) => onUpdate({ includeWatermark: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── AI & TOOLS ── */}
      <Card>
        <SectionLabel>AI &amp; Tools</SectionLabel>
        <div className="space-y-4">
          {aiNeedsKey && settings.aiProvider !== "mock" ? (
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs font-semibold text-amber-800">AI selected but missing key — add one below or switch to Built-in.</div>
            </div>
          ) : null}

          <div>
            <FieldLabel>AI Provider</FieldLabel>
            <select
              value={settings.aiProvider}
              onChange={(e) => onUpdate({ aiProvider: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <option value="mock">Built-in (no key needed)</option>
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="gemini">Google Gemini</option>
            </select>
            <div className="text-[11px] text-slate-400 mt-1.5">Keys are stored locally and never sent anywhere except the AI provider.</div>
          </div>

          {settings.aiProvider === "openai" ? (
            <div>
              <FieldLabel>OpenAI API Key</FieldLabel>
              <input
                value={settings.openaiKey}
                onChange={(e) => onUpdate({ openaiKey: e.target.value })}
                placeholder="sk-..."
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <AiKeyTestButton provider="openai" apiKey={settings.openaiKey} />
            </div>
          ) : null}

          {settings.aiProvider === "gemini" ? (
            <div>
              <FieldLabel>Gemini API Key</FieldLabel>
              <input
                value={settings.geminiKey}
                onChange={(e) => onUpdate({ geminiKey: e.target.value })}
                placeholder="AIza..."
                type="password"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <AiKeyTestButton provider="gemini" apiKey={settings.geminiKey} />
            </div>
          ) : null}

          <div className="border-t border-slate-100 pt-4">
            <FieldLabel>Scan / OCR Endpoint</FieldLabel>
            <input
              value={settings.ocrEndpoint || ""}
              onChange={(e) => onUpdate({ ocrEndpoint: e.target.value })}
              placeholder="https://your-vercel-app.vercel.app/api/ocr"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
            />
            <div className="text-[11px] text-slate-400 mt-1.5">Optional — best quality OCR uses Google Vision behind this endpoint.</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-700">Auto-structure after scan</div>
              <input type="checkbox" checked={Boolean(settings.ocrAutoStructure)} onChange={(e) => onUpdate({ ocrAutoStructure: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </Card>

      {/* ── DATA ── */}
      <Card>
        <SectionLabel>Data &amp; Privacy</SectionLabel>
        <div className="space-y-3">
          <div className="text-xs text-slate-500">All data lives on this device only. Nothing is sent to external servers except AI calls when you choose to use them.</div>
          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Export all entries as JSON
          </button>
          <div className="text-[11px] text-slate-400">Downloads a .json backup of all your devotionals.</div>
        </div>
      </Card>

      {/* ── DANGER ZONE ── */}
      <Card className="border-red-100">
        <SectionLabel>Danger Zone</SectionLabel>
        <div className="space-y-3">
          <button
            type="button"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-extrabold text-red-700 hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            Reset all local data
          </button>
          <div className="text-[11px] text-slate-400">This deletes all entries, settings, and streaks. Irreversible.</div>
        </div>
      </Card>

      {/* ── SESSION ── */}
      <Card className="border-slate-200">
        <div className="text-sm font-extrabold text-slate-900 mb-2">Session</div>
        <div className="text-xs text-slate-500 mb-3">Sign out is placed here to avoid accidental taps while writing.</div>
        <SmallButton onClick={onLogout} tone="danger" icon={LogOut}>Sign out</SmallButton>
      </Card>

    </div>
  );
}


/* ---------------- Compile + previews ---------------- */

function compileForPlatform(platform, d, settings) {
  const verseLine = d.verseRef ? `“${d.verseText || ""}”\n— ${d.verseRef}\n\n` : "";
  const titleLine = d.title ? `${d.title}\n\n` : "";
  const body = d.reflection || "";
  const prayer = d.prayer ? `\n\nPrayer:\n${d.prayer}` : "";
  const questions = d.questions ? `\n\nQuestions:\n${d.questions}` : "";

  if (platform === "tiktok") {
    return (
      d.tiktokScript ||
      `POV: You needed this today ✨\n\n${d.verseRef || ""}\n\n${body}\n\nSave this for later ❤️\n#Faith #Devotional`
    ).trim();
  }
  if (platform === "instagram") {
    return `${titleLine}${verseLine}${body}${questions}${prayer}\n\n#Faith #Devotional`.trim();
  }
  if (platform === "email") {
    return `Subject: ${d.verseRef || "Encouragement"}\n\nHi friend,\n\n${verseLine}${body}${prayer}\n\nBlessings,\n${settings.username || ""}`.trim();
  }
  return `${titleLine}${verseLine}${body}${questions}${prayer}`.trim();
}

function CompileView({ devotional, settings, onUpdate, onBackToWrite }) {
  const { pushToast } = useToast();
  const [platform, setPlatform] = useState("tiktok");
  const [mode, setMode] = useState("preview");
  const [text, setText] = useState("");
  const [scriptOpen, setScriptOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => {
    setText(compileForPlatform(platform, devotional, settings));
  }, [platform, devotional, settings]);

  const limit = PLATFORM_LIMITS[platform] || 999999;
  const over = text.length > limit;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Copied");
    } catch {
      pushToast("Copy failed");
    }
  };

  const shareNow = async () => {
    setShareBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: devotional.title || devotional.verseRef || "Devotional",
          text,
          url: window.location.href,
        });
      } else {
        await copy();
      }
    } catch {
      // no-op when user cancels native share
    } finally {
      setShareBusy(false);
    }
  };

  const openEmailDraft = () => {
    const subject = encodeURIComponent(devotional.title || devotional.verseRef || "Encouragement");
    const body = encodeURIComponent(text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const openTextDraft = () => {
    const body = encodeURIComponent(text);
    window.location.href = `sms:?&body=${body}`;
  };

  const shareToFacebook = async () => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Caption copied. Facebook opened.");
    } catch {
      pushToast("Facebook opened.");
    }
    const u = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank", "noopener,noreferrer");
  };

  const shareToX = () => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, "_blank", "noopener,noreferrer");
  };

  const shareToTikTok = async () => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Caption copied. TikTok upload opened.");
    } catch {
      pushToast("TikTok upload opened.");
    }
    window.open("https://www.tiktok.com/upload", "_blank", "noopener,noreferrer");
  };

  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Caption copied! Opening Instagram Create...");
    } catch {
      pushToast("Opening Instagram...");
    }
    // Try deep link on mobile, fall back to web create page
    const deepLink = "instagram://camera";
    window.location.href = deepLink;
    setTimeout(() => {
      window.open("https://www.instagram.com/create/select/", "_blank", "noopener,noreferrer");
    }, 800);
  };


  const autoShorten = async () => {
    try {
      const out = await aiRewriteLength(settings, { text, mood: devotional.mood, direction: "shorten" });
      setText(out);
    } catch (e) {
      pushToast(e?.message || "Could not shorten automatically.");
    }
  };



  return (
    <div className="space-y-6 pb-56 animate-enter">
      <div>
        <div className="text-2xl font-black text-slate-900">Share</div>
        <div className="text-sm text-slate-500 mt-1 font-medium">Choose platform, copy your content, post.</div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "tiktok", label: "TikTok" },
          { id: "instagram", label: "Instagram" },
          { id: "facebook", label: "Facebook" },
          { id: "twitter", label: "Twitter / X" },
          { id: "email", label: "Email" },
          { id: "generic", label: "Generic" },
        ].map((p) => (
          <Chip key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2">
        <Chip active={mode === "preview"} onClick={() => setMode("preview")}>
          Preview
        </Chip>
        <Chip active={mode === "text"} onClick={() => setMode("text")}>
          Text
        </Chip>
        <div className="flex-1" />
        {platform === "tiktok" ? (
          <SmallButton onClick={() => setScriptOpen(true)} icon={Wand2}>
            TikTok Script
          </SmallButton>
        ) : null}
      </div>

      {over ? (
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <div className="font-extrabold text-slate-900">Over limit for {platform}</div>
              <div className="text-sm text-slate-500">
                {text.length} / {limit}
              </div>
            </div>
            <SmallButton onClick={() => void autoShorten()}>Auto-Shorten</SmallButton>
          </div>
        </Card>
      ) : null}

      {mode === "text" ? (
        <Card>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OUTPUT</div>
          <div className="flex items-start gap-2 mt-2 mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-xs text-amber-800 font-semibold">Edits here are for formatting only — they won't change your saved entry. <button type="button" onClick={onBackToWrite} className="underline font-bold hover:text-amber-900 transition-colors">Edit entry instead →</button></span>
          </div>
          <div className="text-sm text-slate-500 mb-1">Tap <b>Copy</b> then open your app — or tap <b>Open in {platform}</b> below. Limit: {limit} chars.</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none shadow-inner bg-slate-50"
          />
          <div className={cn("mt-2 text-xs font-bold", over ? "text-red-600" : "text-slate-500")}>
            {text.length} / {limit}
          </div>
        </Card>
      ) : (
        <SocialPreview platform={platform} devotional={devotional} settings={settings} text={text} />
      )}

      <div className="fixed left-0 right-0 bottom-24 z-30 pointer-events-none">
        <div className="max-w-md mx-auto px-4 pointer-events-auto">
          <div className="rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl p-3 shadow-2xl">
            {/* Row 1: primary actions */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <SmallButton onClick={copy} icon={Copy} tone="neutral">Copy</SmallButton>
              <SmallButton onClick={() => void shareNow()} icon={ICONS.actions.shareNow} disabled={shareBusy} tone="primary">
                {shareBusy ? "Sharing..." : "Share Now"}
              </SmallButton>
            </div>
            {/* Row 2: context-aware open — matches the platform chip selected above */}
            {(platform === "tiktok" || platform === "instagram" || platform === "facebook" || platform === "twitter") ? (
              <div className="mt-2">
                <SmallButton
                  onClick={() => {
                    if (platform === "tiktok") void shareToTikTok();
                    else if (platform === "instagram") void shareToInstagram();
                    else if (platform === "facebook") void shareToFacebook();
                    else if (platform === "twitter") shareToX();
                    else copy();
                  }}
                  className="w-full justify-center"
                  tone="neutral"
                >
                  Open in {platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : platform === "facebook" ? "Facebook" : platform === "twitter" ? "Twitter / X" : "App"} →
                </SmallButton>
              </div>
            ) : null}
            {/* Row 3: other channels */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <SmallButton onClick={openEmailDraft}>Email Draft</SmallButton>
              <SmallButton onClick={openTextDraft}>Text Draft</SmallButton>
            </div>
          </div>
        </div>
      </div>

      {scriptOpen ? <TikTokScriptModal devotional={devotional} settings={settings} onClose={() => setScriptOpen(false)} onUpdate={onUpdate} /> : null}

      {exportOpen ? <TikTokExportModal devotional={devotional} settings={settings} onClose={() => setExportOpen(false)} /> : null}
    </div>
  );
}

const PREVIEW_PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-purple-500 to-pink-500" },
  { id: "tiktok", label: "TikTok", color: "from-black to-slate-800" },
  { id: "twitter", label: "Twitter / X", color: "from-sky-500 to-blue-600" },
  { id: "facebook", label: "Facebook", color: "from-blue-600 to-blue-700" },
  { id: "email", label: "Email", color: "from-slate-500 to-slate-700" },
  { id: "generic", label: "Generic", color: "from-emerald-500 to-teal-600" },
];

function DraftPreviewModal({ devotional, settings, onClose, onShare, compileForPlatform }) {
  const [platform, setPlatform] = useState("instagram");
  const text = compileForPlatform(platform, devotional, settings);
  const charCount = text.length;
  const limit = PLATFORM_LIMITS[platform] || PLATFORM_LIMITS.generic;
  const over = charCount > limit;
  const pct = Math.min(charCount / limit, 1);
  const platformInfo = PREVIEW_PLATFORMS.find(p => p.id === platform);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex flex-col flex-1 mx-auto w-full max-w-lg mt-6 mb-0 rounded-t-3xl bg-slate-50 overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200 bg-white">
          <div className="font-extrabold text-slate-900 text-base">Draft Preview</div>
          <div className="flex items-center gap-3">
            <div className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${over ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {charCount} / {limit}
            </div>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-slate-100">
          {PREVIEW_PLATFORMS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                platform === p.id
                  ? `bg-gradient-to-r ${p.color} text-white shadow-sm`
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Preview area — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Platform header accent */}
          <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${platformInfo?.color}`} />

          {platform === "instagram" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-sm" />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{settings.username || "yourprofile"}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">Instagram</div>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-slate-800 leading-relaxed font-serif-scripture whitespace-pre-wrap">{text}</p>
              </div>
              <div className="px-4 pb-4 flex gap-4 text-slate-400 text-lg">❤️ 💬 📤 🔖</div>
            </div>
          )}

          {platform === "tiktok" && (
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-b from-black to-slate-900 p-5 min-h-[260px] flex flex-col justify-end relative">
                <div className="absolute top-4 right-4 flex flex-col gap-4 items-center text-white text-xl">❤️<br/>💬<br/>🔖<br/>▶️</div>
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap font-semibold drop-shadow">{text}</p>
                <div className="mt-3 text-xs text-white/70 font-bold">{settings.username || "@yourname"}</div>
              </div>
            </div>
          )}

          {platform === "twitter" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shrink-0 shadow-sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{settings.username || "You"}</span>
                    <span className="text-xs text-slate-400">· now</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{text}</p>
                  <div className="mt-3 flex gap-5 text-slate-400 text-xs">💬 Repost ❤️ Share</div>
                </div>
              </div>
            </div>
          )}

          {platform === "facebook" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm" />
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{settings.username || "Your Page"}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">Just now · 🌐</div>
                </div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{text}</p>
              </div>
              <div className="px-4 pb-3 flex gap-4 text-slate-500 text-sm border-t border-slate-100 pt-3">👍 Like · 💬 Comment · ↗️ Share</div>
            </div>
          )}

          {platform === "email" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">EMAIL</div>
                <div className="text-xs font-extrabold text-slate-700">To: {settings.username || "subscriber@email.com"}</div>
                <div className="text-xs text-slate-500 mt-0.5">Subject: {devotional.title || "Daily Devotional"}</div>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-serif-scripture">{text}</p>
              </div>
            </div>
          )}

          {platform === "generic" && (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Post Copy</div>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-serif-scripture">{text}</p>
              </div>
            </div>
          )}

          {/* Char bar */}
          <div className="space-y-1.5">
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 0.85 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            {over && <div className="text-xs font-bold text-red-600">{charCount - limit} characters over limit — consider shortening.</div>}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-sm hover:bg-slate-200 transition-colors">
            ← Back to Edit
          </button>
          <button type="button" onClick={onShare} className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Share2 className="w-4 h-4" /> Share →
          </button>
        </div>
      </div>
    </div>
  );
}

function SocialPreview({ platform, devotional, settings, text }) {
  if (platform === "instagram") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 bg-slate-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500" />
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">{settings.username || "yourprofile"}</div>
            <div className="text-xs text-slate-500">Instagram</div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed font-serif-scripture">{text}</div>
        </div>
      </div>
    );
  }

  if (platform === "email") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">EMAIL PREVIEW</div>
          <div className="text-sm font-extrabold text-slate-900 mt-1">To: {settings.username || "you@example.com"}</div>
        </div>
        <div className="p-4">
          <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed font-serif-scripture">{text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
        <div>
          <div className="text-sm font-extrabold text-slate-900">TikTok Preview</div>
          <div className="text-xs text-slate-500">Hook + short lines + CTA</div>
        </div>
        <div className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">{devotional.mood ? `Mood: ${devotional.mood}` : "No mood"}</div>
      </div>

      <div className="p-4">
        <div className="rounded-3xl bg-gradient-to-b from-black/5 to-black/0 p-5 border border-slate-200">
          <div className="text-sm whitespace-pre-wrap text-slate-900 leading-relaxed">{text}</div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>{settings.username || "@yourname"}</span>
            <span>❤️  •  💬  •  🔖</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TikTokScriptModal({ devotional, settings, onClose, onUpdate }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [script, setScript] = useState(devotional.tiktokScript || "");
  const [saveBack, setSaveBack] = useState(false);

  const count = script.length;
  const limit = PLATFORM_LIMITS.tiktok;

  const generate = async (mode) => {
    setBusy(true);
    try {
      const out = await aiTikTokScript(settings, {
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        reflection: devotional.reflection,
        mood: devotional.mood,
        baseScript: script,
        mode,
      });
      setScript(out);
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setBusy(false);
    }
  };

  const shorten = async () => {
    setBusy(true);
    try {
      const out = await aiRewriteLength(settings, { text: script, mood: devotional.mood, direction: "shorten" });
      setScript(out);
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const patch = { tiktokScript: script };
    if (saveBack) patch.reflection = script;
    onUpdate(patch);
    onClose();
  };

  return (
    <Modal
      title="TikTok Script"
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={saveBack} onChange={(e) => setSaveBack(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
            Save back to reflection
          </label>
          <div className="flex-1" />
          <SmallButton onClick={onClose}>Cancel</SmallButton>
          <SmallButton onClick={save} tone="primary" disabled={count > limit}>
            Save
          </SmallButton>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <SmallButton onClick={() => void generate("regenerate")} disabled={busy} icon={RefreshCw}>
            Regenerate from devotional
          </SmallButton>
          <SmallButton onClick={() => void generate("improve")} disabled={busy} icon={Sparkles}>
            Improve this script
          </SmallButton>
          <SmallButton onClick={() => void shorten()} disabled={busy}>
            Shorten
          </SmallButton>
        </div>

        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={14}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none shadow-inner"
        />
        <div className={cn("text-xs font-bold", count > limit ? "text-red-600" : count > 2000 ? "text-amber-600" : "text-slate-500")}>
          {count} / {limit}
        </div>
        {count > limit ? <div className="text-xs font-bold text-red-600">Over TikTok limit. Shorten before saving/export.</div> : null}
      </div>
    </Modal>
  );
}

function TikTokExportModal({ devotional, settings, onClose }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const prefs = settings.exportPrefs || DEFAULT_SETTINGS.exportPrefs;
  const includeScripture = prefs.includeScripture && (devotional.verseRef || devotional.verseText);
  const includeTitle = prefs.includeTitle;
  const includeDate = prefs.includeDate;
  const includeUsername = prefs.includeUsername && settings.username;
  const includeWatermark = prefs.includeWatermark;

  const download = (dataUrl) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `tiktok-${(devotional.title || "devotional").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  const exportPng = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      // Mock usage for preview
      await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      onClose();
    } catch {
      pushToast("Export failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="TikTok Export (PNG)"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <SmallButton onClick={onClose}>Cancel</SmallButton>
          <SmallButton onClick={() => void exportPng()} tone="primary" disabled={busy}>
            {busy ? "Exporting..." : "Download PNG"}
          </SmallButton>
        </div>
      }
    >
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-slate-50">
        <div className="w-full bg-slate-50 p-3 flex justify-center">
          <div className="origin-top" style={{ transform: "scale(0.22)" }}>
            <div ref={ref} className="w-[1080px] h-[1920px] p-24 flex flex-col justify-between bg-white text-slate-900 shadow-2xl">
              <div className="space-y-10">
                {(includeTitle || includeDate) && (
                  <div className="space-y-2">
                    {includeTitle ? (
                      <div className="text-6xl font-black tracking-tight font-serif-scripture">{devotional.title || "Untitled Devotional"}</div>
                    ) : null}
                    {includeDate ? (
                      <div className="text-2xl font-semibold text-slate-600">
                        {new Date(devotional.updatedAt || devotional.createdAt).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                )}

                {includeScripture ? (
                  <div className="rounded-[3rem] border-2 border-slate-100 bg-slate-50 p-12">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-8 mb-8">
                      <div className="text-3xl font-black uppercase tracking-widest text-emerald-800">{devotional.verseRef || "Scripture"}</div>
                      <div className="text-2xl font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
                        {devotional.bibleVersion || settings.defaultBibleVersion || "KJV"}
                      </div>
                    </div>
                    {devotional.verseText ? (
                      <div className="text-4xl leading-relaxed whitespace-pre-wrap text-slate-700 font-serif-scripture italic">{devotional.verseText}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-4xl leading-relaxed whitespace-pre-wrap font-medium text-slate-800">
                  {devotional.tiktokScript || compileForPlatform("tiktok", devotional, settings)}
                </div>
              </div>

              <div className="flex items-center justify-between border-t-2 border-slate-100 pt-10">
                <div className="text-3xl font-bold text-slate-500">{includeUsername ? settings.username : ""}</div>
                <div className="text-3xl font-bold text-emerald-600">{includeWatermark ? "VersedUP" : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-3 font-medium">Tip: TikTok UI covers edges. This export uses safe margins.</div>
    </Modal>
  );
}

/* ---------------- Entry flow ---------------- */

function LandingView({ onGetStarted, onViewDemo }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 px-4 py-10 animate-enter flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white/80 backdrop-blur-xl p-10 shadow-2xl">
          <img
            src={assetUrl("logo.png")}
            alt="VersedUP"
            className="h-28 w-auto mx-auto drop-shadow-md mb-6"
            draggable="false"
            onError={(e) => {
              e.currentTarget.onerror = null;
              // Fallback to text if logo fails
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="mt-4 text-3xl font-black text-slate-900 text-center tracking-tight leading-tight">Rooted in Christ,<br/>growing in His fruit.</h1>
          <p className="mt-4 text-base text-slate-600 text-center leading-relaxed font-medium">Create devotionals, polish your reflection, and prepare share-ready content.</p>

          <div className="mt-8 grid gap-4">
            <PrimaryButton onClick={onGetStarted} icon={LogIn}>
              Get Started
            </PrimaryButton>
            <button
              onClick={onViewDemo}
              className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
              type="button"
            >
              View Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthView({ onBack, onContinue }) {
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-emerald-50 px-4 py-8 animate-enter">
      <div className="max-w-md mx-auto space-y-6">
        <button type="button" onClick={onBack} className="text-sm font-bold text-slate-600 flex items-center gap-1 hover:text-slate-900 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <Card>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AUTH</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">Sign in or continue as guest</h2>

          <div className="mt-6">
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">DISPLAY NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <PrimaryButton onClick={() => onContinue({ mode: "signed-in", name: name.trim() || "Friend" })} icon={User}>
              Sign in
            </PrimaryButton>
            <button
              type="button"
              onClick={() => onContinue({ mode: "guest", name: "Guest" })}
              className="rounded-2xl border-2 border-slate-100 bg-white px-4 py-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            <div className="font-extrabold mb-1">One key detail (so you’re not surprised)</div>
            On GitHub Pages, auth is UI + local session (secure-feeling, not bank-secure). Later, we can swap to real auth
            (Supabase/Clerk/Firebase) without changing the screens.
          </div>
        </Card>
      </div>
    </div>
  );
}

function OnboardingWizard({ authDraft, onFinish }) {
  // Demo slides: 0=Welcome, 1=Verse+Heart, 2=Write+AI, 3=Share, 4=Setup
  const [slide, setSlide] = useState(0);
  const [demoMood, setDemoMood] = useState(null);
  const [demoDrafted, setDemoDrafted] = useState(false);
  const [demoPlatform, setDemoPlatform] = useState(null);
  const [name, setName] = useState(authDraft?.name || "");
  const [version, setVersion] = useState("KJV");
  const [guidedMode, setGuidedMode] = useState(true);
  const totalSlides = 5;

  const finish = () => {
    onFinish({
      mode: authDraft?.mode || "guest",
      name: name.trim() || (authDraft?.mode === "guest" ? "Guest" : "Friend"),
      settingsPatch: {
        username: name.trim(),
        defaultBibleVersion: version,
        guidedMode,
        onboardingComplete: true,
      },
      starterMood: demoMood || "hopeful",
    });
  };

  const DEMO_MOODS = [
    { id: "peaceful", label: "😌 Peaceful" },
    { id: "grateful", label: "🙏 Grateful" },
    { id: "hopeful", label: "💪 Hopeful" },
    { id: "inspired", label: "✨ Inspired" },
  ];

  const DEMO_PLATFORMS = [
    { id: "instagram", label: "Instagram", color: "from-purple-500 to-pink-500", emoji: "📸" },
    { id: "tiktok", label: "TikTok", color: "from-black to-slate-700", emoji: "🎵" },
    { id: "twitter", label: "Twitter / X", color: "from-sky-400 to-blue-500", emoji: "🐦" },
    { id: "facebook", label: "Facebook", color: "from-blue-600 to-blue-700", emoji: "👥" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-sky-50 to-white px-4 py-8 animate-enter">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-300 rounded-full ${
                i === slide ? "w-6 h-2 bg-emerald-500" : i < slide ? "w-2 h-2 bg-emerald-300" : "w-2 h-2 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* ── SLIDE 0: Welcome ── */}
        {slide === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-enter space-y-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-200">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">VersedUP</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">Write. Reflect. Share.</div>
            </div>
            <div className="text-base text-slate-500 font-medium max-w-xs leading-relaxed">
              A spiritual companion for capturing God's word, writing your heart, and sharing your faith — in one flowing motion.
            </div>
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={() => setSlide(1)}
                className="w-full rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-base py-4 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99]"
              >
                See how it works →
              </button>
              <button
                type="button"
                onClick={() => setSlide(4)}
                className="mt-3 w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip intro
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 1: Verse + Heart demo ── */}
        {slide === 1 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 1 of 3</div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Capture your verse & heart</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Start with the scripture that's speaking to you. Then pick where your heart is today.</p>
            </div>

            {/* Mini verse card demo */}
            <div className="rounded-[1.75rem] border-2 border-emerald-100 bg-white p-5 shadow-sm space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TODAY'S VERSE</div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                <div className="text-xs font-bold text-emerald-700 flex-1">John 3:16</div>
                <div className="text-[10px] font-extrabold text-emerald-500 bg-emerald-100 rounded-lg px-2 py-1">Load Verse ↓</div>
              </div>
              <div className="text-xs text-slate-600 font-serif leading-relaxed px-1 italic">
                "For God so loved the world, that he gave his only begotten Son…"
              </div>
            </div>

            {/* Interactive mood picker */}
            <div className="rounded-[1.75rem] border-2 border-slate-100 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">WHERE IS YOUR HEART? <span className="text-emerald-500 normal-case font-bold ml-1">← tap one</span></div>
              <div className="flex flex-wrap gap-2">
                {DEMO_MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDemoMood(m.id)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-extrabold transition-all ${
                      demoMood === m.id
                        ? "bg-emerald-500 border-emerald-500 text-white scale-105 shadow-md shadow-emerald-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {demoMood ? (
                <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1 animate-enter">
                  <CheckCircle className="w-3.5 h-3.5" /> Perfect. Your heart is set.
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSlide(0)} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button type="button" onClick={() => setSlide(2)} className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3 shadow-md hover:shadow-lg transition-all">
                Next →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 2: Write + AI demo ── */}
        {slide === 2 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 2 of 3</div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Write with AI at your side</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Reflect freely, or let AI draft a caption in any tone. You can Fix, Shorten, or Expand instantly.</p>
            </div>

            {/* Mini write card demo */}
            <div className="rounded-[1.75rem] border-2 border-slate-100 bg-white p-5 shadow-sm space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YOUR REFLECTION</div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 min-h-[72px] text-xs text-slate-600 leading-relaxed font-medium">
                {demoDrafted
                  ? '"God\'s love isn\'t a reward — it\'s a gift. Today I\'m reminded that I don\'t have to earn what\'s already been freely given. 🙏 #Faith #John316"'
                  : <span className="text-slate-400 italic">Your reflection will appear here…</span>
                }
              </div>
              {/* AI toolbar strip */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDemoDrafted(true)}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                    demoDrafted ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {demoDrafted ? "Drafted ✓" : "✨ Draft for Me"}
                </button>
                {["Fix", "Shorten", "Expand"].map((t) => (
                  <button key={t} type="button" className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">{t}</button>
                ))}
              </div>
              {demoDrafted ? (
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-enter">
                  <CheckCircle className="w-3.5 h-3.5" /> Caption drafted in Poetic tone. Edit or post as-is.
                </div>
              ) : <div className="text-[11px] text-slate-400 font-medium">← Tap Draft for Me to see AI in action</div>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSlide(1)} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button type="button" onClick={() => setSlide(3)} className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3 shadow-md hover:shadow-lg transition-all">
                Next →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 3: Share demo ── */}
        {slide === 3 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 3 of 3</div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">Share to any platform</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Format your post for Instagram, TikTok, Twitter, or Facebook. One tap copies the optimized caption.</p>
            </div>

            {/* Platform picker demo */}
            <div className="rounded-[1.75rem] border-2 border-slate-100 bg-white p-5 shadow-sm space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CHOOSE A PLATFORM <span className="text-emerald-500 normal-case font-bold ml-1">← tap one</span></div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDemoPlatform(p.id)}
                    className={`rounded-2xl px-3 py-3 text-sm font-extrabold text-left transition-all flex items-center gap-2 ${
                      demoPlatform === p.id
                        ? `bg-gradient-to-r ${p.color} text-white shadow-lg scale-[1.02]`
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-lg">{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
              {demoPlatform ? (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 animate-enter">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PREVIEW — {demoPlatform.toUpperCase()}</div>
                  <div className="text-xs text-slate-700 leading-relaxed font-medium">
                    "God's love isn't a reward — it's a gift. Today I'm reminded that I don't have to earn what's already been freely given. 🙏 #Faith #John316"
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`text-[10px] font-bold ${demoPlatform === "twitter" ? "text-amber-600" : "text-emerald-600"}`}>
                      {demoPlatform === "instagram" ? "142 / 2,200 chars ✓" : demoPlatform === "tiktok" ? "142 / 2,200 chars ✓" : demoPlatform === "twitter" ? "142 / 280 chars ✓" : "142 / 63,206 chars ✓"}
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1">Copy & Open →</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSlide(2)} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              <button type="button" onClick={() => setSlide(4)} className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3 shadow-md hover:shadow-lg transition-all">
                Let's set you up →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 4: Setup ── */}
        {slide === 4 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Quick Setup</div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">One last thing</h2>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">Personalize your experience. You can change these any time in Settings.</p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">YOUR NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50 focus:bg-white focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEFAULT BIBLE VERSION</label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base font-extrabold bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white focus:border-emerald-300 transition-all"
                >
                  {BIBLE_VERSIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Guided writing hints</div>
                  <div className="text-xs text-slate-500 mt-0.5">Structure prompts and helper text while you write.</div>
                </div>
                <input type="checkbox" checked={guidedMode} onChange={(e) => setGuidedMode(e.target.checked)} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              {slide > 0 ? (
                <button type="button" onClick={() => setSlide(3)} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft className="w-4 h-4" /> Back</button>
              ) : <div />}
              <button
                type="button"
                onClick={finish}
                className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-base py-4 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99]"
              >
                🙏 Start Writing
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}


/* ---------------- App shell ---------------- */

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl transition-all duration-200 relative",
        active ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
      )}
      type="button"
      title={label}
    >
      <Icon className="w-5 h-5 transition-all duration-200" strokeWidth={active ? 2.5 : 2} />
      <span className={cn("text-[10px] font-bold leading-none transition-all", active ? "text-emerald-700" : "text-slate-400")}>{label}</span>
      {active && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
    </button>
  );
}

function AppInner({ session, starterMood, onLogout }) {
  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    const parsed = safeParseJson(raw, DEFAULT_SETTINGS);
    const next = parsed && typeof parsed === "object" ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
    if (!THEME_STYLES[next.theme]) next.theme = "light";
    return next;
  });

  const [devotionals, setDevotionals] = useState(() => {
    const raw = localStorage.getItem(STORAGE_DEVOTIONALS);
    const parsed = safeParseJson(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  });

  const [streak, setStreak] = useState(() => loadStreak());
  const [activeId, setActiveId] = useState(() => (Array.isArray(devotionals) && devotionals[0] ? devotionals[0].id : ""));
  const [view, setView] = useState("home");
  const [lastNonSettingsView, setLastNonSettingsView] = useState("home");
 // home | write | polish | compile | library | settings

  useEffect(() => {
    if (view !== "settings") setLastNonSettingsView(view);
  }, [view]);

  const toggleSettings = () => {
    setView((v) => (v === "settings" ? (lastNonSettingsView || "home") : "settings"));
  };

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const pushToast = (message, durationMs = 2800) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    const next = { id: crypto.randomUUID(), message: String(message || "") };
    setToast(next);
    toastTimerRef.current = window.setTimeout(() => setToast(null), durationMs);
  };


  const safeDevotionals = Array.isArray(devotionals) ? devotionals : [];
  const active = useMemo(() => safeDevotionals.find((d) => d.id === activeId) || null, [safeDevotionals, activeId]);
  const greetingName = (settings.username || session?.name || "Friend").replace(/^@/, "");

  useEffect(() => {
    if (!starterMood) return;
    if (safeDevotionals.length > 0) return;
    const d = createDevotional(settings);
    d.mood = starterMood;
    d.title = `A ${starterMood} start with Jesus`;
    d.reflection = "I can begin from this mood, but I don’t have to stay here alone. Jesus meets me here.";
    setDevotionals([d]);
    setActiveId(d.id);
  }, [starterMood, safeDevotionals.length]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DEVOTIONALS, JSON.stringify(safeDevotionals));
  }, [safeDevotionals]);

  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const updateDevotional = (patch) => {
    if (!active) return;
    setDevotionals((list) =>
      (Array.isArray(list) ? list : []).map((d) => (d.id === active.id ? { ...d, ...patch, updatedAt: nowIso() } : d))
    );
  };

  const newEntry = () => {
    const d = createDevotional(settings);
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const reflectVerseOfDay = () => {
    const d = createDevotional(settings);
    d.verseRef = VERSE_OF_DAY.verseRef;
    d.verseText = VERSE_OF_DAY.verseText;
    d.title = VERSE_OF_DAY.suggestedTitle;
    d.reflection = `Today I reflect on ${VERSE_OF_DAY.verseRef}. Lord, help me trust Your shepherding in every step.`;
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const openEntry = (id) => {
    setActiveId(id);
    setView("write");
  };

  const deleteEntry = (id) => {
    setDevotionals((list) => (Array.isArray(list) ? list : []).filter((d) => d.id !== id));
    if (activeId === id) {
      setActiveId("");
      setView("home");
    }
  };

  const reset = () => {
    if (!confirm("Reset local data?")) return;
    localStorage.removeItem(STORAGE_SETTINGS);
    localStorage.removeItem(STORAGE_DEVOTIONALS);
    localStorage.removeItem(STORAGE_STREAK);
    setSettings(DEFAULT_SETTINGS);
    setDevotionals([]);
    setStreak({ count: 0, lastDay: "" });
    setActiveId("");
    setView("home");
  };

  
const onSaved = () => {
  const before = streak;
  const next = bumpStreakOnSave();
  setStreak(next);
  const changed = before?.lastDay !== next?.lastDay;
  pushToast(changed ? `Saved • 🔥 Streak: ${next.count} days` : "Saved");
};

  return (
    <ToastContext.Provider value={{ pushToast }}>
      <GlobalStyles />
      <div className={cn("min-h-screen bg-gradient-to-b selection:bg-emerald-100", THEME_STYLES[settings.theme] || THEME_STYLES.light || THEME_STYLES.light)}>
        <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>
      <ToastTicker toast={toast} />

      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3.5 transition-all duration-300">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <img
            src={assetUrl("logo.png")}
            alt="VersedUP"
            className="h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
            draggable="false"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="min-w-0 leading-tight flex-1">
            <div className="text-[15px] font-extrabold text-slate-900 tracking-tight">Rooted in Christ</div>
            <div className="text-[12px] font-bold text-slate-500 truncate mt-0.5">{getTimeGreeting(getDisplayName(session, settings))}</div>
          </div>
<button
            type="button"
            onClick={toggleSettings}
            className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
            aria-label="Settings"
            title="Settings"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-8 relative z-10">
        <PageTransition key={view}>
        {view === "home" ? (
          <HomeView
            onNew={newEntry}
            onLibrary={() => setView("library")}
            onContinue={() => setView(active ? "write" : "home")}
            onReflectVerseOfDay={reflectVerseOfDay}
            hasActive={Boolean(active)}
            streak={streak}
            displayName={getDisplayName(session, settings)}
            devotionals={safeDevotionals}
            onOpen={openEntry}
          />
        ) : null}

        {view === "write" && active ? (
          <WriteView
            devotional={active}
            settings={settings}
            onUpdate={updateDevotional}
            onGoCompile={() => setView("compile")}
            onGoPolish={() => setView("polish")}
            onSaved={onSaved}
            onGoSettings={() => setView("settings")}
          />
        ) : null}

        {view === "polish" && active ? <PolishView devotional={active} onBackToWrite={() => setView("write")} onGoShare={() => setView("compile")} /> : null}

        {view === "compile" && active ? <CompileView devotional={active} settings={settings} onUpdate={updateDevotional} onBackToWrite={() => setView("write")} /> : null}

        {view === "library" ? <LibraryView devotionals={safeDevotionals} onOpen={openEntry} onDelete={deleteEntry} /> : null}

        {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} onReset={reset} onLogout={onLogout} devotionals={safeDevotionals} /> : null}
        </PageTransition>
      </main>

      {/* ── Bottom Nav Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto px-3 pb-safe">
          <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] px-2 pt-1 pb-2">
            <div className="grid grid-cols-5 items-end">
              <NavButton active={view === "home"} onClick={() => setView("home")} icon={ICONS.nav.home} label="Home" />
              <NavButton active={view === "polish"} onClick={() => { if (active) setView("polish"); else setView("library"); }} icon={ICONS.nav.review} label="Polish" />

              {/* Centre New-Entry button */}
              <div className="flex flex-col items-center justify-center pb-0.5">
                <button
                  onClick={newEntry}
                  type="button"
                  className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 active:scale-95 transition-all duration-200 group -mt-4 border-2 border-white"
                  title="New Entry"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>

              </div>

              <NavButton active={view === "compile"} onClick={() => setView(active ? "compile" : "home")} icon={ICONS.nav.compile} label="Share" />
              <NavButton active={view === "library"} onClick={() => setView("library")} icon={Library} label="Library" />
            </div>
          </div>
        </div>
      </div>
    </div>
    </ToastContext.Provider>
  );
}

export default function App() {
  const [stage, setStage] = useState(() => (loadSession() ? "app" : "landing"));
  const [authDraft, setAuthDraft] = useState(null);
  const [session, setSession] = useState(() => loadSession());
  const [starterMood, setStarterMood] = useState("");

  const startDemo = () => {
    const draft = { mode: "guest", name: "Guest" };
    setAuthDraft(draft);
    const existing = safeParseJson(localStorage.getItem(STORAGE_SETTINGS), {});
    const patched = { ...DEFAULT_SETTINGS, ...(existing || {}), onboardingComplete: true, username: "Guest" };
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(patched));
    const nextSession = { id: crypto.randomUUID(), mode: "guest", name: "Guest", createdAt: nowIso() };
    persistSession(nextSession);
    setSession(nextSession);
    setStarterMood("hopeful");
    setStage("app");
  };

  const handleAuthContinue = (draft) => {
    setAuthDraft(draft);
    setStage("onboarding");
  };

  const handleFinishOnboarding = ({ mode, name, settingsPatch, starterMood: mood }) => {
    const existing = safeParseJson(localStorage.getItem(STORAGE_SETTINGS), {});
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...(existing || {}), ...settingsPatch }));
    const nextSession = { id: crypto.randomUUID(), mode, name, createdAt: nowIso() };
    persistSession(nextSession);
    setSession(nextSession);
    setStarterMood(mood || "");
    setStage("app");
  };

  const logout = () => {
    persistSession(null);
    setSession(null);
    setAuthDraft(null);
    setStarterMood("");
    setStage("landing");
  };

  return (
    <ErrorBoundary>
      {stage === "landing" ? <LandingView onGetStarted={() => setStage("auth")} onViewDemo={startDemo} /> : null}
      {stage === "auth" ? <AuthView onBack={() => setStage("landing")} onContinue={handleAuthContinue} /> : null}
      {stage === "onboarding" ? <OnboardingWizard authDraft={authDraft} onFinish={handleFinishOnboarding} /> : null}
      {stage === "app" ? <AppInner session={session} starterMood={starterMood} onLogout={logout} /> : null}
    </ErrorBoundary>
  );
}

