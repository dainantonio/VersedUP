import React, { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  Library,
  Loader2,
  Mail,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  Video,
  Wand2,
  X,
} from "lucide-react";

/**
 * VersedUP (single-file app)
 * - Write (scripture + title + reflection + prayer + questions)
 * - AI: Fix, Structure (preview/apply per section), Shorten/Lengthen
 * - Compile: platform text + TikTok Script editor + one-screen PNG export
 * - Library + Settings
 */

const APP_ID = "versedup_v1";
const STORAGE_SETTINGS = `${APP_ID}_settings`;
const STORAGE_DEVOTIONALS = `${APP_ID}_devotionals`;

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
  { id: "strong", label: "Strength" },
  { id: "peace", label: "Peace" },
];

const BIBLE_VERSIONS = ["KJV", "NLT", "ESV", "NKJV"];

const DEFAULT_SETTINGS = {
  username: "",
  theme: "light",
  aiProvider: "mock", // mock | openai | gemini
  openaiKey: "",
  geminiKey: "",
  defaultBibleVersion: "KJV",
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

function createDevotional() {
  return {
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    mood: "",
    verseRef: "",
    bibleVersion: "",
    verseText: "",
    verseTextEdited: false, // override indicator
    title: "",
    reflection: "",
    prayer: "",
    questions: "",
    // platform versions
    tiktokScript: "",
    instagramCaption: "",
    genericExport: "",
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

/* ---------------- AI (OpenAI/Gemini optional; Mock fallback) ---------------- */

function buildMoodHint(mood) {
  if (!mood) return "";
  const map = {
    grateful: "Tone: grateful, joyful, thankful.",
    anxious: "Tone: calm, reassuring, comforting for anxiety.",
    strong: "Tone: bold, strengthening, empowering.",
    peace: "Tone: peaceful, gentle, grounded.",
  };
  return map[mood] || "";
}

async function openAiResponseText({ apiKey, prompt }) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: prompt,
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();

  // Preferred: `output_text` (provided by Responses API)
  if (typeof data.output_text === "string" && data.output_text.length) return data.output_text;

  // Fallback parsing (just in case)
  const parts =
    data.output?.flatMap((item) => item.content || [])?.filter((c) => c.type === "output_text") || [];
  return parts.map((p) => p.text).join("") || "";
}

async function geminiGenerate({ apiKey, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function ai(settings, prompt) {
  const provider = settings.aiProvider;

  // OpenAI
  if (provider === "openai" && settings.openaiKey) {
    try {
      return await openAiResponseText({ apiKey: settings.openaiKey, prompt });
    } catch (e) {
      console.warn("OpenAI failed; falling back to mock:", e);
      return await ai({ ...settings, aiProvider: "mock" }, prompt);
    }
  }

  // Gemini
  if (provider === "gemini" && settings.geminiKey) {
    try {
      return await geminiGenerate({ apiKey: settings.geminiKey, prompt });
    } catch (e) {
      console.warn("Gemini failed; falling back to mock:", e);
      return await ai({ ...settings, aiProvider: "mock" }, prompt);
    }
  }

  // Mock
  await new Promise((r) => setTimeout(r, 650));
  return `(${provider || "mock"}) ${prompt}`.slice(0, 3000);
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
  if (!parsed) {
    return { title: "", reflection: raw, prayer: "", questions: "" };
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
      ? `Shorten this while keeping meaning. ${buildMoodHint(mood)} Return only the shortened text.\n\n${text}`
      : `Lengthen this with more depth and clarity. ${buildMoodHint(mood)} Return only the expanded text.\n\n${text}`;
  return ai(settings, prompt);
}

async function aiTikTokScript(settings, { verseRef, verseText, reflection, mood, baseScript, mode }) {
  const style =
    "Write a TikTok script with: Hook (1 line), Scripture reference, 4-8 short punchy lines, soft CTA (save/share), optional 2-4 hashtags. Use line breaks. Keep under 2200 chars.";
  const base =
    mode === "improve"
      ? `Improve this existing TikTok script without changing the meaning too much:\n\n${baseScript}`
      : `Source content:\nVerse: ${verseRef}\nVerse text:\n${verseText}\nReflection:\n${reflection}`;
  const prompt = `${style}\n${buildMoodHint(mood)}\n\n${base}\n\nReturn only the script text.`;
  return ai(settings, prompt);
}

/* ---------------- UI primitives ---------------- */

function Card({ children }) {
  return <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">{children}</div>;
}

function PrimaryButton({ children, onClick, disabled, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition",
        disabled && "opacity-50 cursor-not-allowed"
      )}
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
        active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function SmallButton({ children, onClick, disabled, icon: Icon, tone = "neutral" }) {
  const base = "px-3 py-2 rounded-xl text-xs font-extrabold border transition flex items-center gap-2 justify-center";
  const variants = {
    neutral: "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
    primary: "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-white border-slate-200 text-red-600 hover:bg-red-50",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={cn(base, variants[tone], disabled && "opacity-50 cursor-not-allowed")}>
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

/* ---------------- Modals ---------------- */

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="font-extrabold text-slate-900">{title}</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------- Views ---------------- */

function HomeView({ onNew, onLibrary }) {
  return (
    <div className="space-y-6 pb-28">
      <div>
        <div className="text-sm text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        <div className="text-3xl font-extrabold text-slate-900 mt-1">Good Evening</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onNew} className="bg-white rounded-3xl border border-slate-200 p-5 text-left hover:bg-slate-50 transition">
          <div className="font-extrabold text-slate-900">New Entry</div>
          <div className="text-xs text-slate-500 mt-1">Start fresh</div>
        </button>
        <button onClick={onLibrary} className="bg-white rounded-3xl border border-slate-200 p-5 text-left hover:bg-slate-50 transition">
          <div className="font-extrabold text-slate-900">Library</div>
          <div className="text-xs text-slate-500 mt-1">View archive</div>
        </button>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-slate-900">Verse of the Day</div>
          <div className="text-xs font-bold text-emerald-700">Daily</div>
        </div>
        <div className="mt-3 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-3xl p-6 text-white">
          <div className="text-2xl leading-snug font-semibold">“The Lord is my shepherd; I shall not want...”</div>
          <div className="mt-4 text-xs font-extrabold tracking-wider opacity-90">PSALM 23:1-2</div>
          <button onClick={onNew} className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/25 text-xs font-extrabold">
            Reflect on this
          </button>
        </div>
      </Card>
    </div>
  );
}

function WriteView({ devotional, settings, onUpdate, onGoCompile, onGoPolish }) {
  const [busy, setBusy] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureDraft, setStructureDraft] = useState({ title: "", reflection: "", prayer: "", questions: "" });
  const [apply, setApply] = useState({ title: true, reflection: true, prayer: true, questions: true });
  const [fetching, setFetching] = useState(false);

  const version = devotional.bibleVersion || settings.defaultBibleVersion || "KJV";

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

  return (
    <div className="space-y-6 pb-28">
      <div>
        <div className="text-sm text-slate-500">Journal</div>
        <div className="text-xs font-bold text-slate-400 mt-1">CAPTURE WHAT GOD IS SPEAKING</div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {MOODS.map((m) => (
          <Chip key={m.id} active={devotional.mood === m.id} onClick={() => onUpdate({ mood: devotional.mood === m.id ? "" : m.id })}>
            {m.label}
          </Chip>
        ))}
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-extrabold text-slate-400">TITLE (OPTIONAL)</label>
            <input
              value={devotional.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Give it a holy title..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-200"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> VERSE
              </div>
              <SmallButton onClick={() => window.open(youVersionSearchUrl(devotional.verseRef), "_blank", "noopener,noreferrer")} disabled={!devotional.verseRef}>
                Open YouVersion
              </SmallButton>
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
              <SmallButton onClick={doFetch} disabled={!devotional.verseRef || fetching} icon={fetching ? Loader2 : null} tone="primary">
                {fetching ? "..." : "FETCH"}
              </SmallButton>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-400">VERSE TEXT</label>
              <textarea
                value={devotional.verseText}
                onChange={(e) => onUpdate({ verseText: e.target.value, verseTextEdited: true })}
                placeholder={
                  isKjv(version)
                    ? "Fetch KJV to auto-fill..."
                    : "Full text opens in YouVersion (free-for-now). Paste text you have rights to use."
                }
                rows={4}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 bg-white resize-none"
              />
              {devotional.verseTextEdited ? <div className="mt-2 text-[11px] font-bold text-amber-700">Edited override</div> : null}
            </div>
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-400">REFLECTION / BODY</label>
            <textarea
              value={devotional.reflection}
              onChange={(e) => onUpdate({ reflection: e.target.value })}
              placeholder="Start writing..."
              rows={8}
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <SmallButton onClick={doFixReflection} disabled={busy} icon={Sparkles}>
                Fix grammar
              </SmallButton>
              <SmallButton onClick={doStructure} disabled={busy} icon={Wand2}>
                Structure
              </SmallButton>
              <SmallButton onClick={() => void doLength("shorten")} disabled={busy} icon={ChevronLeft}>
                Shorten
              </SmallButton>
              <SmallButton onClick={() => void doLength("lengthen")} disabled={busy} icon={ChevronRight}>
                Lengthen
              </SmallButton>
            </div>
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

      <PrimaryButton onClick={onGoPolish} icon={Save}>
        Save & Polish
      </PrimaryButton>
      <PrimaryButton onClick={onGoCompile} icon={Share2}>
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
              <button onClick={() => onOpen(d.id)} className="text-left flex-1">
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
  return (
    <div className="space-y-6 pb-28">
      <Card>
        <div className="text-lg font-extrabold text-slate-900">Settings</div>
        <div className="text-sm text-slate-500 mt-1">AI keys, defaults, export.</div>
      </Card>

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
              Real grammar/spelling correction requires an API key. Without a key, output is a mock fallback.
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

/* ---------------- Compile + TikTok Script + PNG export ---------------- */

function compileForPlatform(platform, d, settings) {
  const verseLine = d.verseRef ? `“${d.verseText || ""}”\n— ${d.verseRef}\n\n` : "";
  const titleLine = d.title ? `${d.title}\n\n` : "";
  const body = d.reflection || "";
  const prayer = d.prayer ? `\n\nPrayer:\n${d.prayer}` : "";
  const questions = d.questions ? `\n\nQuestions:\n${d.questions}` : "";

  if (platform === "tiktok") {
    return d.tiktokScript || `POV: You needed this today ✨\n\n${d.verseRef}\n\n${body}\n\nSave this for later ❤️`;
  }
  if (platform === "instagram") {
    return `${titleLine}${verseLine}${body}${questions}${prayer}\n\n#Faith #Devotional`;
  }
  if (platform === "youtube") {
    return `${d.title || "Daily Devotional"} | ${d.verseRef || ""}\n\n${body}`;
  }
  if (platform === "email") {
    return `Subject: ${d.verseRef || "Encouragement"}\n\nHi friend,\n\n${verseLine}${body}${prayer}\n\nBlessings,\n${settings.username || ""}`.trim();
  }
  return `${titleLine}${verseLine}${body}${questions}${prayer}`.trim();
}

function CompileView({ devotional, settings, onUpdate }) {
  const [platform, setPlatform] = useState("tiktok");
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
          <div className="text-sm text-slate-500 mt-1">Export for socials.</div>
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
          { id: "youtube", label: "YouTube" },
          { id: "email", label: "Email" },
          { id: "generic", label: "Generic" },
        ].map((p) => (
          <Chip key={p.id} active={platform === p.id} onClick={() => setPlatform(p.id)}>
            {p.label}
          </Chip>
        ))}
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

      <Card>
        <div className="flex items-center justify-between">
          <div className="text-xs font-extrabold text-slate-500">OUTPUT</div>
          {platform === "tiktok" ? (
            <SmallButton onClick={() => setScriptOpen(true)} icon={Wand2} tone="neutral">
              TikTok Script
            </SmallButton>
          ) : null}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-200 resize-none"
        />
        <div className="mt-2 text-xs font-bold text-slate-500">
          {text.length} / {limit}
        </div>
      </Card>

      {scriptOpen ? (
        <TikTokScriptModal devotional={devotional} settings={settings} onClose={() => setScriptOpen(false)} onUpdate={onUpdate} />
      ) : null}

      {exportOpen ? <TikTokExportModal devotional={devotional} settings={settings} onClose={() => setExportOpen(false)} /> : null}
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
          <SmallButton onClick={() => void shorten()} disabled={busy} icon={ChevronLeft}>
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
                    {includeTitle ? <div className="text-6xl font-extrabold tracking-tight">{devotional.title || "Untitled Devotional"}</div> : null}
                    {includeDate ? <div className="text-2xl font-semibold text-slate-600">{new Date(devotional.updatedAt || devotional.createdAt).toLocaleDateString()}</div> : null}
                  </div>
                )}

                {includeScripture ? (
                  <div className="rounded-3xl border border-slate-200 p-10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-2xl font-extrabold">{devotional.verseRef || "Scripture"}</div>
                      <div className="text-xl font-semibold text-slate-600">{devotional.bibleVersion || settings.defaultBibleVersion || "KJV"}</div>
                    </div>
                    {devotional.verseText ? <div className="text-3xl leading-snug mt-6 whitespace-pre-wrap text-slate-600">{devotional.verseText}</div> : null}
                  </div>
                ) : null}

                <div className="text-3xl leading-snug whitespace-pre-wrap">{devotional.tiktokScript || compileForPlatform("tiktok", devotional, settings)}</div>
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

export default function App() {
  const [settings, setSettings] = useState(() => {
  const raw = localStorage.getItem(STORAGE_SETTINGS);
  const parsed = safeParseJson(raw, DEFAULT_SETTINGS);
  return parsed && typeof parsed === "object"
    ? { ...DEFAULT_SETTINGS, ...parsed }
    : DEFAULT_SETTINGS;
});
  const [devotionals, setDevotionals] = useState(() => {
  const raw = localStorage.getItem(STORAGE_DEVOTIONALS);
  const parsed = safeParseJson(raw, []);
  return Array.isArray(parsed) ? parsed : [];
});
  const [activeId, setActiveId] = useState(() => devotionals?.[0]?.id || "");
  const [view, setView] = useState("home"); // home | write | polish | compile | library | settings

  const active = useMemo(() => devotionals.find((d) => d.id === activeId) || null, [devotionals, activeId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DEVOTIONALS, JSON.stringify(devotionals));
  }, [devotionals]);

  const updateSettings = (patch) => setSettings((s) => ({ ...s, ...patch }));

  const updateDevotional = (patch) => {
    if (!active) return;
    setDevotionals((list) => list.map((d) => (d.id === active.id ? { ...d, ...patch, updatedAt: nowIso() } : d)));
  };

  const newEntry = () => {
    const d = createDevotional();
    d.bibleVersion = settings.defaultBibleVersion || "KJV";
    setDevotionals((list) => [d, ...list]);
    setActiveId(d.id);
    setView("write");
  };

  const openEntry = (id) => {
    setActiveId(id);
    setView("write");
  };

  const deleteEntry = (id) => {
    setDevotionals((list) => list.filter((d) => d.id !== id));
    if (activeId === id) {
      setActiveId("");
      setView("home");
    }
  };

  const reset = () => {
    if (!confirm("Reset local data?")) return;
    localStorage.removeItem(STORAGE_SETTINGS);
    localStorage.removeItem(STORAGE_DEVOTIONALS);
    setSettings(DEFAULT_SETTINGS);
    setDevotionals([]);
    setActiveId("");
    setView("home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 to-slate-50">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="VersedUP" className="h-14 w-auto object-contain" draggable="false" />
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 pt-6">
        {view === "home" ? <HomeView onNew={newEntry} onLibrary={() => setView("library")} /> : null}

        {view === "write" && active ? (
          <WriteView devotional={active} settings={settings} onUpdate={updateDevotional} onGoCompile={() => setView("compile")} onGoPolish={() => setView("polish")} />
        ) : null}

        {view === "polish" && active ? <PolishView devotional={active} /> : null}

        {view === "compile" && active ? <CompileView devotional={active} settings={settings} onUpdate={updateDevotional} /> : null}

        {view === "library" ? <LibraryView devotionals={devotionals} onOpen={openEntry} onDelete={deleteEntry} /> : null}

        {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} onReset={reset} /> : null}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="grid grid-cols-5 gap-2">
            <NavButton active={view === "home"} onClick={() => setView("home")} icon={PenTool} label="Home" />
            <NavButton active={view === "write"} onClick={() => setView(active ? "write" : "home")} icon={PenTool} label="Write" />
            <NavButton active={view === "compile"} onClick={() => setView(active ? "compile" : "home")} icon={Share2} label="Compile" />
            <NavButton active={view === "library"} onClick={() => setView("library")} icon={Library} label="Library" />
            <NavButton active={view === "settings"} onClick={() => setView("settings")} icon={Settings} label="Settings" />
          </div>
        </div>
      </div>

      <button
        onClick={newEntry}
        className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center hover:bg-emerald-700"
        title="New Entry"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl p-2 transition",
        active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-slate-800"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-extrabold">{label}</span>
    </button>
  );
}
