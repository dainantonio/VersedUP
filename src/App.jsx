import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
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
  ScanLine,
  Flame,
  ArrowRight,
  Quote
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
    compile: Share2,             // fixed: was ScanLine (OCR)
  }),
});
const ToastContext = React.createContext({ pushToast: () => {} });

function useToast() {
  return React.useContext(ToastContext);
}

function ToastTicker({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 left-0 right-0 z-[60] pointer-events-none flex justify-center">
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
  { id: "light", label: "Light" },
]);

const THEME_STYLES = Object.freeze({
  light: "from-emerald-50/60 via-slate-50 to-sky-50",
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

function youVersionSearchUrl(passage) {
  const q = encodeURIComponent(String(passage || "").trim());
  return `https://www.bible.com/search/bible?q=${q}`;
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

function HomeView({ onNew, onLibrary, onContinue, onReflectVerseOfDay, hasActive, streak, displayName }) {
  const { pushToast } = useToast();
  const [moodVerseKey, setMoodVerseKey] = useState("joy");
  const moodVerse = MOOD_VERSES[moodVerseKey] || MOOD_VERSES.joy;

  const handleSelectMoodVerse = (key) => {
    setMoodVerseKey(key);
    const label = (MOOD_VERSES[key] || {}).label || "Verse";
    pushToast(`${label} verse ready.`);
  };

  return (
    <div className="space-y-6 pb-28 animate-enter">
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="text-4xl font-black text-slate-900 mt-1 tracking-tight">{getTimeGreeting(displayName)}</div>
        <div className="text-sm text-slate-600 mt-2 font-medium">{hasActive ? "Continue your last entry below." : "Start a devotional or pick a verse to reflect."}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-hidden relative group transition-all hover:shadow-md hover:border-emerald-100">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-sky-50/30 pointer-events-none transition-colors" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">CURRENT STREAK</div>
              <div className="text-5xl font-black text-slate-900 mt-2 flex items-baseline">
                {streak.count} 
                <div className="relative ml-2 w-8 h-8">
                  <Flame className="w-8 h-8 text-orange-500 drop-shadow-sm animate-pulse-slow absolute inset-0" fill="currentColor" />
                  <Flame className="w-8 h-8 text-yellow-400 absolute inset-0 mix-blend-overlay animate-pulse" fill="currentColor" />
                </div>
                <span className="text-slate-400 text-lg font-bold ml-1">days</span>
              </div>
              <div className="text-xs text-slate-500 mt-2 font-medium">Keep showing up — God meets you here.</div>
            </div>
            
            <div className="flex flex-col gap-2">
            <button
              onClick={hasActive ? onContinue : onNew}
              className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-extrabold shadow-xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              type="button"
            >
              {hasActive ? "Continue" : "Check In"} <ArrowRight className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>

        <button
          onClick={onNew}
          className="bg-white rounded-[1.5rem] border border-slate-200 p-5 text-left hover:bg-slate-50 transition-all active:scale-[0.98] hover:shadow-sm group hover:border-emerald-100"
          type="button"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
             <PenTool className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="font-extrabold text-slate-900 text-lg">New Entry</div>
          <div className="text-xs text-slate-500 mt-1">Start fresh</div>
        </button>

        <button
          onClick={onLibrary}
          className="bg-white rounded-[1.5rem] border border-slate-200 p-5 text-left hover:bg-slate-50 transition-all active:scale-[0.98] hover:shadow-sm group hover:border-sky-100"
          type="button"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
             <Library className="w-6 h-6 text-sky-700" />
          </div>
          <div className="font-extrabold text-slate-900 text-lg">Library</div>
          <div className="text-xs text-slate-500 mt-1">View archive</div>
        </button>
      </div>

      <Card className="overflow-hidden border-emerald-100 bg-emerald-50/30">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Verse of the Day
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Daily</div>
        </div>
        <div className="mt-4 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[1.5rem] p-8 text-white shadow-lg relative overflow-hidden group">
            {/* Texture */}
            <Quote className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" fill="currentColor" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
          <div className="text-2xl leading-relaxed font-serif-scripture relative z-10 font-medium">{`“${VERSE_OF_DAY.verseText}”`}</div>
          <div className="mt-6 text-xs font-black tracking-widest opacity-80 relative z-10">{VERSE_OF_DAY.verseRef.toUpperCase()}</div>
          <button
            onClick={onReflectVerseOfDay}
            className="mt-6 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-md active:scale-[0.985] transition-all flex items-center gap-2 border border-white/10"
            type="button"
          >
            Reflect on this <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Pick a Verse</div>
          <div className="text-xs font-bold text-slate-500">By theme</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {MOOD_VERSE_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectMoodVerse(key)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-[0.95]",
                moodVerseKey === key
                  ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              {MOOD_VERSES[key].label}
            </button>
          ))}
        </div>

        <div className="mt-5 bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
          <div className="text-xl leading-relaxed font-serif-scripture opacity-90">{`“${moodVerse.verseText}”`}</div>
          <div className="mt-4 text-xs font-extrabold tracking-wider opacity-70">{moodVerse.verseRef.toUpperCase()}</div>
        </div>
      </Card>

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
        window.open(youVersionSearchUrl(devotional.verseRef), "_blank", "noopener,noreferrer");
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
      const go = confirm("OCR is not connected yet. Go to Settings to paste your Vercel OCR URL?");
      if (go) onGoSettings();
      return;
    }
    setScanOpen(true);
  };

  const hasVerseRef = Boolean(String(devotional.verseRef || "").trim());
  const hasVerseText = Boolean(String(devotional.verseText || "").trim());
  const hasReflection = Boolean(String(devotional.reflection || "").trim());

  return (
    <div className="space-y-5 pb-28 animate-enter">
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

      {/* ── Write / Preview tab bar (HubSpot-inspired) ── */}
      <div className="flex border-b border-slate-200">
        {[{ id: "write", label: "Write" }, { id: "preview", label: "Preview" }].map((t) => (
          <button
            key={t.id}
            onClick={() => setWriteTab(t.id)}
            className={cn(
              "px-5 py-2.5 text-sm font-extrabold border-b-2 -mb-px transition-colors",
              writeTab === t.id
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PREVIEW TAB ── */}
      {writeTab === "preview" ? (
        <div className="space-y-4 animate-enter">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "instagram", label: "Instagram" },
              { id: "tiktok", label: "TikTok" },
              { id: "facebook", label: "Facebook" },
              { id: "twitter", label: "Twitter / X" },
              { id: "email", label: "Email" },
              { id: "generic", label: "Generic" },
            ].map((p) => (
              <Chip key={p.id} active={pvPlatform === p.id} onClick={() => setPvPlatform(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <SocialPreview
            platform={pvPlatform}
            devotional={devotional}
            settings={settings}
            text={compileForPlatform(pvPlatform, devotional, settings)}
          />
          <div className="flex gap-2 justify-end">
            <SmallButton onClick={() => { handleSave(); onGoCompile(); }} icon={Share2} tone="primary">
              Share →
            </SmallButton>
          </div>
        </div>
      ) : null}

      {/* ── WRITE TAB ── */}
      {writeTab === "write" ? (
      <div className="space-y-5">

      <Card className="overflow-hidden bg-white/60">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HOW IS YOUR HEART?</div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
        {guidedMode ? <div className="mt-3 text-xs text-slate-500">Guided Mode: mood gently affects AI tone.</div> : null}
      </Card>

      <Card>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" /> VERSE
              </div>
              <div className="flex gap-2">
                <SmallButton onClick={openScan} icon={ScanLine}>
                  Scan
                </SmallButton>
                <SmallButton
                  onClick={() => window.open(youVersionSearchUrl(devotional.verseRef), "_blank", "noopener,noreferrer")}
                  disabled={!hasVerseRef}
                >
                  Open YouVersion
                </SmallButton>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={devotional.verseRef}
                  onChange={(e) => onUpdate({ verseRef: e.target.value })}
                  placeholder="Verse reference (e.g., Psalm 23)"
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

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERSE TEXT</label>
              <textarea
                value={devotional.verseText}
                onChange={(e) => onUpdate({ verseText: e.target.value, verseTextEdited: true })}
                placeholder={
                  isKjv(version)
                    ? "Fetch KJV to auto-fill..."
                    : "Free-for-now: Open in YouVersion. Paste text you have rights to use."
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:ring-4 focus:ring-emerald-100 bg-white resize-none font-serif-scripture shadow-sm focus:border-emerald-300 transition-all"
              />
              {guidedMode && !hasVerseText && hasVerseRef ? (
                <div className="mt-2 text-[11px] font-bold text-slate-500">
                  Tip: Tap <span className="font-extrabold">Load Verse</span> to fill KJV automatically (or use YouVersion).
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
              {guidedMode ? <div className="text-[11px] font-bold text-emerald-600">Type your verse, then tap Draft for Me</div> : null}
            </div>

            <div className="mt-2 flex justify-end">
              <SmallButton
                onClick={() => void (aiNeedsKey ? openGuidedDraftFromTemplate() : openGuidedDraftFromAI())}
                disabled={guidedBusy}
                icon={guidedBusy ? Loader2 : Sparkles}
              >
                {guidedBusy ? "Drafting..." : "Draft for Me"}
              </SmallButton>
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
              {/* Row 2: Make Share-Ready — full-width primary action */}
              <div className="border-t border-slate-100 p-1.5">
                <button
                  onClick={() => void doShareReady()}
                  disabled={shareReadyBusy || busy || (!hasReflection && !hasVerseRef)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] px-4 py-2.5 text-sm font-extrabold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {shareReadyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {shareReadyBusy ? "Making Share-Ready..." : "✨ Make Share-Ready"}
                </button>
                {shareReadyStep ? <div className="mt-1.5 text-[11px] font-bold text-emerald-700 text-center">{shareReadyStep}</div> : null}
              </div>
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

      {/* ── Bottom actions: clear hierarchy ── */}
      <div className="rounded-2xl border border-slate-100 bg-white/60 p-3 flex items-center gap-2 shadow-sm">
        <SmallButton
          onClick={handleSave}
          icon={saveSuccess ? Check : null}
          disabled={saveSuccess}
        >
          {saveSuccess ? "Saved ✓" : "Save"}
        </SmallButton>
        <SmallButton
          onClick={() => setWriteTab("preview")}
          icon={BookOpen}
        >
          Preview
        </SmallButton>
        <div className="flex-1" />
        <SmallButton
          onClick={() => { handleSave(); onGoCompile(); }}
          icon={ICONS.actions.compileForSocials}
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
    <div className="space-y-6 pb-28 animate-enter">
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
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return devotionals;
    return devotionals.filter((d) => {
      const hay = `${d.title} ${d.verseRef} ${d.reflection}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, devotionals]);

  return (
    <div className="space-y-6 pb-28 animate-enter">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-slate-900">Library</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">Your saved devotionals.</div>
          </div>
        </div>
        <div className="mt-5 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your history..."
            className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-shadow bg-slate-50 focus:bg-white focus:border-emerald-300"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md active:scale-[0.99] hover:border-emerald-100">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onOpen(d.id)} className="text-left flex-1" type="button">
                <div className="font-extrabold text-slate-900 text-lg">{d.title || "Untitled"}</div>
                <div className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wide">{d.verseRef || "No scripture"}</div>
                <div className="text-xs text-slate-400 mt-2 font-medium">{new Date(d.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </button>
              <SmallButton tone="danger" onClick={() => onDelete(d.id)} icon={Trash2}>
                Delete
              </SmallButton>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <Card className="bg-transparent border-dashed flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-sm font-bold text-slate-400">No entries yet. Start one!</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SettingsView({ settings, onUpdate, onReset, onLogout }) {
  const { pushToast } = useToast();
  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

return (
    <div className="space-y-6 pb-28 animate-enter">
      <Card>
        <div className="text-2xl font-black text-slate-900">Settings</div>
        <div className="text-sm text-slate-500 mt-1 font-medium">AI keys, defaults, OCR, guidance.</div>
      </Card>

      <Card className="border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Guided Mode</div>
            <div className="text-xs text-slate-500 mt-1">Show helpful hints and suggested flows across the app.</div>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={Boolean(settings.guidedMode)} onChange={(e) => onUpdate({ guidedMode: e.target.checked })} className="rounded text-emerald-600 focus:ring-emerald-500" />
            On
          </label>
        </div>
      </Card>

      <Card className="border-slate-200">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Auto-fill empty sections on Topic tap</div>
              <div className="text-xs text-slate-500 mt-1">When you tap a Topic Chip, auto-fill Title/Prayer/Questions if empty.</div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings.autoFillEmptyOnTopicTap)}
                onChange={(e) => onUpdate({ autoFillEmptyOnTopicTap: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              On
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Draft for Me: auto-generate TikTok script</div>
              <div className="text-xs text-slate-500 mt-1">Default for the “Apply + Script” checkbox in Draft for Me.</div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings.guidedAutoGenerateTikTok)}
                onChange={(e) => onUpdate({ guidedAutoGenerateTikTok: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              On
            </label>
          </div>
        </div>
      </Card>

      {aiNeedsKey && settings.aiProvider !== "mock" ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <div className="font-extrabold text-slate-900">AI selected but missing key</div>
              <div className="text-sm text-slate-600 mt-1">Add a key below or switch to Built-in (no key).</div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">USERNAME / HANDLE</label>
            <input
              value={settings.username}
              onChange={(e) => onUpdate({ username: e.target.value })}
              placeholder="@yourname"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-shadow focus:border-emerald-300"
            />
          </div>


          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">THEME</label>
            <select
              value={settings.theme || "light"}
              onChange={(e) => onUpdate({ theme: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100 bg-white"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="mt-2 text-[11px] font-bold text-slate-500">
              Sunrise / Sunset / Classic adjust the app background only so everything stays readable.
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEFAULT BIBLE VERSION</label>
            <select
              value={settings.defaultBibleVersion}
              onChange={(e) => onUpdate({ defaultBibleVersion: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
            >
              {BIBLE_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">SCAN / OCR</div>

            <div className="mt-3">
              <label className="text-xs font-extrabold text-slate-500">OCR ENDPOINT (Vercel)</label>
              <input
                value={settings.ocrEndpoint || ""}
                onChange={(e) => onUpdate({ ocrEndpoint: e.target.value })}
                placeholder="https://your-vercel-app.vercel.app/api/ocr"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
              />
              <div className="text-xs text-slate-500 mt-2">Best quality OCR uses Google Vision behind this endpoint.</div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-600">AUTO STRUCTURE AFTER SCAN</div>
              <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={Boolean(settings.ocrAutoStructure)} onChange={(e) => onUpdate({ ocrAutoStructure: e.target.checked })} className="rounded text-emerald-600 focus:ring-emerald-500" />
                On
              </label>
            </div>
            <div className="text-xs text-slate-500 mt-1">After OCR, generate an AI Structured preview (editable + apply per section).</div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI PROVIDER</label>
            <select
              value={settings.aiProvider}
              onChange={(e) => onUpdate({ aiProvider: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <option value="mock">Built-in (no key)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
            </select>
            <div className="text-xs text-slate-500 mt-2">
              Keys are stored locally. If an AI call fails, the app falls back to offline mode automatically.
            </div>
          </div>

          {settings.aiProvider === "openai" ? (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OPENAI API KEY</label>
              <input
                value={settings.openaiKey}
                onChange={(e) => onUpdate({ openaiKey: e.target.value })}
                placeholder="sk-..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          ) : null}

          {settings.aiProvider === "gemini" ? (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GEMINI API KEY</label>
              <input
                value={settings.geminiKey}
                onChange={(e) => onUpdate({ geminiKey: e.target.value })}
                placeholder="AIza..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          ) : null}
        </div>
      </Card>

      <PrimaryButton onClick={onReset} icon={Trash2}>
        Reset Local Data
      </PrimaryButton>

      <Card className="border-slate-200">
        <div className="space-y-3">
          <div className="text-sm font-extrabold text-slate-900">Session</div>
          <div className="text-xs text-slate-500">Sign out is placed here to avoid accidental taps while writing.</div>
          <SmallButton onClick={onLogout} tone="danger">Logout</SmallButton>
        </div>
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
          <div className="text-sm text-slate-500 mt-2">Tap <b>Copy</b> then open your app — or tap <b>Open in {platform}</b> below. Limit: {limit} chars.</div>
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
                    else if (platform === "facebook") void shareToFacebook();
                    else if (platform === "twitter") shareToX();
                    else copy();
                  }}
                  className="w-full justify-center"
                  tone="neutral"
                >
                  Open in {platform === "tiktok" ? "TikTok" : platform === "facebook" ? "Facebook" : platform === "twitter" ? "Twitter / X" : "App"} →
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
  const [step, setStep] = useState(1);
  const [name, setName] = useState(authDraft?.name || "");
  const [mood, setMood] = useState("hopeful");
  const [version, setVersion] = useState("KJV");
  const [guidedMode, setGuidedMode] = useState(true);

  const total = 3;

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
      starterMood: mood,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-sky-50 px-4 py-8 animate-enter">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ONBOARDING</div>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Step {step} / {total}</div>
          </div>

          <div className="py-2">
          {step === 1 ? (
            <div className="mt-4 animate-enter">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">What should we call you?</h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or handle"
                className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-4 space-y-6 animate-enter">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set personalized defaults</h2>
              <div>
                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">CURRENT SEASON</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Chip key={m.id} active={mood === m.id} onClick={() => setMood(m.id)}>
                      {m.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">DEFAULT BIBLE VERSION</div>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {BIBLE_VERSIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-4 space-y-6 animate-enter">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Choose your writing experience</h2>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 cursor-pointer hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-base font-extrabold text-slate-900">Guided mode</div>
                  <div className="text-xs text-slate-500 mt-1">Show helper hints and one-click structure prompts.</div>
                </div>
                <input type="checkbox" checked={guidedMode} onChange={(e) => setGuidedMode(e.target.checked)} className="rounded text-emerald-600 w-5 h-5 focus:ring-emerald-500" />
              </label>
            </div>
          ) : null}
          </div>

          <div className="mt-8 flex gap-2 pt-4 border-t border-slate-100">
            {step > 1 ? (
              <SmallButton onClick={() => setStep((s) => Math.max(1, s - 1))} icon={ChevronLeft}>
                Back
              </SmallButton>
            ) : (
              <div />
            )}
            <div className="flex-1" />
            {step < total ? (
              <SmallButton onClick={() => setStep((s) => Math.min(total, s + 1))} tone="primary" icon={ChevronRight}>
                Next
              </SmallButton>
            ) : (
              <SmallButton onClick={finish} tone="primary">
                Start App
              </SmallButton>
            )}
          </div>
        </Card>
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
        "flex flex-col items-center justify-center gap-0.5 py-2 rounded-2xl transition-all duration-200 relative overflow-hidden",
        active ? "text-emerald-700 bg-emerald-50/60" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
      )}
      type="button"
      title={label}
    >
      <Icon className={cn("transition-all duration-200", active ? "w-5 h-5" : "w-5 h-5")} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-bold leading-none">{label}</span>
      {active && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />}
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

      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 transition-all duration-300">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <img
            src={assetUrl("logo.png")}
            alt="VersedUP"
            className="h-10 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
            draggable="false"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="min-w-0 leading-tight flex-1">
            <div className="text-sm font-extrabold text-slate-900 tracking-tight">Rooted in Christ</div>
            <div className="text-xs font-bold text-slate-500 truncate mt-0.5">{getTimeGreeting(getDisplayName(session, settings))}</div>
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

        {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} onReset={reset} onLogout={onLogout} /> : null}
        </PageTransition>
      </main>

      <div className="fixed bottom-6 left-4 right-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] px-4 py-2 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
            <div className="grid grid-cols-4 gap-1">
              <NavButton active={view === "home"} onClick={() => setView("home")} icon={ICONS.nav.home} label="Home" />
              <NavButton active={view === "write"} onClick={() => { if (!active) newEntry(); else setView("write"); }} icon={ICONS.nav.write} label="Write" />
              <NavButton active={view === "compile"} onClick={() => setView(active ? "compile" : "home")} icon={ICONS.nav.compile} label="Share" />
              <NavButton active={view === "library"} onClick={() => setView("library")} icon={Library} label="Library" />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={newEntry}
        className="fixed bottom-28 right-6 z-50 w-14 h-14 rounded-full bg-slate-900 text-white shadow-2xl shadow-slate-900/30 flex items-center justify-center hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="New Entry"
        type="button"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
      </button>
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
