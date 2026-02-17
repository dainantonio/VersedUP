import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
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
  Sparkles,
  MoreVertical,
  Trash2,
  Wand2,
  X,
  ScanLine,
} from "lucide-react";

/**
 * VersedUP — single file app
 *
 * Added in this version:
 * - Guided Mode toggle (Settings) to show/hide helper hints everywhere
 * - Topic Chips support "Guided Fill" (Title/Reflection/Prayer/Questions) in one click
 * - NEW: "Auto-fill empty sections on Topic tap" setting (Prayer/Questions/Title)
 * - NEW: "Fill + Generate TikTok Script" one-click flow (Guided Fill modal)
 */

const APP_ID = "versedup_v1";
const STORAGE_SETTINGS = `${APP_ID}_settings`;
const STORAGE_DEVOTIONALS = `${APP_ID}_devotionals`;
const STORAGE_STREAK = `${APP_ID}_streak`;

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

  exportPrefs: {
    tiktokTemplate: "minimalLight",
    includeTitle: true,
    includeDate: true,
    includeScripture: true,
    includeUsername: true,
    includeWatermark: true,
  },
};

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
        "bg-white rounded-3xl border border-slate-200 shadow-sm p-5",
        "backdrop-blur-sm",
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
        "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition",
        "active:scale-[0.985] will-change-transform",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      type="button"
    >
      {Icon ? <Icon className="w-5 h-5" /> : null}
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-full border text-xs font-bold transition whitespace-nowrap",
        "active:scale-[0.98] will-change-transform",
        active
          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
      )}
      type="button"
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick, disabled, icon: Icon, tone = "neutral", type = "button" }) {
  const base =
    "px-3 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-2 justify-center active:scale-[0.98] will-change-transform";
  const variants = {
    neutral: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
    primary: "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-white border-slate-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(base, variants[tone], disabled && "opacity-50 cursor-not-allowed")}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="font-extrabold text-slate-900">{title}</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 active:scale-[0.98]" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">{footer}</div> : null}
      </div>
    </div>
  );
}

function ApplySectionCard({ k, label, value, checked, onToggle, onChange }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-xs font-extrabold text-slate-700">{label}</div>
        <label className="text-xs font-extrabold text-slate-600 flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
          Apply
        </label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={k === "reflection" ? 5 : k === "verseText" ? 4 : 3}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
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

function HomeView({ onNew, onLibrary, onContinue, hasActive, streak, greetingName }) {
  return (
    <div className="space-y-6 pb-28">
      <div>
        <div className="text-sm text-slate-500">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="text-3xl font-extrabold text-slate-900 mt-1">Good morning, {greetingName || "Friend"}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 via-transparent to-sky-200/30 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-500">CURRENT STREAK</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {streak.count} <span className="text-slate-500 text-lg">days</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Keep showing up — God meets you here.</div>
            </div>
            <button
              onClick={hasActive ? onContinue : onNew}
              className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-lg hover:bg-emerald-700 active:scale-[0.985]"
              type="button"
            >
              {hasActive ? "Continue" : "Check In"}
            </button>
          </div>
        </div>

        <button
          onClick={onNew}
          className="bg-white rounded-3xl border border-slate-200 p-5 text-left hover:bg-slate-50 transition active:scale-[0.99]"
          type="button"
        >
          <div className="font-extrabold text-slate-900">New Entry</div>
          <div className="text-xs text-slate-500 mt-1">Start fresh</div>
        </button>

        <button
          onClick={onLibrary}
          className="bg-white rounded-3xl border border-slate-200 p-5 text-left hover:bg-slate-50 transition active:scale-[0.99]"
          type="button"
        >
          <div className="font-extrabold text-slate-900">Library</div>
          <div className="text-xs text-slate-500 mt-1">View archive</div>
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Verse of the Day</div>
          <div className="text-xs font-bold text-emerald-700">Daily</div>
        </div>
        <div className="mt-3 bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-sm">
          <div className="text-2xl leading-snug font-semibold">
            “The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.”
          </div>
          <div className="mt-4 text-xs font-extrabold tracking-wider opacity-90">PSALM 23:1-2</div>
          <button
            onClick={onNew}
            className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/25 text-xs font-extrabold active:scale-[0.985]"
            type="button"
          >
            Reflect on this
          </button>
        </div>
      </Card>
    </div>
  );
}

function OcrScanModal({ settings, mood, onClose, onApplyToDevotional }) {
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
      alert("Scan first (or paste text) so there is something to structure.");
      return;
    }

    setAiBusy(true);
    try {
      const out = await aiStructure(settings, { verseRef, verseText, reflection, mood });
      setStructured(out);
      setApplyStructured({ title: true, reflection: true, prayer: true, questions: true });
      setTab("structured");
    } catch (e) {
      alert(e?.message || "AI failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const runOcr = async () => {
    if (!canRun) {
      alert("Set OCR Endpoint in Settings first (Vercel /api/ocr).");
      return;
    }
    if (!file) {
      alert("Select an image first.");
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
      alert(e?.message || "OCR failed.");
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
          <div className="text-xs text-slate-500">{busy ? "Reading..." : aiBusy ? "Structuring..." : ""}</div>
          <div className="flex-1" />
          <SmallButton onClick={onClose}>Close</SmallButton>
          <SmallButton onClick={applyFields} tone="primary" disabled={!rawText}>
            Apply
          </SmallButton>
        </div>
      }
    >
      <div className="space-y-4">
        <Card className="p-4">
          <div className="text-xs font-extrabold text-slate-500">UPLOAD OR CAPTURE</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold hover:bg-slate-50 active:scale-[0.98]">
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
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold hover:bg-slate-50 active:scale-[0.98]">
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
            <div className="mt-3 text-xs font-bold text-amber-700">
              OCR is not connected yet. Go to <b>Settings</b> → paste your Vercel OCR URL.
            </div>
          ) : null}

          {previewUrl ? (
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200">
              <img src={previewUrl} alt="Scan preview" className="w-full h-auto" />
            </div>
          ) : null}
        </Card>

        {rawText ? (
          <div className="space-y-3">
            <Card className="p-4">
              <div className="text-xs font-extrabold text-slate-500">OCR TEXT (RAW)</div>
              <div className="mt-2 text-xs whitespace-pre-wrap text-slate-600 max-h-40 overflow-auto">{rawText}</div>
            </Card>

            <div className="flex gap-2">
              <Chip active={tab === "parsed"} onClick={() => setTab("parsed")}>
                Parsed
              </Chip>
              <Chip active={tab === "structured"} onClick={() => setTab("structured")}>
                Structured (AI)
              </Chip>
              <div className="flex-1" />
              {tab === "structured" ? (
                <SmallButton onClick={() => void generateStructure({ fromParsed: false })} disabled={aiBusy} icon={RefreshCw}>
                  Regenerate
                </SmallButton>
              ) : null}
            </div>

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
  const [busy, setBusy] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureDraft, setStructureDraft] = useState({ title: "", reflection: "", prayer: "", questions: "" });
  const [apply, setApply] = useState({ title: true, reflection: true, prayer: true, questions: true });
  const [fetching, setFetching] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const [guidedBusy, setGuidedBusy] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_CHIPS[0]?.id || "");

  const [guidedDraft, setGuidedDraft] = useState({ title: "", reflection: "", prayer: "", questions: "" });
  const [guidedApply, setGuidedApply] = useState({ title: true, reflection: true, prayer: true, questions: true });

  const [guidedScriptBusy, setGuidedScriptBusy] = useState(false);
  const [guidedGenerateScript, setGuidedGenerateScript] = useState(Boolean(settings.guidedAutoGenerateTikTok));

  const reflectionRef = useRef(null);

  const version = devotional.bibleVersion || settings.defaultBibleVersion || "KJV";
  const guidedMode = Boolean(settings.guidedMode);

  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

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
      alert(e?.message || "Fetch failed.");
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
      alert(e?.message || "AI failed.");
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
      alert(e?.message || "AI failed.");
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
      alert(e?.message || "AI failed.");
    } finally {
      setBusy(false);
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
      alert("Applied + generated TikTok script ✅ (see Compile → TikTok Script)");
    } catch (e) {
      setGuidedOpen(false);
      alert(e?.message || "Applied, but TikTok script generation failed.");
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
      alert(e?.message || "AI failed.");
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
    <div className="space-y-6 pb-28">
      <div>
        <div className="text-lg font-extrabold text-slate-900">New Entry</div>
        <div className="text-xs font-bold text-slate-400 mt-1">CAPTURE WHAT GOD IS SPEAKING</div>
      </div>

      <Card className="overflow-hidden">
        <div className="text-xs font-extrabold text-slate-500">HOW IS YOUR HEART?</div>
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
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> VERSE
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

            <div className="flex gap-2">
              <input
                value={devotional.verseRef}
                onChange={(e) => onUpdate({ verseRef: e.target.value })}
                placeholder="Verse reference (e.g., Psalm 23)"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200 bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void doFetch();
                }}
              />
              <select
                value={version}
                onChange={(e) => onUpdate({ bibleVersion: e.target.value })}
                className="rounded-xl border border-slate-200 px-2 py-2 text-sm font-extrabold bg-white"
              >
                {BIBLE_VERSIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <SmallButton
                onClick={doFetch}
                disabled={!hasVerseRef || fetching}
                icon={fetching ? Loader2 : null}
                tone="primary"
              >
                {fetching ? "..." : "FETCH"}
              </SmallButton>
            </div>

            {guidedMode && !hasVerseRef ? (
              <div className="text-xs font-bold text-slate-500">
                Try: <span className="font-extrabold text-slate-700">John 3:16-18</span> or{" "}
                <span className="font-extrabold text-slate-700">Psalm 23</span>
              </div>
            ) : null}

            <div>
              <label className="text-[10px] font-extrabold text-slate-400">VERSE TEXT</label>
              <textarea
                value={devotional.verseText}
                onChange={(e) => onUpdate({ verseText: e.target.value, verseTextEdited: true })}
                placeholder={
                  isKjv(version)
                    ? "Fetch KJV to auto-fill..."
                    : "Free-for-now: Open in YouVersion. Paste text you have rights to use."
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 bg-white resize-none"
              />
              {guidedMode && !hasVerseText && hasVerseRef ? (
                <div className="mt-2 text-[11px] font-bold text-slate-500">
                  Tip: Press <span className="font-extrabold">FETCH</span> to fill KJV automatically (or use YouVersion).
                </div>
              ) : null}
              {devotional.verseTextEdited ? (
                <div className="mt-2 text-[11px] font-bold text-amber-700">Edited override</div>
              ) : null}
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-400">TITLE (OPTIONAL)</label>
            <input
              value={devotional.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Give it a holy title..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
            />
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <label className="text-xs font-extrabold text-slate-400">REFLECTION / BODY</label>
              {guidedMode ? <div className="text-[11px] font-bold text-slate-500">Topic → prompt, then Guided Fill</div> : null}
            </div>

            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {TOPIC_CHIPS.map((t) => (
                <Chip key={t.id} active={selectedTopic === t.id} onClick={() => onTopicClick(t)}>
                  {t.label}
                </Chip>
              ))}
              <div className="flex-1" />
              <SmallButton onClick={openGuidedDraftFromTemplate} icon={Wand2}>
                Guided Fill
              </SmallButton>
              <SmallButton
                onClick={() => void openGuidedDraftFromAI()}
                disabled={guidedBusy || aiNeedsKey}
                icon={guidedBusy ? Loader2 : Sparkles}
              >
                {guidedBusy ? "..." : "AI Guided"}
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
              placeholder="Start writing... (or tap a Topic Chip above)"
              rows={8}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
            />

            {guidedMode && !hasReflection ? (
              <div className="mt-2 text-xs font-bold text-slate-500">Starter: “What is God showing me about this verse today?”</div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-2">
              <SmallButton onClick={doFixReflection} disabled={busy || !hasReflection} icon={Sparkles}>
                Fix grammar
              </SmallButton>
              <SmallButton onClick={doStructure} disabled={busy || (!hasReflection && !hasVerseRef)} icon={Wand2}>
                Structure
              </SmallButton>
              <SmallButton onClick={() => void doLength("shorten")} disabled={busy || !hasReflection}>
                Shorten
              </SmallButton>
              <SmallButton onClick={() => void doLength("lengthen")} disabled={busy || !hasReflection}>
                Lengthen
              </SmallButton>
            </div>

            {guidedMode && !hasReflection ? (
              <div className="mt-2 text-[11px] font-bold text-slate-500">
                Tip: write 3–6 lines, then tap <span className="font-extrabold">Structure</span>.
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-400">PRAYER</label>
            <textarea
              value={devotional.prayer}
              onChange={(e) => onUpdate({ prayer: e.target.value })}
              placeholder="Lord, help me..."
              rows={4}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-400">REFLECTION QUESTIONS</label>
            <textarea
              value={devotional.questions}
              onChange={(e) => onUpdate({ questions: e.target.value })}
              placeholder={"1) ...\n2) ..."}
              rows={3}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
            />
          </div>
        </div>
      </Card>

      <PrimaryButton
        onClick={() => {
          onSaved();
          onGoPolish();
        }}
        icon={Check}
      >
        Save & Polish
      </PrimaryButton>

      <PrimaryButton
        onClick={() => {
          onSaved();
          onGoCompile();
        }}
        icon={Share2}
      >
        Compile for Socials
      </PrimaryButton>

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
                  <label className="text-xs font-extrabold text-slate-600 flex items-center gap-2">
                    <input type="checkbox" checked={apply[k]} onChange={(e) => setApply((s) => ({ ...s, [k]: e.target.checked }))} />
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
          title={`Guided Fill Preview — ${topic?.label || "Topic"}`}
          onClose={() => setGuidedOpen(false)}
          footer={
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                  <input
                    type="checkbox"
                    checked={guidedGenerateScript}
                    onChange={(e) => setGuidedGenerateScript(e.target.checked)}
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

function PolishView({ devotional }) {
  return (
    <div className="space-y-6 pb-28">
      <Card>
        <div className="text-xl font-extrabold text-slate-900">Polish</div>
        <div className="text-sm text-slate-500 mt-1">Review and refine. Then export.</div>
      </Card>

      <Card>
        <div className="space-y-3">
          <div className="text-sm font-extrabold text-slate-700">Scripture</div>
          <div className="text-sm text-slate-600">{devotional.verseRef || "—"}</div>
          <div className="text-sm whitespace-pre-wrap text-slate-800">{devotional.verseText || "—"}</div>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-extrabold text-slate-700">Reflection</div>
        <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{devotional.reflection || "—"}</div>
      </Card>

      {!!devotional.prayer && (
        <Card>
          <div className="text-sm font-extrabold text-slate-700">Prayer</div>
          <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{devotional.prayer}</div>
        </Card>
      )}

      {!!devotional.questions && (
        <Card>
          <div className="text-sm font-extrabold text-slate-700">Questions</div>
          <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{devotional.questions}</div>
        </Card>
      )}
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
    <div className="space-y-6 pb-28">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Library</div>
            <div className="text-sm text-slate-500 mt-1">Your saved devotionals.</div>
          </div>
        </div>
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-2xl border border-slate-200 pl-9 pr-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onOpen(d.id)} className="text-left flex-1 active:scale-[0.995]" type="button">
                <div className="font-extrabold text-slate-900">{d.title || "Untitled"}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{d.verseRef || "No scripture"}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(d.updatedAt).toLocaleDateString()}</div>
              </button>
              <SmallButton tone="danger" onClick={() => onDelete(d.id)} icon={Trash2}>
                Delete
              </SmallButton>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <Card>
            <div className="text-sm text-slate-500">No results.</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function SettingsView({ settings, onUpdate, onReset }) {
  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

  return (
    <div className="space-y-6 pb-28">
      <Card>
        <div className="text-lg font-extrabold text-slate-900">Settings</div>
        <div className="text-sm text-slate-500 mt-1">AI keys, defaults, OCR, guidance.</div>
      </Card>

      <Card className="border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Guided Mode</div>
            <div className="text-xs text-slate-500 mt-1">Show helpful hints and suggested flows across the app.</div>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <input type="checkbox" checked={Boolean(settings.guidedMode)} onChange={(e) => onUpdate({ guidedMode: e.target.checked })} />
            On
          </label>
        </div>
      </Card>

      <Card className="border-slate-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Auto-fill empty sections on Topic tap</div>
              <div className="text-xs text-slate-500 mt-1">When you tap a Topic Chip, auto-fill Title/Prayer/Questions if empty.</div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(settings.autoFillEmptyOnTopicTap)}
                onChange={(e) => onUpdate({ autoFillEmptyOnTopicTap: e.target.checked })}
              />
              On
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Guided Fill: auto-generate TikTok script</div>
              <div className="text-xs text-slate-500 mt-1">Default for the “Apply + Script” checkbox in Guided Fill.</div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(settings.guidedAutoGenerateTikTok)}
                onChange={(e) => onUpdate({ guidedAutoGenerateTikTok: e.target.checked })}
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
            <label className="text-xs font-extrabold text-slate-500">USERNAME / HANDLE</label>
            <input
              value={settings.username}
              onChange={(e) => onUpdate({ username: e.target.value })}
              placeholder="@yourname"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-500">DEFAULT BIBLE VERSION</label>
            <select
              value={settings.defaultBibleVersion}
              onChange={(e) => onUpdate({ defaultBibleVersion: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white"
            >
              {BIBLE_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="text-xs font-extrabold text-slate-600">SCAN / OCR</div>

            <div className="mt-3">
              <label className="text-xs font-extrabold text-slate-500">OCR ENDPOINT (Vercel)</label>
              <input
                value={settings.ocrEndpoint || ""}
                onChange={(e) => onUpdate({ ocrEndpoint: e.target.value })}
                placeholder="https://your-vercel-app.vercel.app/api/ocr"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200 bg-white"
              />
              <div className="text-xs text-slate-500 mt-2">Best quality OCR uses Google Vision behind this endpoint.</div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-600">AUTO STRUCTURE AFTER SCAN</div>
              <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <input type="checkbox" checked={Boolean(settings.ocrAutoStructure)} onChange={(e) => onUpdate({ ocrAutoStructure: e.target.checked })} />
                On
              </label>
            </div>
            <div className="text-xs text-slate-500 mt-1">After OCR, generate an AI Structured preview (editable + apply per section).</div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-500">AI PROVIDER</label>
            <select
              value={settings.aiProvider}
              onChange={(e) => onUpdate({ aiProvider: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white"
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
              <label className="text-xs font-extrabold text-slate-500">OPENAI API KEY</label>
              <input
                value={settings.openaiKey}
                onChange={(e) => onUpdate({ openaiKey: e.target.value })}
                placeholder="sk-..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
              />
            </div>
          ) : null}

          {settings.aiProvider === "gemini" ? (
            <div>
              <label className="text-xs font-extrabold text-slate-500">GEMINI API KEY</label>
              <input
                value={settings.geminiKey}
                onChange={(e) => onUpdate({ geminiKey: e.target.value })}
                placeholder="AIza..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
              />
            </div>
          ) : null}
        </div>
      </Card>

      <PrimaryButton onClick={onReset} icon={Trash2}>
        Reset Local Data
      </PrimaryButton>
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

function CompileView({ devotional, settings, onUpdate }) {
  const [platform, setPlatform] = useState("tiktok");
  const [mode, setMode] = useState("preview");
  const [text, setText] = useState("");
  const [scriptOpen, setScriptOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setText(compileForPlatform(platform, devotional, settings));
  }, [platform, devotional, settings]);

  const limit = PLATFORM_LIMITS[platform] || 999999;
  const over = text.length > limit;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    alert("Copied");
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Compile</div>
          <div className="text-sm text-slate-500 mt-1">Preview like a real post.</div>
        </div>
        <div className="flex gap-2">
          <SmallButton onClick={copy} icon={Copy}>
            Copy
          </SmallButton>
          <SmallButton onClick={() => setExportOpen(true)} icon={Camera}>
            PNG
          </SmallButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "tiktok", label: "TikTok" },
          { id: "instagram", label: "Instagram" },
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
            <div>
              <div className="font-extrabold text-slate-900">Over limit</div>
              <div className="text-sm text-slate-500">
                {text.length} / {limit}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {mode === "text" ? (
        <Card>
          <div className="text-xs font-extrabold text-slate-500">OUTPUT</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
          />
          <div className={cn("mt-2 text-xs font-bold", over ? "text-red-600" : "text-slate-500")}>
            {text.length} / {limit}
          </div>
        </Card>
      ) : (
        <SocialPreview platform={platform} devotional={devotional} settings={settings} text={text} />
      )}

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
          <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{text}</div>
        </div>
      </div>
    );
  }

  if (platform === "email") {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="text-xs font-extrabold text-slate-500">EMAIL PREVIEW</div>
          <div className="text-sm font-extrabold text-slate-900 mt-1">To: {settings.username || "you@example.com"}</div>
        </div>
        <div className="p-4">
          <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{text}</div>
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
        <div className="text-xs font-extrabold text-emerald-700">{devotional.mood ? `Mood: ${devotional.mood}` : "No mood"}</div>
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
      alert(e?.message || "AI failed.");
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
      alert(e?.message || "AI failed.");
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
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
            <input type="checkbox" checked={saveBack} onChange={(e) => setSaveBack(e.target.checked)} />
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
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
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
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      download(dataUrl);
      onClose();
    } catch {
      alert("Export failed. Try again.");
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
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="w-full bg-slate-50 p-3 flex justify-center">
          <div className="origin-top" style={{ transform: "scale(0.22)" }}>
            <div ref={ref} className="w-[1080px] h-[1920px] p-24 flex flex-col justify-between bg-white text-slate-900">
              <div className="space-y-10">
                {(includeTitle || includeDate) && (
                  <div className="space-y-2">
                    {includeTitle ? (
                      <div className="text-6xl font-extrabold tracking-tight">{devotional.title || "Untitled Devotional"}</div>
                    ) : null}
                    {includeDate ? (
                      <div className="text-2xl font-semibold text-slate-600">
                        {new Date(devotional.updatedAt || devotional.createdAt).toLocaleDateString()}
                      </div>
                    ) : null}
                  </div>
                )}

                {includeScripture ? (
                  <div className="rounded-3xl border border-slate-200 p-10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-2xl font-extrabold">{devotional.verseRef || "Scripture"}</div>
                      <div className="text-xl font-semibold text-slate-600">
                        {devotional.bibleVersion || settings.defaultBibleVersion || "KJV"}
                      </div>
                    </div>
                    {devotional.verseText ? (
                      <div className="text-3xl leading-snug mt-6 whitespace-pre-wrap text-slate-600">{devotional.verseText}</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="text-3xl leading-snug whitespace-pre-wrap">
                  {devotional.tiktokScript || compileForPlatform("tiktok", devotional, settings)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-2xl font-semibold text-slate-600">{includeUsername ? settings.username : ""}</div>
                <div className="text-2xl font-semibold text-slate-600">{includeWatermark ? "VersedUP" : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-3">Tip: TikTok UI covers edges. This export uses safe margins.</div>
    </Modal>
  );
}

/* ---------------- App shell ---------------- */

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition active:scale-[0.98]",
        active ? "bg-white/50 text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
      )}
      type="button"
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-extrabold">{label}</span>
    </button>
  );
}

function AppInner() {
  const [settings, setSettings] = useState(() => {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    const parsed = safeParseJson(raw, DEFAULT_SETTINGS);
    return parsed && typeof parsed === "object" ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
  });

  const [devotionals, setDevotionals] = useState(() => {
    const raw = localStorage.getItem(STORAGE_DEVOTIONALS);
    const parsed = safeParseJson(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  });

  const [streak, setStreak] = useState(() => loadStreak());
  const [activeId, setActiveId] = useState(() => (Array.isArray(devotionals) && devotionals[0] ? devotionals[0].id : ""));
  const [view, setView] = useState("home"); // home | write | polish | compile | library | settings

  const safeDevotionals = Array.isArray(devotionals) ? devotionals : [];
  const active = useMemo(() => safeDevotionals.find((d) => d.id === activeId) || null, [safeDevotionals, activeId]);
  const greetingName = (settings.username || "Friend").replace(/^@/, "");

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
    const next = bumpStreakOnSave();
    setStreak(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-sky-50">
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/70 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="VersedUP"
            className="h-12 w-auto object-contain drop-shadow-sm"
            draggable="false"
          />
          <div className="min-w-0 leading-tight flex-1">
            <div className="text-base font-extrabold text-slate-900">Good morning, {greetingName}</div>
            <div className="text-xs font-bold text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
          </div>
          <button
            type="button"
            onClick={() => setView("settings")}
            className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center"
            title="More"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-6">
        {view === "home" ? (
          <HomeView
            onNew={newEntry}
            onLibrary={() => setView("library")}
            onContinue={() => setView(active ? "write" : "home")}
            hasActive={Boolean(active)}
            streak={streak}
            greetingName={greetingName}
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

        {view === "polish" && active ? <PolishView devotional={active} /> : null}

        {view === "compile" && active ? <CompileView devotional={active} settings={settings} onUpdate={updateDevotional} /> : null}

        {view === "library" ? <LibraryView devotionals={safeDevotionals} onOpen={openEntry} onDelete={deleteEntry} /> : null}

        {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} onReset={reset} /> : null}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="bg-white/55 backdrop-blur-2xl border border-slate-200/70 shadow-[0_18px_60px_-25px_rgba(0,0,0,0.35)] rounded-3xl px-3 py-2">
            <div className="grid grid-cols-4 gap-2">
              <NavButton active={view === "home"} onClick={() => setView("home")} icon={BookOpen} label="Home" />
              <NavButton active={view === "write"} onClick={() => setView(active ? "write" : "home")} icon={PenTool} label="Write" />
              <NavButton active={view === "compile"} onClick={() => setView(active ? "compile" : "home")} icon={ScanLine} label="Compile" />
              <NavButton active={view === "library"} onClick={() => setView("library")} icon={Library} label="Library" />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={newEntry}
        className="fixed bottom-28 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center hover:bg-emerald-700 active:scale-[0.985]"
        title="New Entry"
        type="button"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
