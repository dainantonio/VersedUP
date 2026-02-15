import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Library,
  Plus,
  Wand2,
  Home,
  Settings,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Image as ImageIcon,
  FileText,
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Save,
  BookOpen,
  Calendar,
  Share2,
  MoreVertical,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Type,
  Palette,
  Globe,
  KeyRound,
} from 'lucide-react';

/* ========== THEME SYSTEM ========== */
const THEMES = {
  lavender: {
    name: 'Lavender',
    appBg: 'bg-gradient-to-br from-slate-50 via-white to-violet-50',
    cardBg: 'bg-white/80',
    navBg: 'bg-white/70',
    border: 'border-slate-200/60',
    heroGradient: 'bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-400',
    accent: 'violet',
    font: 'font-sans',
    text: 'text-slate-800',
    textMuted: 'text-slate-500',
    chipBg: 'bg-violet-50',
    chipText: 'text-violet-700',
    buttonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
    buttonSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  },
  midnight: {
    name: 'Midnight',
    appBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950',
    cardBg: 'bg-slate-900/70',
    navBg: 'bg-slate-950/60',
    border: 'border-slate-700/60',
    heroGradient: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-500',
    accent: 'indigo',
    font: 'font-sans',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    chipBg: 'bg-indigo-950/60',
    chipText: 'text-indigo-200',
    buttonPrimary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    buttonSecondary: 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700',
  },
  parchment: {
    name: 'Parchment',
    appBg: 'bg-gradient-to-br from-amber-50 via-white to-orange-50',
    cardBg: 'bg-white/80',
    navBg: 'bg-white/70',
    border: 'border-amber-200/60',
    heroGradient: 'bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500',
    accent: 'amber',
    font: 'font-serif',
    text: 'text-amber-950',
    textMuted: 'text-amber-700/70',
    chipBg: 'bg-amber-100/60',
    chipText: 'text-amber-900',
    buttonPrimary: 'bg-amber-600 hover:bg-amber-700 text-white',
    buttonSecondary: 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200',
  },
};

const DEFAULT_SETTINGS = {
  themeKey: 'lavender',
  mode: 'system', // 'light' | 'dark' | 'system'
  aiProvider: 'mock', // 'mock' | 'openai' | 'gemini'
  openaiKey: '',
  geminiKey: '',
  language: 'en',
};

/* ========== UTILITIES ========== */
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename, data) {
  downloadTextFile(filename, JSON.stringify(data, null, 2));
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

/* ========== MOCK AI (NO KEYS NEEDED) ========== */
async function mockAiRewrite({ text, goal }) {
  await new Promise((r) => setTimeout(r, 650));
  const prefix =
    goal === 'grammar'
      ? 'Polished: '
      : goal === 'shorten'
        ? 'Shorter: '
        : goal === 'expand'
          ? 'Expanded: '
          : 'Rewritten: ';
  return `${prefix}${text}`.slice(0, 5000);
}

/* ========== OPENAI / GEMINI CLIENTS (OPTIONAL) ========== */
async function openaiRewrite({ apiKey, text, goal }) {
  const system = `You are a helpful writing assistant. Return only the revised text.`;
  const user = `Goal: ${goal}\n\nText:\n${text}`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`OpenAI error: ${msg}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function geminiRewrite({ apiKey, text, goal }) {
  const prompt = `You are a helpful writing assistant. Return only the revised text.\nGoal: ${goal}\n\nText:\n${text}`;
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Gemini error: ${msg}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function aiRewrite(settings, { text, goal }) {
  if (settings.aiProvider === 'openai' && settings.openaiKey) {
    return openaiRewrite({ apiKey: settings.openaiKey, text, goal });
  }
  if (settings.aiProvider === 'gemini' && settings.geminiKey) {
    return geminiRewrite({ apiKey: settings.geminiKey, text, goal });
  }
  return mockAiRewrite({ text, goal });
}

/* ========== COMPONENTS ========== */
function BottomNav({ view, setView, theme }) {
  const items = [
    { key: 'library', icon: Library, label: 'Library' },
    { key: 'create', icon: Plus, label: 'Create' },
    { key: 'polish', icon: Wand2, label: 'Polish' },
    { key: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className={cn('fixed bottom-0 left-0 right-0 border-t', theme.navBg, theme.border, 'backdrop-blur-xl')}>
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-2">
        {items.map((it) => {
          const ActiveIcon = it.icon;
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className={cn(
                'flex flex-col items-center gap-1 py-2 rounded-xl transition',
                active ? cn('font-semibold', theme.text) : theme.textMuted,
                active && `bg-${theme.accent}-50/40`
              )}
            >
              <ActiveIcon className={cn('w-5 h-5', active ? theme.text : theme.textMuted)} />
              <span className="text-[11px]">{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toast({ toast, onClose, theme }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <div
        className={cn(
          'max-w-md w-full rounded-2xl border p-3 shadow-lg backdrop-blur-xl flex items-center justify-between gap-3',
          theme.cardBg,
          theme.border
        )}
      >
        <div className="flex items-center gap-2">
          {isError ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
          <p className={cn('text-sm', theme.text)}>{toast.message}</p>
        </div>
        <button onClick={onClose} className={cn('p-1 rounded-lg', theme.textMuted, 'hover:opacity-80')}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ========== VIEWS ========== */
function LibraryView({ devotionals, onSelect, onDelete, themeKey }) {
  const theme = THEMES[themeKey];
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest'); // newest | oldest | starred
  const [filter, setFilter] = useState('all'); // all | draft | published

  const items = useMemo(() => {
    let list = devotionals.slice();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) => (d.title || '').toLowerCase().includes(q) || (d.body || '').toLowerCase().includes(q));
    }
    if (filter !== 'all') list = list.filter((d) => d.status === filter);
    if (sort === 'newest') list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (sort === 'oldest') list.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    if (sort === 'starred') list.sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)));
    return list;
  }, [devotionals, query, sort, filter]);

  return (
    <div className="space-y-4">
      <div className={cn('rounded-2xl border p-4 shadow-sm', theme.cardBg, theme.border)}>
        <h2 className={cn('text-lg font-semibold flex items-center gap-2', theme.text)}>
          <Library className="w-5 h-5" /> Library
        </h2>
        <p className={cn('text-sm mt-1', theme.textMuted)}>Search, sort, and manage your devotionals.</p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <div className="relative">
            <Search className={cn('w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2', theme.textMuted)} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className={cn(
                'w-full rounded-xl border px-9 py-2 text-sm outline-none',
                theme.cardBg,
                theme.border,
                theme.text
              )}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={cn('text-xs', theme.textMuted)}>Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm', theme.cardBg, theme.border, theme.text)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="starred">Starred</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={cn('text-xs', theme.textMuted)}>Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={cn('w-full rounded-xl border px-3 py-2 text-sm', theme.cardBg, theme.border, theme.text)}
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className={cn('rounded-2xl border p-6 text-center', theme.cardBg, theme.border)}>
            <p className={cn('text-sm', theme.textMuted)}>No devotionals found.</p>
          </div>
        )}

        {items.map((d) => (
          <div key={d.id} className={cn('rounded-2xl border p-4 shadow-sm', theme.cardBg, theme.border)}>
            <div className="flex items-start justify-between gap-3">
              <button onClick={() => onSelect(d)} className="text-left flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn('font-semibold', theme.text)}>{d.title || 'Untitled'}</h3>
                  {d.starred && <Star className="w-4 h-4 text-amber-400" />}
                </div>
                <p className={cn('text-xs mt-1', theme.textMuted)}>
                  Updated {formatDate(d.updatedAt)} • {d.status}
                </p>
              </button>

              <button
                onClick={() => onDelete(d)}
                className={cn('p-2 rounded-xl hover:opacity-80 transition', theme.buttonSecondary)}
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {d.body && (
              <p className={cn('text-sm mt-3 line-clamp-2', theme.textMuted)}>
                {d.body}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateView({ activeDevotional, updateDevotional, onSave, themeKey, settings }) {
  const theme = THEMES[themeKey];
  const [busy, setBusy] = useState(false);

  const runAi = async (goal) => {
    setBusy(true);
    try {
      const revised = await aiRewrite(settings, { text: activeDevotional.body || '', goal });
      updateDevotional('body', revised);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn('rounded-2xl border p-4 shadow-sm', theme.cardBg, theme.border)}>
        <h2 className={cn('text-lg font-semibold flex items-center gap-2', theme.text)}>
          <Edit3 className="w-5 h-5" /> Create
        </h2>
        <p className={cn('text-sm mt-1', theme.textMuted)}>Write your devotional. Optionally polish with AI.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className={cn('text-xs', theme.textMuted)}>Title</label>
            <input
              value={activeDevotional.title}
              onChange={(e) => updateDevotional('title', e.target.value)}
              placeholder="Title…"
              className={cn('w-full rounded-xl border px-3 py-2 text-sm outline-none', theme.cardBg, theme.border, theme.text)}
            />
          </div>

          <div>
            <label className={cn('text-xs', theme.textMuted)}>Body</label>
            <textarea
              value={activeDevotional.body}
              onChange={(e) => updateDevotional('body', e.target.value)}
              placeholder="Write here…"
              rows={10}
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              className={cn(
                'w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none',
                theme.cardBg,
                theme.border,
                theme.text
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => runAi('grammar')}
              className={cn('px-3 py-2 rounded-xl text-sm flex items-center gap-2', theme.buttonSecondary)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Fix grammar
            </button>
            <button
              disabled={busy}
              onClick={() => runAi('shorten')}
              className={cn('px-3 py-2 rounded-xl text-sm flex items-center gap-2', theme.buttonSecondary)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
              Shorten
            </button>
            <button
              disabled={busy}
              onClick={() => runAi('expand')}
              className={cn('px-3 py-2 rounded-xl text-sm flex items-center gap-2', theme.buttonSecondary)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Expand
            </button>
          </div>

          <button onClick={onSave} className={cn('w-full py-2 rounded-xl text-sm font-semibold', theme.buttonPrimary)}>
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function PolishView({ devotional, updateDevotional, onNext, themeKey, settings }) {
  const theme = THEMES[themeKey];
  const [busy, setBusy] = useState(false);

  const rewrite = async () => {
    setBusy(true);
    try {
      const revised = await aiRewrite(settings, { text: devotional.body || '', goal: 'rewrite' });
      updateDevotional('body', revised);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cn('rounded-2xl border p-4 shadow-sm', theme.cardBg, theme.border)}>
        <h2 className={cn('text-lg font-semibold flex items-center gap-2', theme.text)}>
          <Wand2 className="w-5 h-5" /> Polish
        </h2>
        <p className={cn('text-sm mt-1', theme.textMuted)}>Refine your devotional, then publish/export.</p>

        <div className="mt-4 space-y-3">
          <textarea
            value={devotional.body}
            onChange={(e) => updateDevotional('body', e.target.value)}
            rows={12}
            spellCheck={true}
            autoCorrect="on"
            autoCapitalize="sentences"
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none',
              theme.cardBg,
              theme.border,
              theme.text
            )}
          />

          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={rewrite}
              className={cn('flex-1 px-3 py-2 rounded-xl text-sm flex items-center justify-center gap-2', theme.buttonSecondary)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Rewrite
            </button>
            <button
              onClick={onNext}
              className={cn('flex-1 px-3 py-2 rounded-xl text-sm font-semibold', theme.buttonPrimary)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ settings, setSettings, themeKey, setThemeKey, theme, onExport, onImport }) {
  const [file, setFile] = useState(null);

  const onFilePick = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const doImport = async () => {
    if (!file) return;
    const text = await readFileAsText(file);
    onImport(text);
    setFile(null);
  };

  return (
    <div className="space-y-4">
      <div className={cn('rounded-2xl border p-4 shadow-sm', theme.cardBg, theme.border)}>
        <h2 className={cn('text-lg font-semibold flex items-center gap-2', theme.text)}>
          <Settings className="w-5 h-5" /> Settings
        </h2>
        <p className={cn('text-sm mt-1', theme.textMuted)}>Theme, AI provider, and data tools.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className={cn('text-xs', theme.textMuted)}>Theme</label>
            <select
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value)}
              className={cn('w-full rounded-xl border px-3 py-2 text-sm', theme.cardBg, theme.border, theme.text)}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('text-xs', theme.textMuted)}>AI Provider</label>
            <select
              value={settings.aiProvider}
              onChange={(e) => setSettings((s) => ({ ...s, aiProvider: e.target.value }))}
              className={cn('w-full rounded-xl border px-3 py-2 text-sm', theme.cardBg, theme.border, theme.text)}
            >
              <option value="mock">Mock (no key)</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
            </select>
            <p className={cn('text-xs mt-1', theme.textMuted)}>
              Spell/grammar corrections are best with an API key. Without a key, “Mock” won’t reliably fix spelling.
            </p>
          </div>

          {settings.aiProvider === 'openai' && (
            <div>
              <label className={cn('text-xs', theme.textMuted)}>OpenAI API Key</label>
              <input
                value={settings.openaiKey}
                onChange={(e) => setSettings((s) => ({ ...s, openaiKey: e.target.value }))}
                placeholder="sk-..."
                className={cn('w-full rounded-xl border px-3 py-2 text-sm outline-none', theme.cardBg, theme.border, theme.text)}
              />
            </div>
          )}

          {settings.aiProvider === 'gemini' && (
            <div>
              <label className={cn('text-xs', theme.textMuted)}>Gemini API Key</label>
              <input
                value={settings.geminiKey}
                onChange={(e) => setSettings((s) => ({ ...s, geminiKey: e.target.value }))}
                placeholder="AIza..."
                className={cn('w-full rounded-xl border px-3 py-2 text-sm outline-none', theme.cardBg, theme.border, theme.text)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={onExport} className={cn('px-3 py-2 rounded-xl text-sm flex items-center justify-center gap-2', theme.buttonSecondary)}>
              <Download className="w-4 h-4" />
              Export
            </button>
            <label className={cn('px-3 py-2 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer', theme.buttonSecondary)}>
              <Upload className="w-4 h-4" />
              Import
              <input type="file" accept="application/json" className="hidden" onChange={onFilePick} />
            </label>
          </div>

          {file && (
            <button onClick={doImport} className={cn('w-full py-2 rounded-xl text-sm font-semibold', theme.buttonPrimary)}>
              Import Selected File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== MAIN APP ========== */
const STORAGE_KEY = 'versedup_v1';

function loadAppState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      devotionals: [],
      settings: DEFAULT_SETTINGS,
    };
  }
  return safeJsonParse(raw, { devotionals: [], settings: DEFAULT_SETTINGS });
}

function saveAppState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function App() {
  const initial = useMemo(() => loadAppState(), []);
  const [devotionals, setDevotionals] = useState(initial.devotionals);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(initial.settings || {}) });
  const [themeKey, setThemeKey] = useState(initial.settings?.themeKey || DEFAULT_SETTINGS.themeKey);

  const [view, setView] = useState('library'); // library | create | polish | settings
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);

  const theme = THEMES[themeKey] || THEMES.lavender;

  useEffect(() => {
    const state = { devotionals, settings: { ...settings, themeKey } };
    saveAppState(state);
  }, [devotionals, settings, themeKey]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2600);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const activeDevotional = useMemo(() => {
    if (!activeId) {
      return { id: uuid(), title: '', body: '', status: 'draft', starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
    return devotionals.find((d) => d.id === activeId) || { id: activeId, title: '', body: '', status: 'draft', starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }, [activeId, devotionals]);

  const handleOpen = (d) => {
    setActiveId(d.id);
    setView('create');
  };

  const handleDelete = (d) => {
    setDevotionals((list) => list.filter((x) => x.id !== d.id));
    if (activeId === d.id) {
      setActiveId(null);
      setView('library');
    }
    setToast({ message: 'Deleted', type: 'success' });
  };

  const handleUpdateActive = (key, value) => {
    const now = new Date().toISOString();
    const next = { ...activeDevotional, [key]: value, updatedAt: now };
    setActiveId(next.id);
    setDevotionals((list) => {
      const idx = list.findIndex((x) => x.id === next.id);
      if (idx === -1) return [next, ...list];
      const copy = list.slice();
      copy[idx] = next;
      return copy;
    });
  };

  const onExport = () => downloadJson('versedup-export.json', { devotionals, settings: { ...settings, themeKey } });

  const onImport = (text) => {
    const data = safeJsonParse(text, null);
    if (!data || !Array.isArray(data.devotionals)) {
      setToast({ message: 'Invalid import file', type: 'error' });
      return;
    }
    setDevotionals(data.devotionals);
    setSettings({ ...DEFAULT_SETTINGS, ...(data.settings || {}) });
    setThemeKey(data.settings?.themeKey || DEFAULT_SETTINGS.themeKey);
    setToast({ message: 'Imported', type: 'success' });
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
        {view === 'create' && (
          <CreateView
            activeDevotional={activeDevotional}
            updateDevotional={handleUpdateActive}
            onSave={() => {
              handleUpdateActive('status', 'draft');
              setView('polish');
              setToast({ message: 'Saved', type: 'success' });
            }}
            themeKey={themeKey}
            settings={settings}
          />
        )}
        {view === 'polish' && (
          <PolishView
            devotional={activeDevotional}
            updateDevotional={handleUpdateActive}
            onNext={() => {
              handleUpdateActive('status', 'published');
              setView('library');
              setToast({ message: 'Published', type: 'success' });
            }}
            themeKey={themeKey}
            settings={settings}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            theme={theme}
            onExport={onExport}
            onImport={onImport}
          />
        )}
      </main>

      <BottomNav view={view} setView={setView} theme={theme} />
      <Toast toast={toast} onClose={() => setToast(null)} theme={theme} />
    </div>
  );
}
