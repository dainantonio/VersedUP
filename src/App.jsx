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
  ScanLine,
  Sparkles,
  Mail,
  MessageSquareText,
  Share2,
  Facebook,
  Twitter,
} from "lucide-react";

/**
 * Centralized icon mapping constants (enforced)
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

const SOCIALS = Object.freeze({
  facebook: {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
  },
  x: {
    key: "x",
    label: "Twitter/X",
    Icon: Twitter,
  },
  tiktok: {
    key: "tiktok",
    label: "TikTok",
    Icon: Share2,
  },
});

/**
 * Utility: safe clipboard copy with fallback
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Utility: open a URL in a new tab/window
 */
function openNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildXIntentUrl({ text, url }) {
  const params = new URLSearchParams();
  if (text) params.set("text", text);
  if (url) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function buildFacebookShareUrl({ url }) {
  const params = new URLSearchParams();
  params.set("u", url || window.location.href);
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * TikTok upload endpoint. TikTok doesn’t accept caption prefill via URL in a stable/public way.
 * Requirement: open upload and auto-copy caption.
 */
function buildTikTokUploadUrl() {
  return "https://www.tiktok.com/upload";
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");

  // --- App state (existing) ---
  const [title, setTitle] = useState("Untitled");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [compiledCaption, setCompiledCaption] = useState("");
  const [compiledImageDataUrl, setCompiledImageDataUrl] = useState("");
  const [compileError, setCompileError] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  // Sticky share tray state
  const [showShareTray, setShowShareTray] = useState(false);
  const [shareNotice, setShareNotice] = useState("");

  // Refs
  const compilePreviewRef = useRef(null);

  // Derived/share payload
  const sharePayload = useMemo(() => {
    const captionParts = [];
    if (title?.trim()) captionParts.push(title.trim());
    if (author?.trim()) captionParts.push(`by ${author.trim()}`);
    if (content?.trim()) captionParts.push(content.trim());
    const caption = captionParts.join("\n\n").trim();

    // Prefer a stable URL when sharing. If app is SPA, use current location.
    const shareUrl = window.location.href;

    return { caption, shareUrl };
  }, [title, author, content]);

  useEffect(() => {
    const onScroll = () => {
      // Show share tray when user is on Compile tab and scrolls near bottom
      if (activeTab !== "compile") {
        setShowShareTray(false);
        return;
      }
      const scrolled =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 240;
      setShowShareTray(scrolled);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeTab]);

  // --- Existing navigation UI uses centralized icons ---
  const NavHomeIcon = ICONS.nav.home;
  const NavWriteIcon = ICONS.nav.write;
  const NavCompileIcon = ICONS.nav.compile;

  // --- Existing compile action icons uses centralized icons ---
  const MakeShareReadyIcon = ICONS.actions.makeShareReady;
  const CompileForSocialsIcon = ICONS.actions.compileForSocials;
  const ShareNowIcon = ICONS.actions.shareNow;

  async function handleMakeShareReady() {
    // This function may have existed; keeping behavior minimal but consistent.
    // Typically: generate caption from content. We already have sharePayload.
    setCompiledCaption(sharePayload.caption);
    setShareNotice("Share-ready caption prepared.");
    setTimeout(() => setShareNotice(""), 2200);
  }

  async function handleCompileForSocials() {
    setCompileError("");
    setIsCompiling(true);
    try {
      // Ensure caption is available
      const caption = sharePayload.caption;
      setCompiledCaption(caption);

      // Generate image from preview area (existing behavior)
      if (!compilePreviewRef.current) {
        throw new Error("Nothing to compile. Preview not found.");
      }
      const dataUrl = await toPng(compilePreviewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      setCompiledImageDataUrl(dataUrl);

      setShareNotice("Compiled for socials.");
      setTimeout(() => setShareNotice(""), 2200);
    } catch (e) {
      setCompileError(e?.message || "Failed to compile.");
    } finally {
      setIsCompiling(false);
    }
  }

  async function handleCopyCaption() {
    const ok = await copyToClipboard(compiledCaption || sharePayload.caption);
    setShareNotice(ok ? "Caption copied." : "Copy failed.");
    setTimeout(() => setShareNotice(""), 2200);
  }

  function handleEmail() {
    const subject = encodeURIComponent(title || "Sharing from VersedUP");
    const body = encodeURIComponent(compiledCaption || sharePayload.caption);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleText() {
    const body = encodeURIComponent(compiledCaption || sharePayload.caption);
    window.location.href = `sms:&body=${body}`;
  }

  /**
   * Direct social actions
   * - Facebook: open share + copy caption
   * - X: open intent with caption
   * - TikTok: open upload + copy caption
   */
  async function handleSocialShare(platformKey) {
    const caption = (compiledCaption || sharePayload.caption || "").trim();
    const shareUrl = sharePayload.shareUrl;

    if (platformKey === SOCIALS.facebook.key) {
      // Facebook sharer uses URL; copy caption for paste
      await copyToClipboard(caption);
      openNewTab(buildFacebookShareUrl({ url: shareUrl }));
      setShareNotice("Facebook opened. Caption copied.");
      setTimeout(() => setShareNotice(""), 2400);
      return;
    }

    if (platformKey === SOCIALS.x.key) {
      // X supports prefill in URL
      openNewTab(buildXIntentUrl({ text: caption, url: shareUrl }));
      setShareNotice("Twitter/X opened.");
      setTimeout(() => setShareNotice(""), 2400);
      return;
    }

    if (platformKey === SOCIALS.tiktok.key) {
      // TikTok upload; copy caption for paste
      await copyToClipboard(caption);
      openNewTab(buildTikTokUploadUrl());
      setShareNotice("TikTok upload opened. Caption copied.");
      setTimeout(() => setShareNotice(""), 2400);
      return;
    }
  }

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/75 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">
              VersedUP
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeTab === "home"
                  ? "bg-zinc-800/70"
                  : "hover:bg-zinc-900/60"
              }`}
              type="button"
            >
              <NavHomeIcon className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => setActiveTab("write")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeTab === "write"
                  ? "bg-zinc-800/70"
                  : "hover:bg-zinc-900/60"
              }`}
              type="button"
            >
              <NavWriteIcon className="h-4 w-4" />
              Write
            </button>
            <button
              onClick={() => setActiveTab("compile")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeTab === "compile"
                  ? "bg-zinc-800/70"
                  : "hover:bg-zinc-900/60"
              }`}
              type="button"
            >
              <NavCompileIcon className="h-4 w-4" />
              Compile
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* HOME */}
        {activeTab === "home" && (
          <section className="space-y-5">
            <h1 className="text-2xl font-semibold">Home</h1>
            <p className="text-zinc-300">
              Create, compile, and share your writing.
            </p>
          </section>
        )}

        {/* WRITE */}
        {activeTab === "write" && (
          <section className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Write</h1>
                <p className="text-zinc-300">
                  Draft something worth sharing.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm text-zinc-300">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  placeholder="Your title"
                />

                <label className="block text-sm text-zinc-300">Author</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  placeholder="Your name"
                />

                <label className="block text-sm text-zinc-300">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[260px] w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  placeholder="Write here..."
                />
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide">
                      Live preview
                    </h2>
                    <span className="text-xs text-zinc-400">
                      What you write is what you compile.
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="text-lg font-semibold">{title}</div>
                    {author?.trim() ? (
                      <div className="text-sm text-zinc-400">by {author}</div>
                    ) : null}
                    <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                      {content || "Start writing..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* COMPILE */}
        {activeTab === "compile" && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold">Compile</h1>
              <p className="text-zinc-300">
                Turn your writing into shareable content.
              </p>
            </div>

            {/* SOCIAL SHARE section near the top (discoverability) */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold tracking-widest text-zinc-400">
                    SOCIAL SHARE
                  </div>
                  <div className="text-sm text-zinc-200">
                    Share directly to your socials. TikTok will open upload and
                    copy your caption.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSocialShare(SOCIALS.facebook.key)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                >
                  <SOCIALS.facebook.Icon className="h-4 w-4" />
                  Facebook
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialShare(SOCIALS.x.key)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                >
                  <SOCIALS.x.Icon className="h-4 w-4" />
                  Twitter/X
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialShare(SOCIALS.tiktok.key)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                >
                  <SOCIALS.tiktok.Icon className="h-4 w-4" />
                  TikTok
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-400">
                Tip: For Facebook/TikTok, we copy your caption automatically so
                you can paste it after the share/upload opens.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Controls */}
              <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h2 className="text-sm font-semibold tracking-wide">
                  Actions
                </h2>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleMakeShareReady}
                    className="inline-flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <MakeShareReadyIcon className="h-4 w-4" />
                      Make Share-Ready
                    </span>
                    <span className="text-xs text-zinc-400">
                      prep caption
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompileForSocials}
                    disabled={isCompiling}
                    className="inline-flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-2">
                      {isCompiling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CompileForSocialsIcon className="h-4 w-4" />
                      )}
                      Compile for Socials
                    </span>
                    <span className="text-xs text-zinc-400">
                      image + caption
                    </span>
                  </button>
                </div>

                {compileError ? (
                  <div className="mt-3 inline-flex items-start gap-2 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <span>{compileError}</span>
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold tracking-widest text-zinc-400">
                    Caption
                  </div>
                  <textarea
                    value={compiledCaption || sharePayload.caption}
                    onChange={(e) => setCompiledCaption(e.target.value)}
                    className="min-h-[140px] w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm outline-none focus:border-zinc-600"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleEmail}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={handleText}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-wide">
                      Compile preview
                    </h2>
                    <span className="text-xs text-zinc-400">
                      Used for image export
                    </span>
                  </div>

                  <div className="mt-4">
                    <div
                      ref={compilePreviewRef}
                      className="rounded-2xl bg-zinc-950 p-6"
                    >
                      <div className="text-xl font-semibold">{title}</div>
                      {author?.trim() ? (
                        <div className="mt-1 text-sm text-zinc-400">
                          by {author}
                        </div>
                      ) : null}
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                        {content || "Start writing..."}
                      </div>
                    </div>
                  </div>
                </div>

                {compiledImageDataUrl ? (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="text-xs font-semibold tracking-widest text-zinc-400">
                      Exported Image
                    </div>
                    <img
                      src={compiledImageDataUrl}
                      alt="Compiled"
                      className="mt-3 w-full rounded-xl border border-zinc-800"
                    />
                    <a
                      href={compiledImageDataUrl}
                      download={`${(title || "versedup")
                        .replace(/\s+/g, "-")
                        .toLowerCase()}.png`}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm hover:bg-zinc-900/60"
                    >
                      <Share2 className="h-4 w-4" />
                      Download PNG
                    </a>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sticky share tray (end-of-page transitions) */}
            {showShareTray ? (
              <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-5xl px-4">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/85 p-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm">
                    <ShareNowIcon className="h-4 w-4" />
                    <span className="font-medium">Share</span>
                    <span className="text-zinc-400">
                      quick actions
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Extended with quick social actions */}
                    <button
                      type="button"
                      onClick={() => handleSocialShare(SOCIALS.facebook.key)}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <SOCIALS.facebook.Icon className="h-4 w-4" />
                      Facebook
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialShare(SOCIALS.x.key)}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <SOCIALS.x.Icon className="h-4 w-4" />
                      Twitter/X
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareNotice("Shared (stub).")}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <ShareNowIcon className="h-4 w-4" />
                      Share Now
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>

                    <button
                      type="button"
                      onClick={handleEmail}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>

                    <button
                      type="button"
                      onClick={handleText}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:bg-zinc-900/70"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Text
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Notices */}
            {shareNotice ? (
              <div className="fixed bottom-20 left-0 right-0 z-50 mx-auto max-w-5xl px-4">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/85 px-3 py-2 text-sm backdrop-blur">
                  <Check className="h-4 w-4" />
                  <span>{shareNotice}</span>
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
