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
  ChevronLeft,
  ChevronRight,
  LogIn,
  User,
  Trash2,
  Wand2,
  X,
  ScanLine,
  Flame,
} from "lucide-react";

/**
 * Centralized icon mapping (enforced)
 * - Make Share-Ready = Sparkles
 * - Compile for Socials = Camera
 * - Share Now = Check
 * - Nav: Home = BookOpen, Write = PenTool, Compile = ScanLine
 */
const ICONS = Object.freeze({
  actions: Object.freeze({
    makeShareReady: Sparkles,
    compileForSocials: Camera,
    shareNow: Check,
  }),
  nav: Object.freeze({
    home: BookOpen,
    write: PenTool,
    compile: ScanLine,
  }),
});

const FRUIT_LABELS = Object.freeze([
  "Love",
  "Joy",
  "Peace",
  "Patience",
  "Kindness",
  "Goodness",
  "Faithfulness",
  "Gentleness",
  "Self-Control",
]);

const ToastContext = React.createContext({ pushToast: () => {} });

function useToast() {
  return React.useContext(ToastContext);
}

function ToastTicker({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto px-4 pt-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur-xl shadow-sm px-4 py-2 overflow-hidden">
          <div className="versedup-marquee text-xs font-extrabold text-slate-700">
            <span>{toast.message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const STORAGE_SESSION = "versedup.session";
const STORAGE_DEVOTIONALS = "versedup.devotionals";
const STORAGE_SETTINGS = "versedup.settings";
const STORAGE_STREAK = "versedup.streak";

const VERSE_OF_DAY = {
  verseRef: "Psalm 23:1-2",
  verseText: "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures.",
  suggestedTitle: "The Shepherd Who Leads Me",
};

const MOOD_VERSES = Object.freeze({
  joy: { label: "Joy", verseRef: "Nehemiah 8:10", verseText: "The joy of the LORD is your strength." },
  anxiety: {
    label: "Anxiety",
    verseRef: "Philippians 4:6-7",
    verseText: "Be anxious for nothing… and the peace of God… shall keep your hearts and minds through Christ Jesus.",
  },
  hope: {
    label: "Hope",
    verseRef: "Romans 15:13",
    verseText:
      "Now the God of hope fill you with all joy and peace in believing… that ye may abound in hope, through the power of the Holy Ghost.",
  },
  peace: {
    label: "Peace",
    verseRef: "John 14:27",
    verseText: "Peace I leave with you, my peace I give unto you… Let not your heart be troubled.",
  },
  strength: {
    label: "Strength",
    verseRef: "Isaiah 41:10",
    verseText: "Fear thou not; for I am with thee… I will strengthen thee; yea, I will help thee.",
  },
});

const MOOD_VERSE_ORDER = Object.freeze(["joy", "anxiety", "hope", "peace", "strength"]);

const DEFAULT_SETTINGS = {
  username: "",
  theme: "light",
  aiProvider: "mock",
  openaiKey: "",
  geminiKey: "",
  defaultBibleVersion: "KJV",
  ocrEndpoint: "",
  ocrAutoStructure: true,
  guidedMode: true,

  autoFillEmptyOnTopicTap: true,
  guidedAutoGenerateTikTok: true,
  onboardingComplete: false,

  exportPrefs: {
    tiktokTemplate: "minimalLight",
    includeTitle: true,
    includeVerse: true,
    includeReflection: true,
    includePrayer: true,
    includeQuestions: true,
    includeUsername: true,
  },
};

const THEME_OPTIONS = Object.freeze([
  { id: "light", label: "Light" },
  { id: "sunrise", label: "Sunrise" },
  { id: "sunset", label: "Sunset" },
  { id: "classic", label: "Classic" },
]);

const THEME_STYLES = Object.freeze({
  light: "from-emerald-50/60 via-slate-50 to-sky-50",
  sunrise: "from-amber-50 via-rose-50 to-sky-50",
  sunset: "from-orange-50 via-rose-100 to-indigo-100",
  classic: "from-slate-50 via-white to-slate-100",
});

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function safeParseJson(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function persistSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_SESSION);
    return;
  }
  localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
}

function loadSession() {
  return safeParseJson(localStorage.getItem(STORAGE_SESSION), null);
}

function loadDevotionals() {
  return safeParseJson(localStorage.getItem(STORAGE_DEVOTIONALS), []);
}

function persistDevotionals(devotionals) {
  localStorage.setItem(STORAGE_DEVOTIONALS, JSON.stringify(devotionals));
}

function loadSettings() {
  const raw = localStorage.getItem(STORAGE_SETTINGS);
  const parsed = safeParseJson(raw, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
}

function persistSettings(settings) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

function loadStreak() {
  const raw = localStorage.getItem(STORAGE_STREAK);
  const parsed = safeParseJson(raw, { count: 0, lastDay: "" });
  const count = Number(parsed?.count || 0);
  return {
    count: Number.isFinite(count) ? count : 0,
    lastDay: String(parsed?.lastDay || ""),
  };
}

function saveStreak(streak) {
  localStorage.setItem(STORAGE_STREAK, JSON.stringify(streak));
}

function bumpStreakOnSave() {
  const streak = loadStreak();
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  if (streak.lastDay === dayKey) return streak;

  const last = streak.lastDay ? new Date(streak.lastDay) : null;
  const diff =
    last && Number.isFinite(last.getTime())
      ? Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
      : 9999;

  const next = {
    count: diff === 1 ? streak.count + 1 : 1,
    lastDay: dayKey,
  };

  saveStreak(next);
  return next;
}

function insertAtCursor(textareaEl, currentValue, insertText) {
  const insertion = String(insertText || "");
  if (!insertion) return currentValue;

  if (!textareaEl) {
    const sep = currentValue ? "\n\n" : "";
    return `${currentValue || ""}${sep}${insertion}`;
  }

  const start = textareaEl.selectionStart || 0;
  const end = textareaEl.selectionEnd || 0;

  const before = (currentValue || "").slice(0, start);
  const after = (currentValue || "").slice(end);

  const next = `${before}${insertion}${after}`;

  requestAnimationFrame(() => {
    try {
      textareaEl.focus();
      const pos = start + insertion.length;
      textareaEl.setSelectionRange(pos, pos);
    } catch {
      // no-op
    }
  });

  return next;
}

/* ---------------- Verse inference (offline heuristic) ---------------- */

function normalizeVerseText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTextMatch(query, candidate) {
  const q = normalizeVerseText(query);
  const c = normalizeVerseText(candidate);
  if (!q || !c) return 0;
  if (c.includes(q)) return Math.min(1, q.length / Math.max(10, c.length));
  const qWords = q.split(" ").filter(Boolean);
  const cWords = new Set(c.split(" ").filter(Boolean));
  const hits = qWords.reduce((n, w) => n + (cWords.has(w) ? 1 : 0), 0);
  return hits / Math.max(6, qWords.length);
}

function inferVerseRefFromText(queryText, candidates) {
  const query = normalizeVerseText(queryText);
  if (!query || query.length < 18) return null;
  let best = { score: 0, verseRef: "" };
  (Array.isArray(candidates) ? candidates : []).forEach((c) => {
    const s = scoreTextMatch(query, c.verseText);
    if (s > best.score) best = { score: s, verseRef: c.verseRef };
  });
  return best.score >= 0.45 ? best.verseRef : null;
}

function Card({ children, className = "" }) {
  return <div className={cn("bg-white rounded-3xl border border-slate-200 shadow-sm p-5", className)}>{children}</div>;
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-full text-xs font-extrabold border active:scale-[0.985]",
        active ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick, icon: Icon, disabled, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-extrabold border active:scale-[0.985] inline-flex items-center justify-center gap-2",
        disabled ? "opacity-60 cursor-not-allowed" : "",
        tone === "primary" ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

function NavButton({ collapsed, active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-2xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center gap-2 px-3",
        active ? "ring-4 ring-emerald-200" : "hover:bg-slate-50"
      )}
      title={label}
    >
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {!collapsed ? <span className="text-xs font-extrabold">{label}</span> : null}
    </button>
  );
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
    label: "",
    status: "draft",
  };
}

/* ---------------- Home ---------------- */

function HomeView({ onNew, onLibrary, onContinue, onReflectVerseOfDay, hasActive, streak, onApplyMoodVerse }) {
  const { pushToast } = useToast();
  const [moodVerseKey, setMoodVerseKey] = useState("joy");
  const moodVerse = MOOD_VERSES[moodVerseKey] || MOOD_VERSES.joy;

  const handleSelectMoodVerse = (key) => {
    setMoodVerseKey(key);
    const label = (MOOD_VERSES[key] || {}).label || "Verse";
    pushToast(`${label} verse ready.`);
  };

  return (
    <div className="space-y-6 pb-28">
      <div>
        <div className="text-sm text-slate-500">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="text-3xl font-extrabold text-slate-900 mt-1">Good Evening</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 via-transparent to-sky-200/30 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-500">CURRENT STREAK</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {streak.count} <Flame className="w-5 h-5 inline-block align-[-3px] ml-2 text-orange-500" />{" "}
                <span className="text-slate-500 text-lg">days</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Keep showing up — God meets you here.</div>
            </div>
            <button
              onClick={hasActive ? onContinue : onNew}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 active:scale-[0.985]"
              type="button"
            >
              {hasActive ? "Continue" : "Start"}
            </button>
          </div>
        </div>

        <button
          onClick={onNew}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 text-left hover:bg-slate-50 active:scale-[0.99]"
          type="button"
        >
          <div className="text-xs font-extrabold text-slate-500">NEW</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">Devotional</div>
          <div className="mt-2 text-xs text-slate-500">Create</div>
        </button>

        <button
          onClick={onLibrary}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 text-left hover:bg-slate-50 active:scale-[0.99]"
          type="button"
        >
          <div className="text-xs font-extrabold text-slate-500">LIBRARY</div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">Archive</div>
          <div className="mt-2 text-xs text-slate-500">View archive</div>
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Verse of the Day</div>
          <div className="text-xs font-bold text-emerald-700">Daily</div>
        </div>
        <div className="mt-3 bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-sm">
          <div className="text-2xl leading-snug font-semibold">{`“${VERSE_OF_DAY.verseText}”`}</div>
          <div className="mt-4 text-xs font-extrabold tracking-wider opacity-90">{VERSE_OF_DAY.verseRef.toUpperCase()}</div>
          <button
            onClick={onReflectVerseOfDay}
            className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/25 text-xs font-extrabold active:scale-[0.985]"
            type="button"
          >
            Reflect on this
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Pick a Verse</div>
          <div className="text-xs font-bold text-slate-500">By theme</div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {MOOD_VERSE_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectMoodVerse(key)}
              className={cn(
                "px-3 py-2 rounded-full text-xs font-extrabold border active:scale-[0.985]",
                moodVerseKey === key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {MOOD_VERSES[key].label}
            </button>
          ))}
        </div>

        <div className="mt-4 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 text-white shadow-sm">
          <div className="text-xl leading-snug font-semibold">{`“${moodVerse.verseText}”`}</div>
          <div className="mt-4 text-xs font-extrabold tracking-wider opacity-90">{moodVerse.verseRef.toUpperCase()}</div>
          <button
            onClick={() => onApplyMoodVerse && onApplyMoodVerse(moodVerseKey)}
            className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-extrabold active:scale-[0.985]"
            type="button"
          >
            Apply to entry
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Write ---------------- */

function WriteView({
  devotional,
  settings,
  onUpdate,
  onGoCompile,
  onGoPolish,
  onSaved,
  onGoSettings,
  verseCandidates,
}) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [shareReadyBusy, setShareReadyBusy] = useState(false);
  const [shareReadyStep, setShareReadyStep] = useState("");
  const reflectionRef = useRef(null);

  const version = devotional.bibleVersion || settings.defaultBibleVersion || "KJV";
  const guidedMode = Boolean(settings.guidedMode);

  const hasVerseRef = Boolean((devotional.verseRef || "").trim());
  const hasVerseText = Boolean((devotional.verseText || "").trim());

  const doFetch = async () => {
    setFetching(true);
    try {
      if (!hasVerseRef) return;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(devotional.verseRef)}?translation=kjv`);
      const data = await res.json();
      if (!res.ok || !data?.text) throw new Error(data?.error || "Passage not found.");
      onUpdate({ verseText: String(data.text).trim(), verseTextEdited: false });
    } catch (e) {
      alert(e?.message || "Fetch failed.");
    } finally {
      setFetching(false);
    }
  };

  const doFixReflection = async () => {
    setBusy(true);
    try {
      onUpdate({ reflection: devotional.reflection || "" });
    } finally {
      setBusy(false);
    }
  };

  const makeShareReady = async () => {
    setShareReadyBusy(true);
    setShareReadyStep("Formatting for social...");
    try {
      const next = (devotional.reflection || "").trim();
      if (!next) {
        setShareReadyStep("Add a reflection first.");
        return;
      }
      onUpdate({ reflection: next });
      setShareReadyStep("Share-ready.");
      pushToast("Share-ready.");
    } finally {
      setTimeout(() => setShareReadyStep(""), 1200);
      setShareReadyBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Write</div>
            <div className="text-sm text-slate-500 mt-1">Build your devotional entry.</div>
          </div>
          <div className="flex gap-2">
            <SmallButton onClick={onGoSettings} icon={Settings}>
              Settings
            </SmallButton>
            <SmallButton onClick={onSaved} icon={Check} tone="primary">
              Save
            </SmallButton>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="text-xs font-extrabold text-slate-500">HOW IS YOUR HEART?</div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "grateful", label: "Gratitude" },
            { id: "anxious", label: "Anxiety" },
            { id: "hopeful", label: "Hopeful" },
            { id: "weary", label: "Weary" },
          ].map((m) => (
            <Chip key={m.id} active={devotional.mood === m.id} onClick={() => onUpdate({ mood: devotional.mood === m.id ? "" : m.id })}>
              {m.label}
            </Chip>
          ))}

          <div className="mt-4">
            <div className="text-xs font-extrabold text-slate-500">LABEL (FRUIT OF THE SPIRIT)</div>
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {FRUIT_LABELS.map((lbl) => (
                <Chip key={lbl} active={devotional.label === lbl} onClick={() => onUpdate({ label: devotional.label === lbl ? "" : lbl })}>
                  {lbl}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Verse</div>
            <div className="text-xs text-slate-500 mt-1">Type the verse text and we’ll try to infer the reference.</div>
          </div>
          <div className="flex gap-2">
            <SmallButton onClick={() => void doFetch()} icon={RefreshCw} disabled={!hasVerseRef || fetching}>
              {fetching ? "..." : "FETCH"}
            </SmallButton>
          </div>
        </div>

        {guidedMode && !hasVerseRef ? (
          <div className="text-xs font-bold text-slate-500 mt-3">
            Try: <span className="font-extrabold text-slate-700">John 3:16-18</span> or <span className="font-extrabold text-slate-700">Psalm 23</span>
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
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
            className="rounded-xl border border-slate-200 px-2 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200 bg-white"
          >
            {["KJV", "NIV", "ESV", "NLT"].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <label className="text-[10px] font-extrabold text-slate-400">VERSE TEXT</label>
          <textarea
            value={devotional.verseText}
            onChange={(e) => {
              const nextText = e.target.value;
              onUpdate({ verseText: nextText, verseTextEdited: true });
              if (!String(devotional.verseRef || "").trim()) {
                const inferred = inferVerseRefFromText(nextText, verseCandidates);
                if (inferred) {
                  onUpdate({ verseRef: inferred });
                  pushToast(`Found reference: ${inferred}`);
                }
              }
            }}
            placeholder="Paste/type verse text..."
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 bg-white resize-none"
          />
          {guidedMode && !hasVerseText && hasVerseRef ? <div className="mt-2 text-xs font-bold text-slate-500">Tip: tap FETCH to populate verse text (KJV).</div> : null}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Reflection</div>
            <div className="text-xs text-slate-500 mt-1">Your thoughts and application.</div>
          </div>
          <div className="flex gap-2">
            <SmallButton onClick={() => void doFixReflection()} icon={Wand2} disabled={busy}>
              Improve
            </SmallButton>
            <SmallButton onClick={() => void makeShareReady()} icon={shareReadyBusy ? Loader2 : ICONS.actions.makeShareReady} disabled={shareReadyBusy} tone="primary">
              {shareReadyBusy ? "Working..." : "Make Share-Ready"}
            </SmallButton>
          </div>
        </div>

        <textarea
          ref={reflectionRef}
          value={devotional.reflection}
          onChange={(e) => onUpdate({ reflection: e.target.value })}
          placeholder="What is God showing you today?"
          rows={6}
          className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
        />

        {shareReadyStep ? <div className="mt-2 text-xs font-bold text-emerald-700">{shareReadyStep}</div> : null}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <SmallButton onClick={onGoPolish} icon={Sparkles}>
          Polish
        </SmallButton>
        <SmallButton onClick={onGoCompile} icon={Camera} tone="primary">
          Compile
        </SmallButton>
      </div>
    </div>
  );
}

/* ---------------- Compile ---------------- */

function CompileView({ devotional, settings, onBackToWrite }) {
  const { pushToast } = useToast();
  const [platform, setPlatform] = useState("tiktok");
  const [text, setText] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  useEffect(() => {
    const prefs = settings?.exportPrefs || {};
    const lines = [];

    if (prefs.includeTitle && devotional.title) lines.push(devotional.title);
    if (prefs.includeVerse && devotional.verseRef) lines.push(devotional.verseRef);
    if (prefs.includeVerse && devotional.verseText) lines.push(devotional.verseText);
    if (prefs.includeReflection && devotional.reflection) lines.push(devotional.reflection);
    if (prefs.includePrayer && devotional.prayer) lines.push(`Prayer: ${devotional.prayer}`);
    if (prefs.includeQuestions && devotional.questions) lines.push(`Questions: ${devotional.questions}`);
    if (prefs.includeUsername && settings.username) lines.push(`— ${settings.username}`);

    setText(lines.filter(Boolean).join("\n\n").trim());
  }, [platform, devotional, settings]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Copied • tap caption to edit");
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
      // no-op
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

  return (
    <div className="space-y-6 pb-56">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Share</div>
          <div className="text-sm text-slate-500 mt-1">Choose where this goes next.</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <SmallButton onClick={shareToFacebook}>Facebook</SmallButton>
          <SmallButton onClick={shareToX}>Twitter / X</SmallButton>
          <SmallButton onClick={() => void shareNow()} icon={ICONS.actions.shareNow} disabled={shareBusy}>
            {shareBusy ? "Sharing..." : "Share Now"}
          </SmallButton>
          <SmallButton onClick={copy} icon={Copy}>
            Copy
          </SmallButton>
          <SmallButton onClick={openEmailDraft}>Email Draft</SmallButton>
          <SmallButton onClick={openTextDraft}>Text Draft</SmallButton>
        </div>
      </div>

      <Card>
        <div className="text-xs font-extrabold text-slate-500">SOCIAL SHARE</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <SmallButton onClick={shareToFacebook}>Facebook</SmallButton>
          <SmallButton onClick={shareToX}>Twitter / X</SmallButton>
          <SmallButton onClick={() => void shareToTikTok()}>TikTok</SmallButton>
        </div>
        <div className="mt-2 text-[11px] font-bold text-slate-500">TikTok opens upload and copies caption automatically.</div>
      </Card>

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

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">Caption</div>
          <div className="text-xs font-extrabold text-slate-500">{text.length}</div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <SmallButton onClick={onBackToWrite} icon={PenTool}>
            Back to Write
          </SmallButton>
        </div>
      </Card>

      <div className="fixed left-0 right-0 bottom-24 z-30">
        <div className="max-w-md mx-auto px-4">
          <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <SmallButton onClick={shareToFacebook}>Facebook</SmallButton>
              <SmallButton onClick={shareToX}>Twitter / X</SmallButton>

              <SmallButton onClick={() => void shareNow()} icon={ICONS.actions.shareNow} disabled={shareBusy} tone="primary">
                {shareBusy ? "Sharing..." : "Share Now"}
              </SmallButton>
              <SmallButton onClick={copy} icon={Copy}>
                Copy
              </SmallButton>
              <SmallButton onClick={openEmailDraft}>Email Draft</SmallButton>
              <SmallButton onClick={openTextDraft}>Text Draft</SmallButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Library ---------------- */

function LibraryView({ devotionals, onOpen, onDelete }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return devotionals;
    return devotionals.filter((d) => {
      const hay = `${d.title} ${d.verseRef} ${d.reflection} ${d.label || ""}`.toLowerCase();
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

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setQ("")}
              className="px-3 py-2 rounded-full text-xs font-extrabold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.985]"
            >
              Clear
            </button>
            {FRUIT_LABELS.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setQ((cur) => (cur.trim().toLowerCase() === lbl.toLowerCase() ? "" : lbl))}
                className="px-3 py-2 rounded-full text-xs font-extrabold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.985]"
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onOpen(d.id)} className="text-left flex-1 active:scale-[0.995]" type="button">
                <div className="text-sm font-extrabold text-slate-900">{d.title || "Untitled"}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{d.verseRef || "—"}</div>
                {d.label ? (
                  <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold text-slate-700">
                    {d.label}
                  </div>
                ) : null}
                <div className="text-xs text-slate-500 mt-2 line-clamp-2">{d.reflection || ""}</div>
              </button>

              <button
                onClick={() => onDelete(d.id)}
                className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
                type="button"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsView({ settings, onUpdate }) {
  const { pushToast } = useToast();

  const showGreeting = () => {
    const raw = String(settings.username || "").trim();
    const name = raw.replace(/^@/, "").trim();
    if (!name) return;

    const hour = new Date().getHours();
    const message =
      hour >= 5 && hour < 12
        ? `Good morning, ${name}.`
        : `This is the day the Lord has made; let us rejoice and be glad in it, ${name}.`;

    pushToast(message, 4500);
  };

  return (
    <div className="space-y-6 pb-28">
      <Card>
        <div className="text-lg font-extrabold text-slate-900">Settings</div>
        <div className="text-sm text-slate-500 mt-1">Profile + preferences.</div>
      </Card>

      <Card className="border-slate-200">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-slate-500">USERNAME / HANDLE</label>
            <input
              value={settings.username}
              onChange={(e) => onUpdate({ username: e.target.value })}
              onBlur={showGreeting}
              placeholder="@yourname"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
            />
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-500">THEME</label>
            <select
              value={settings.theme || "light"}
              onChange={(e) => onUpdate({ theme: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- App shell ---------------- */

function AppInner({ session, starterMood, onLogout }) {
  const [settings, setSettings] = useState(() => loadSettings());
  const [devotionals, setDevotionals] = useState(() => {
    const loaded = loadDevotionals();
    return Array.isArray(loaded) ? loaded.map((d) => ({ ...d, label: typeof d?.label === "string" ? d.label : "" })) : [];
  });
  const [streak, setStreak] = useState(() => loadStreak());
  const [activeId, setActiveId] = useState(() => (Array.isArray(devotionals) && devotionals[0] ? devotionals[0].id : ""));
  const [view, setView] = useState("home");
  const [navCollapsed, setNavCollapsed] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const pushToast = (message, durationMs = 2800) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    const next = { id: crypto.randomUUID(), message: String(message || "") };
    setToast(next);
    toastTimerRef.current = window.setTimeout(() => setToast(null), durationMs);
  };

  // greeting ticker on login
  useEffect(() => {
    const raw = String(session?.name || settings?.username || "").trim();
    const name = raw.replace(/^@/, "").trim();
    if (!name) return;
    const hour = new Date().getHours();
    const msg =
      hour >= 5 && hour < 12
        ? `Good morning, ${name}.`
        : `This is the day the Lord has made; let us rejoice and be glad in it, ${name}.`;
    pushToast(msg, 4500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeDevotionals = Array.isArray(devotionals) ? devotionals : [];

  const verseCandidates = useMemo(() => {
    const seeds = [
      { verseRef: VERSE_OF_DAY.verseRef, verseText: VERSE_OF_DAY.verseText },
      ...MOOD_VERSE_ORDER.map((k) => ({ verseRef: MOOD_VERSES[k].verseRef, verseText: MOOD_VERSES[k].verseText })),
    ];
    const fromLibrary = safeDevotionals
      .filter((d) => d && d.verseRef && d.verseText)
      .map((d) => ({ verseRef: d.verseRef, verseText: d.verseText }));
    const seen = new Set();
    return [...seeds, ...fromLibrary].filter((v) => {
      const key = `${v.verseRef}__${v.verseText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [safeDevotionals]);

  const active = useMemo(() => safeDevotionals.find((d) => d.id === activeId) || null, [safeDevotionals, activeId]);
  const hasActive = Boolean(active);

  useEffect(() => {
    persistDevotionals(safeDevotionals);
  }, [safeDevotionals]);

  const updateSettings = (patch) => {
    setSettings((s) => {
      const next = { ...s, ...(patch || {}) };
      persistSettings(next);
      return next;
    });
  };

  const createAndActivate = () => {
    const d = createDevotional(settings);
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const updateDevotional = (patch) => {
    setDevotionals((list) =>
      (Array.isArray(list) ? list : []).map((d) => {
        if (d.id !== activeId) return d;
        return { ...d, ...(patch || {}), updatedAt: nowIso() };
      })
    );
  };

  const saveActive = () => {
    setStreak(bumpStreakOnSave());
    pushToast("Saved");
  };

  const openDevotional = (id) => {
    setActiveId(id);
    setView("write");
  };

  const deleteDevotional = (id) => {
    setDevotionals((list) => (Array.isArray(list) ? list : []).filter((d) => d.id !== id));
    if (activeId === id) setActiveId("");
  };

  const reflectVerseOfDay = () => {
    if (!active) {
      createAndActivate();
      return;
    }
    updateDevotional({
      verseRef: VERSE_OF_DAY.verseRef,
      verseText: active.verseTextEdited ? active.verseText : VERSE_OF_DAY.verseText,
      title: settings.autoFillEmptyOnTopicTap && !active.title ? VERSE_OF_DAY.suggestedTitle : active.title,
    });
    setView("write");
    pushToast("Verse of the Day applied.");
  };

  const applyMoodVerse = (moodKey) => {
    const v = MOOD_VERSES[moodKey] || MOOD_VERSES.joy;
    if (!v) return;
    if (!active) {
      createAndActivate();
      requestAnimationFrame(() => {
        setDevotionals((list) => {
          const nextList = Array.isArray(list) ? [...list] : [];
          if (!nextList[0]) return nextList;
          nextList[0] = {
            ...nextList[0],
            mood: nextList[0].mood || moodKey,
            verseRef: v.verseRef,
            verseText: nextList[0].verseTextEdited ? nextList[0].verseText : v.verseText,
            updatedAt: nowIso(),
          };
          return nextList;
        });
      });
      setView("write");
      pushToast(`${v.label} verse applied.`);
      return;
    }
    updateDevotional({
      mood: active.mood || moodKey,
      verseRef: v.verseRef,
      verseText: active.verseTextEdited ? active.verseText : v.verseText,
    });
    setView("write");
    pushToast(`${v.label} verse applied.`);
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      <div className={cn("min-h-screen bg-gradient-to-b", THEME_STYLES[settings.theme] || THEME_STYLES.light)}>
        <ToastTicker toast={toast} />

        <div className="max-w-md mx-auto px-4 pt-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">VersedUP</div>
                <div className="text-xs font-bold text-slate-500">(John 15:5)</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1"></div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-extrabold text-slate-600 border border-slate-200 rounded-xl px-3 py-2 bg-white hover:bg-slate-50"
            >
              Logout
            </button>
          </header>

          <main className="mt-6">
            {view === "home" ? (
              <HomeView
                onNew={createAndActivate}
                onLibrary={() => setView("library")}
                onContinue={() => setView(hasActive ? "write" : "home")}
                onReflectVerseOfDay={reflectVerseOfDay}
                hasActive={hasActive}
                streak={streak}
                onApplyMoodVerse={applyMoodVerse}
              />
            ) : null}

            {view === "write" && active ? (
              <WriteView
                devotional={active}
                settings={settings}
                onUpdate={updateDevotional}
                onGoCompile={() => setView("compile")}
                onGoPolish={() => setView("polish")}
                onSaved={saveActive}
                onGoSettings={() => setView("settings")}
                verseCandidates={verseCandidates}
              />
            ) : null}

            {view === "compile" && active ? <CompileView devotional={active} settings={settings} onBackToWrite={() => setView("write")} /> : null}

            {view === "library" ? <LibraryView devotionals={safeDevotionals} onOpen={openDevotional} onDelete={deleteDevotional} /> : null}

            {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} /> : null}
          </main>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-md mx-auto px-4 pb-4">
            <div className="bg-white/55 backdrop-blur-2xl border border-slate-200/70 shadow-[0_18px_60px_-25px_rgba(0,0,0,0.35)] rounded-3xl px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNavCollapsed((v) => !v)}
                  className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center"
                  title={navCollapsed ? "Expand nav" : "Collapse nav"}
                >
                  {navCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <div className={cn("grid gap-2 flex-1", "grid-cols-5")}>
                  <NavButton collapsed={navCollapsed} active={view === "home"} onClick={() => setView("home")} icon={ICONS.nav.home} label="Home" />
                  <NavButton collapsed={navCollapsed} active={view === "write"} onClick={() => setView(hasActive ? "write" : "home")} icon={ICONS.nav.write} label="Write" />
                  <NavButton collapsed={navCollapsed} active={view === "compile"} onClick={() => setView(hasActive ? "compile" : "home")} icon={ICONS.nav.compile} label="Compile" />
                  <NavButton collapsed={navCollapsed} active={view === "library"} onClick={() => setView("library")} icon={Library} label="Library" />
                  <NavButton collapsed={navCollapsed} active={view === "settings"} onClick={() => setView("settings")} icon={Settings} label="Settings" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={createAndActivate}
          className="fixed bottom-28 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center hover:bg-emerald-700 active:scale-[0.985]"
          title="New Entry"
          type="button"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </ToastContext.Provider>
  );
}

/* ---------------- Auth + top-level ---------------- */

function LandingView({ onGetStarted, onViewDemo }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-sky-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 shadow-sm">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="VersedUP" className="h-20 w-auto mx-auto" draggable="false" />
          <h1 className="mt-5 text-2xl font-black text-slate-900 text-center">Rooted in Christ, growing in His fruit.</h1>
          <p className="mt-3 text-sm text-slate-600 text-center">Create devotionals, polish your reflection, and prepare share-ready content.</p>

          <div className="mt-6 grid gap-3">
            <button
              onClick={onGetStarted}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 flex items-center justify-center gap-2"
              type="button"
            >
              <LogIn className="w-4 h-4" />
              Get Started
            </button>
            <button
              onClick={onViewDemo}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
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
  const [name, setName] = useState("user");
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-sky-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        <Card>
          <div className="text-lg font-extrabold text-slate-900">Sign in</div>
          <div className="text-sm text-slate-500 mt-1">Pick a name (used only for greetings).</div>

          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
              placeholder="Your name"
            />

            <div className="flex gap-2">
              <SmallButton onClick={onBack}>Back</SmallButton>
              <SmallButton onClick={() => onContinue({ mode: "user", name })} tone="primary">
                Continue
              </SmallButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ErrorBoundary({ children }) {
  return <>{children}</>;
}

export default function App() {
  const [stage, setStage] = useState(() => (loadSession() ? "app" : "landing"));
  const [session, setSession] = useState(() => loadSession());
  const [starterMood, setStarterMood] = useState("");

  const startDemo = () => {
    const nextSession = { id: crypto.randomUUID(), mode: "guest", name: "Guest", createdAt: nowIso() };
    persistSession(nextSession);
    setSession(nextSession);
    setStarterMood("hopeful");
    setStage("app");
  };

  const handleAuthContinue = (draft) => {
    const nextSession = { id: crypto.randomUUID(), mode: draft.mode, name: draft.name || "user", createdAt: nowIso() };
    persistSession(nextSession);
    setSession(nextSession);
    setStarterMood("");
    setStage("app");
  };

  const logout = () => {
    persistSession(null);
    setSession(null);
    setStarterMood("");
    setStage("landing");
  };

  return (
    <ErrorBoundary>
      {stage === "landing" ? <LandingView onGetStarted={() => setStage("auth")} onViewDemo={startDemo} /> : null}
      {stage === "auth" ? <AuthView onBack={() => setStage("landing")} onContinue={handleAuthContinue} /> : null}
      {stage === "app" ? <AppInner session={session} starterMood={starterMood} onLogout={logout} /> : null}
    </ErrorBoundary>
  );
}
