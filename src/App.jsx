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
  RefreshCw,
  Search,
  Settings,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  User,
  Trash2,
  Wand2,
  X,
  XCircle,
  ScanLine,
  Flame,
  Quote,
  ExternalLink,
  Sun,
  Eye,
  Pencil,
  Download,
  Undo2,
  Redo2,
  ArrowUpToLine,
  ArrowDownToLine,
  Bell,
  BellOff
} from "lucide-react";

/* ── Firebase + FCM ─────────────────────────────────── */
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDqBDUeZ-HtNpIiZK0Q9jRMU6vGfNYyEWI",
  authDomain: "versedup-f246f.firebaseapp.com",
  projectId: "versedup-f246f",
  storageBucket: "versedup-f246f.firebasestorage.app",
  messagingSenderId: "209958052615",
  appId: "1:209958052615:web:49eb475c6b7c41fd551ba2",
};
const FCM_VAPID_KEY = "BNJ8ogsK_fGl09mvXA0rF_OHkRiXK5cSg814xL3vS7-DIwIAaiKv8NO290VU3uV8VBfeVCGzEtpeMA-BEcr5wG8"; // TODO: paste your Web Push VAPID key from Firebase Console → Project Settings → Cloud Messaging

let _firebaseApp = null;
let _messaging = null;

function getFirebaseApp() {
  if (!_firebaseApp) _firebaseApp = initializeApp(FIREBASE_CONFIG);
  return _firebaseApp;
}

function getFirebaseMessaging() {
  if (!_messaging) {
    try { _messaging = getMessaging(getFirebaseApp()); } catch {}
  }
  return _messaging;
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return { status: "unsupported" };
  if (Notification.permission === "granted") return { status: "granted" };
  if (Notification.permission === "denied") return { status: "denied" };
  const result = await Notification.requestPermission();
  return { status: result };
}

async function getFCMToken() {
  if (!FCM_VAPID_KEY) return null;
  try {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;
    const token = await getToken(messaging, { vapidKey: FCM_VAPID_KEY });
    return token || null;
  } catch (e) {
    console.warn("FCM getToken failed:", e);
    return null;
  }
}

const STORAGE_FCM_TOKEN = `${typeof APP_ID !== "undefined" ? APP_ID : "versed_up"}_fcm_token`;
const STORAGE_NOTIF_PREF = `${typeof APP_ID !== "undefined" ? APP_ID : "versed_up"}_notif_pref`;

function loadNotifPref() {
  try { return JSON.parse(localStorage.getItem(STORAGE_NOTIF_PREF) || "null"); } catch { return null; }
}
function saveNotifPref(pref) {
  localStorage.setItem(STORAGE_NOTIF_PREF, JSON.stringify(pref));
}

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
    /* Spring bounce for interactive elements */
    @keyframes springPop {
      0%   { transform: scale(1); }
      35%  { transform: scale(0.88); }
      65%  { transform: scale(1.08); }
      82%  { transform: scale(0.97); }
      100% { transform: scale(1); }
    }
    /* Nav icon bounce on tap */
    @keyframes navBounce {
      0%   { transform: translateY(0) scale(1); }
      30%  { transform: translateY(-6px) scale(1.15); }
      55%  { transform: translateY(1px) scale(0.96); }
      75%  { transform: translateY(-2px) scale(1.04); }
      100% { transform: translateY(0) scale(1); }
    }
    /* FAB pulse ring */
    @keyframes fabRing {
      0%   { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    /* Float for VOTD card */
    @keyframes floatCard {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-4px); }
    }
    /* Ripple */
    @keyframes rippleOut {
      0%   { transform: scale(0); opacity: 0.35; }
      100% { transform: scale(4); opacity: 0; }
    }
    /* Scroll reveal */
    @keyframes scrollReveal {
      from { opacity: 0; transform: translateY(18px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)    scale(1);    }
    }
    /* Highlight pulse on scroll-in */
    @keyframes highlightPulse {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
      40%  { box-shadow: 0 0 0 6px rgba(16,185,129,0.12); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
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
    /* Spring button — replaces active:scale-95 everywhere */
    .btn-spring {
      transition: transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1);
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .btn-spring:active {
      transform: scale(0.91) !important;
    }
    /* Nav icon bounce */
    .nav-bounce { animation: navBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    /* VOTD float */
    .float-card { animation: floatCard 4s ease-in-out infinite; }
    /* Ripple */
    .ripple-ring {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      pointer-events: none;
      animation: rippleOut 0.55s ease-out forwards;
      transform-origin: center;
    }
    /* Scroll-reveal cards — CSS-only, no IntersectionObserver trap */
    .scroll-card {
      animation: scrollReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .scroll-card:nth-child(1) { animation-delay: 0ms; }
    .scroll-card:nth-child(2) { animation-delay: 60ms; }
    .scroll-card:nth-child(3) { animation-delay: 120ms; }
    .scroll-card:nth-child(4) { animation-delay: 180ms; }
    .scroll-card:nth-child(5) { animation-delay: 240ms; }
    /* Mood chip spring */
    .chip-spring {
      transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  background-color 150ms ease,
                  color 150ms ease,
                  border-color 150ms ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .chip-spring:active { transform: scale(0.88); }
    /* AI toolbar btn spring */
    .tool-spring {
      transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
                  background-color 150ms ease,
                  border-color 150ms ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    .tool-spring:active { transform: scale(0.84) !important; }

    /* Verse arrival animations */
    @keyframes verseReveal {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    @keyframes verseFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes shimmerSweep {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    @keyframes buttonRise {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes inputFadeOut {
      from { opacity: 1; transform: translateY(0);    }
      to   { opacity: 0; transform: translateY(-8px); pointer-events: none; }
    }
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
      50%       { box-shadow: 0 0 0 8px rgba(16,185,129,0.12); }
    }
    .verse-reveal {
      animation: verseReveal 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .verse-fade {
      animation: verseFadeIn 0.4s ease forwards;
      animation-delay: 0.2s;
      opacity: 0;
    }
    .button-rise {
      animation: buttonRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      animation-delay: 0.35s;
      opacity: 0;
    }
    .shimmer-text {
      background: linear-gradient(90deg, #1e293b 0%, #1e293b 40%, #10b981 50%, #1e293b 60%, #1e293b 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmerSweep 2.5s linear 1;
    }
    .verse-card-glow {
      animation: glowPulse 2s ease-in-out 3;
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

/* ── Scroll-reveal hook ── */
/* ── Count-up hook ── */
function useCountUp(target, duration = 800) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const eased = pct === 1 ? 1 : 1 - Math.pow(2, -10 * pct);
      setVal(Math.round(target * eased));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

/* ── Ripple button ── */
function RippleButton({ onClick, className, children, style, type = "button", disabled, title, "aria-label": ariaLabel }) {
  const [ripples, setRipples] = React.useState([]);
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    if (onClick) onClick(e);
  };
  return (
    <button
      type={type}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
      style={style}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
      {ripples.map((rp) => (
        <span
          key={rp.id}
          className="ripple-ring"
          style={{ width: rp.size, height: rp.size, left: rp.x, top: rp.y }}
        />
      ))}
    </button>
  );
}

/**
 * VersedUP — single file app
 */


/* ── Brand SVG Icons ── */
const TikTokIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const EmailIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const APP_ID = "versedup_v1";
const STORAGE_SETTINGS = `${APP_ID}_settings`;
const STORAGE_DEVOTIONALS = `${APP_ID}_devotionals`;
const STORAGE_STREAK = `${APP_ID}_streak`;
const STORAGE_SESSION = `${APP_ID}_session`;
const STORAGE_VIEW = `${APP_ID}_view`;
const STORAGE_ACTIVE_ID = `${APP_ID}_active_id`;

const PLATFORM_LIMITS = {
  tiktok: 2200,
  instagram: 2200,
  twitter: 280,
  facebook: 63206,
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

const BIBLE_VERSIONS = ["KJV", "ASV", "WEB", "NLT", "ESV", "NKJV"];

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

const VERSE_OF_DAY_LIST = Object.freeze([
  { verseRef: "Psalm 23:1-2", verseText: "The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.", suggestedTitle: "The Shepherd Who Leads Me" },
  { verseRef: "Lamentations 3:22-23", verseText: "His compassions fail not. They are new every morning: great is thy faithfulness.", suggestedTitle: "New Mercies This Morning" },
  { verseRef: "Isaiah 40:31", verseText: "They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.", suggestedTitle: "Strength for Today" },
  { verseRef: "Philippians 4:6-7", verseText: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.", suggestedTitle: "Peace That Guards My Heart" },
  { verseRef: "Matthew 11:28", verseText: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", suggestedTitle: "Come and Rest" },
  { verseRef: "Proverbs 3:5-6", verseText: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.", suggestedTitle: "Trusting His Direction" },
  { verseRef: "Romans 8:28", verseText: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", suggestedTitle: "God Works Through It" },
  { verseRef: "Jeremiah 29:11", verseText: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end.", suggestedTitle: "Plans for a Future and a Hope" },
  { verseRef: "John 3:16", verseText: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", suggestedTitle: "The Heart of the Gospel" },
  { verseRef: "Psalm 46:10", verseText: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.", suggestedTitle: "Be Still and Know" },
  { verseRef: "Isaiah 41:10", verseText: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", suggestedTitle: "God Is With You" },
  { verseRef: "2 Corinthians 12:9", verseText: "My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.", suggestedTitle: "Grace in the Weakness" },
  { verseRef: "Philippians 4:13", verseText: "I can do all things through Christ which strengtheneth me.", suggestedTitle: "Strength Beyond Yourself" },
  { verseRef: "Psalm 27:1", verseText: "The Lord is my light and my salvation; whom shall I fear? the Lord is the strength of my life; of whom shall I be afraid?", suggestedTitle: "The Lord Is My Light" },
  { verseRef: "Romans 8:38-39", verseText: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.", suggestedTitle: "Nothing Can Separate Us" },
  { verseRef: "Hebrews 11:1", verseText: "Now faith is the substance of things hoped for, the evidence of things not seen.", suggestedTitle: "Walking by Faith" },
  { verseRef: "Galatians 2:20", verseText: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.", suggestedTitle: "Christ Lives in Me" },
  { verseRef: "1 Peter 5:7", verseText: "Casting all your care upon him; for he careth for you.", suggestedTitle: "Cast Every Burden" },
  { verseRef: "Psalm 34:18", verseText: "The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", suggestedTitle: "Near to the Brokenhearted" },
  { verseRef: "John 14:27", verseText: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.", suggestedTitle: "His Peace, Not the World's" },
  { verseRef: "Joshua 1:9", verseText: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.", suggestedTitle: "Be Strong and Courageous" },
  { verseRef: "Romans 12:2", verseText: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.", suggestedTitle: "Renewed, Not Conformed" },
  { verseRef: "Ephesians 3:20", verseText: "Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us.", suggestedTitle: "Exceedingly Abundantly" },
  { verseRef: "Psalm 121:1-2", verseText: "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the Lord, which made heaven and earth.", suggestedTitle: "My Help Comes From the Lord" },
  { verseRef: "2 Timothy 1:7", verseText: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.", suggestedTitle: "A Spirit of Power" },
  { verseRef: "Colossians 3:23", verseText: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.", suggestedTitle: "Work as Unto the Lord" },
  { verseRef: "John 16:33", verseText: "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.", suggestedTitle: "Take Heart — He Has Overcome" },
  { verseRef: "Psalm 16:11", verseText: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.", suggestedTitle: "Fullness of Joy in His Presence" },
  { verseRef: "Micah 6:8", verseText: "He hath shewed thee, O man, what is good; and what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?", suggestedTitle: "Justice, Mercy, Humility" },
  { verseRef: "Matthew 6:33", verseText: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", suggestedTitle: "Seek First the Kingdom" },
  { verseRef: "Deuteronomy 31:8", verseText: "And the Lord, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.", suggestedTitle: "He Goes Before You" },
  { verseRef: "Psalm 91:1-2", verseText: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty. I will say of the Lord, He is my refuge and my fortress: my God; in him will I trust.", suggestedTitle: "Under the Shadow of the Almighty" },
  { verseRef: "Luke 1:37", verseText: "For with God nothing shall be impossible.", suggestedTitle: "Nothing Is Impossible With God" },
  { verseRef: "James 1:5", verseText: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", suggestedTitle: "Ask God for Wisdom" },
  { verseRef: "Zephaniah 3:17", verseText: "The Lord thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.", suggestedTitle: "He Rejoices Over You With Singing" },
  { verseRef: "John 15:5", verseText: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.", suggestedTitle: "Remain in the Vine" },
  { verseRef: "Romans 15:13", verseText: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", suggestedTitle: "Filled With Hope" },
  { verseRef: "Psalm 119:105", verseText: "Thy word is a lamp unto my feet, and a light unto my path.", suggestedTitle: "A Lamp to My Path" },
  { verseRef: "Isaiah 26:3", verseText: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", suggestedTitle: "Perfect Peace" },
  { verseRef: "Ephesians 6:10", verseText: "Finally, my brethren, be strong in the Lord, and in the power of his might.", suggestedTitle: "Strong in the Lord" },
  { verseRef: "1 John 4:4", verseText: "Ye are of God, little children, and have overcome them: because greater is he that is in you, than he that is in the world.", suggestedTitle: "Greater Is He in You" },
  { verseRef: "Psalm 37:4", verseText: "Delight thyself also in the Lord: and he shall give thee the desires of thine heart.", suggestedTitle: "Delight in the Lord" },
  { verseRef: "Revelation 21:5", verseText: "And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful.", suggestedTitle: "He Makes All Things New" },
  { verseRef: "Matthew 5:16", verseText: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", suggestedTitle: "Let Your Light Shine" },
  { verseRef: "Isaiah 43:2", verseText: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned.", suggestedTitle: "Through the Waters With You" },
  { verseRef: "Romans 5:8", verseText: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.", suggestedTitle: "Love Demonstrated" },
  { verseRef: "1 Corinthians 13:4-7", verseText: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up... Beareth all things, believeth all things, hopeth all things, endureth all things.", suggestedTitle: "What Love Really Looks Like" },
  { verseRef: "Psalm 103:12", verseText: "As far as the east is from the west, so far hath he removed our transgressions from us.", suggestedTitle: "Forgiven, Completely" },
  { verseRef: "Philippians 1:6", verseText: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.", suggestedTitle: "He Will Complete the Work" },
  { verseRef: "Hebrews 12:1-2", verseText: "Let us run with patience the race that is set before us, looking unto Jesus the author and finisher of our faith.", suggestedTitle: "Eyes Fixed on Jesus" },
  { verseRef: "2 Chronicles 7:14", verseText: "If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.", suggestedTitle: "A Call to Seek His Face" },
  { verseRef: "Nehemiah 8:10", verseText: "Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the Lord is your strength.", suggestedTitle: "Joy as Strength" },
]);

const getVerseOfDay = (date = new Date()) => {
  const key = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const idx = Math.abs(Math.floor(key / 86400000)) % VERSE_OF_DAY_LIST.length;
  return VERSE_OF_DAY_LIST[idx];
};

// VERSE_OF_DAY is now evaluated dynamically at render time via getVerseOfDay()

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
  myPlatforms: ["tiktok", "instagram"],

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
  { id: "light",   label: "Light",   swatch: ["#ecfdf5","#f8fafc","#f0f9ff"] },
  { id: "sunrise", label: "Sunrise", swatch: ["#fff7ed","#fef3c7","#fce7f3"] },
  { id: "sunset",  label: "Sunset",  swatch: ["#fce7f3","#ede9fe","#e0e7ff"] },
  { id: "dusk",    label: "Dusk",    swatch: ["#ede9fe","#e0e7ff","#fce7f3"] },
  { id: "warm",    label: "Warm",    swatch: ["#fffbeb","#fff7ed","#fff1f2"] },
  { id: "forest",  label: "Forest",  swatch: ["#f0fdf4","#ecfdf5","#f0fdfa"] },
  { id: "ocean",   label: "Ocean",   swatch: ["#f0f9ff","#eff6ff","#ecfeff"] },
  { id: "slate",   label: "Slate",   swatch: ["#f1f5f9","#f8fafc","#fafafa"] },
]);

const THEME_STYLES = Object.freeze({
  light:   "from-emerald-50/60 via-slate-50 to-sky-50",
  sunrise: "from-orange-50 via-rose-50/50 to-amber-50/70",
  sunset:  "from-rose-100/70 via-purple-50/50 to-indigo-50/60",
  dusk:    "from-violet-50 via-indigo-50/40 to-rose-50/40",
  warm:    "from-amber-50 via-orange-50/40 to-rose-50/50",
  forest:  "from-green-50/80 via-emerald-50/60 to-teal-50/50",
  ocean:   "from-sky-50/80 via-blue-50/60 to-cyan-50/50",
  slate:   "from-slate-100 via-slate-50 to-zinc-50",
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
    reviewed: false,
    scriptureSource: "verse_of_day",
  };
}

function BrandLogo({ className = "h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" }) {
  return (
    <img
      src={assetUrl("logo.png")}
      alt="VersedUP"
      className={className}
      draggable="false"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.style.display = "none";
      }}
    />
  );
}


function getEntryQueueStatus(d) {
  const hasVerse = Boolean(String(d?.verseRef || "").trim());
  const hasReflection = Boolean(String(d?.reflection || "").trim());
  const hasScript = Boolean(String(d?.tiktokScript || "").trim());
  const hasAny = hasVerse || hasReflection || hasScript || Boolean(String(d?.title || "").trim()) || Boolean(String(d?.prayer || "").trim()) || Boolean(String(d?.questions || "").trim());
  if (String(d?.status || "").toLowerCase() === "posted") return { id: "posted", label: "Posted", tone: "bg-slate-100 text-slate-700 border-slate-200", dot: "⚫" };
  if (hasVerse && hasReflection && hasScript) return { id: "ready", label: "Ready", tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "🟢" };
  if (hasAny) return { id: "in_progress", label: "In Progress", tone: "bg-amber-50 text-amber-700 border-amber-200", dot: "🟡" };
  return { id: "draft", label: "Draft", tone: "bg-sky-50 text-sky-700 border-sky-200", dot: "🔵" };
}

// Translations supported by bible-api.com (free, no key)
const BIBLE_API_TRANSLATIONS = { KJV: "kjv", ASV: "asv", WEB: "web" };

function canFetchDirect(version) {
  return Object.prototype.hasOwnProperty.call(BIBLE_API_TRANSLATIONS, String(version || "").toUpperCase());
}

function bibleGatewayUrl(passage, version = "KJV") {
  const q = encodeURIComponent(String(passage || "").trim());
  return `https://www.biblegateway.com/passage/?search=${q}&version=${version}`;
}

function normalizeVerseReferenceInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  let txt = raw
    .replace(/verse/gi, ":")
    .replace(/v/gi, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  const bookMatch = txt.match(/^([1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s*(.*)$/);
  if (!bookMatch) return txt;

  const rawBook = String(bookMatch[1] || "").trim();
  const rest = String(bookMatch[2] || "").trim();
  const normalizedBookKey = rawBook.toLowerCase().replace(/\s+/g, "");

  let book = BIBLE_BOOKS.find((b) => b.toLowerCase().replace(/\s+/g, "") === normalizedBookKey)
    || BIBLE_BOOKS.find((b) => b.toLowerCase().replace(/\s+/g, "").startsWith(normalizedBookKey));

  if (!book) {
    book = rawBook
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
  }

  if (!rest) return book;

  const cv = rest.match(/^(\d{1,3})(?:\s*:\s*(\d{1,3}))?/);
  if (cv) {
    const chapter = cv[1];
    const verse = cv[2];
    return verse ? `${book} ${chapter}:${verse}` : `${book} ${chapter}`;
  }

  return `${book} ${rest}`.trim();
}

async function fetchVerseFromBibleApi(passage, version = "KJV") {
  const ref = String(passage || "").trim();
  if (!ref) throw new Error("Enter a passage first.");
  const translation = BIBLE_API_TRANSLATIONS[String(version).toUpperCase()] || "kjv";
  const url = `https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data?.text) {
    throw new Error(data?.error || "Passage not found. Try: John 3:16-18 or Psalm 23.");
  }
  return String(data.text).trim();
}

// Keep legacy alias for any remaining callers
const fetchKjvFromBibleApi = (passage) => fetchVerseFromBibleApi(passage, "KJV");

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

  // Mock mode: return the input text unchanged for edit operations,
  // or a minimal stub for generation operations.
  await new Promise((r) => setTimeout(r, 650));
  // Mock mode: return input text for edit ops, stub for generation ops
  const lower = prompt.toLowerCase();
  if (lower.startsWith("correct grammar") || lower.startsWith("shorten this") || lower.startsWith("expand this") || lower.startsWith("rewrite this") || lower.startsWith("change the tone")) {
    // Edit operation: return the user's text unchanged (last paragraph of prompt)
    const idx = prompt.lastIndexOf("\n\n");
    return idx >= 0 ? prompt.slice(idx + 2).trim() : prompt.trim();
  }
  // Fallback: return a minimal stub so fields don't get prompt text
  return "Your reflection will appear here. Add an OpenAI or Gemini key in Settings for real AI suggestions.";
}

async function aiFixGrammar(settings, { text, mood }) {
  const prompt = `Correct grammar and spelling errors. ${buildMoodHint(mood)} Return only the corrected text with no explanation.\n\nTEXT:\n${text}`;
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
      ? `Shorten this while keeping the core meaning. ${buildMoodHint(mood)} Return only the shortened text.\n\n${text}`
      : `Expand this with more depth and clarity. ${buildMoodHint(mood)} Return only the expanded text.\n\n${text}`;
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

function StreakCounter({ target }) {
  const val = useCountUp(target, 900);
  return (
    <div className="text-5xl font-black text-slate-900 tabular-nums leading-none transition-all">
      {val}
    </div>
  );
}

/* ── Daily Inspiration: AI Image + Reflection Prompt ── */

function getDailyReflectionPrompt(verseRef, verseText) {
  const prompts = [
    (ref, text) => `What situation in your life right now does "${text.split(" ").slice(0, 6).join(" ")}…" speak directly into?`,
    (ref) => `If ${ref} were a personal letter written just to you today, what would God be saying?`,
    (ref) => `Where have you seen the truth of ${ref} play out in the last 7 days — even in a small way?`,
    (ref) => `What would change about your day if you believed ${ref} fully — not just intellectually, but in your bones?`,
    (ref) => `Who in your life most needs to hear the message of ${ref} right now? How could you carry it to them?`,
    (ref) => `What's one thing you've been holding onto that ${ref} is asking you to release or trust God with?`,
    (ref) => `How does ${ref} challenge the loudest lie you've believed about yourself recently?`,
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return prompts[dayOfYear % prompts.length](verseRef, verseText);
}

function buildImagePrompt(verseRef, verseText) {
  // Extract key themes from the verse to craft a vivid scene prompt
  const text = `${verseRef} ${verseText}`.toLowerCase();
  const themes = [
    [/shepherd|sheep|pasture|flock/, "a peaceful sunlit shepherd and sheep on rolling green hills at golden hour, cinematic, God rays through clouds"],
    [/light|darkness|lamp|shine|radiant/, "golden rays of divine light breaking through storm clouds over a misty valley, epic sky, spiritual atmosphere"],
    [/water|river|stream|well|thirst/, "a crystal clear mountain stream flowing through an ancient mossy forest, ethereal morning light"],
    [/mountain|rock|fortress|strength/, "a lone figure standing on a mountain summit above the clouds at sunrise, majestic, cinematic"],
    [/love|heart|grace|mercy/, "a sunrise over a peaceful countryside with wildflowers and soft warm golden light, serene and hopeful"],
    [/peace|still|rest|quiet/, "a still misty lake at dawn surrounded by ancient trees, perfect mirror reflection, tranquil"],
    [/seed|grow|fruit|vine|harvest/, "a lush vineyard or orchard at golden hour, sunlight through leaves, abundant life"],
    [/eagle|fly|soar|wings/, "a majestic eagle soaring above mountain peaks through dramatic clouds at sunrise"],
    [/fire|flame|burn|refine/, "a warm campfire at night under a breathtaking starry sky, Milky Way, peaceful wilderness"],
    [/bread|feed|hunger|full/, "golden wheat fields at sunset, rolling hills, warm harvest light"],
    [/storm|wind|wave|sea/, "a lighthouse standing strong against crashing ocean waves in a dramatic storm, perseverance"],
    [/desert|wilderness|journey|path/, "a solitary traveler on an ancient dusty path through a vast desert at sunrise, spiritual quest"],
  ];
  for (const [pattern, imagePrompt] of themes) {
    if (pattern.test(text)) return imagePrompt;
  }
  return "a breathtaking sunrise over rolling hills and ancient trees, spiritual light, cinematic nature photography, peaceful and hopeful";
}

function DailyInspirationSection() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayVerse = getVerseOfDay();
  const prompt = getDailyReflectionPrompt(todayVerse.verseRef, todayVerse.verseText);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="animate-enter space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Today's Reflection</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Daily Reflection Prompt */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-base">💭</span>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-500">Reflect Today</div>
              <div className="text-[11px] text-slate-400 font-medium">Tied to today's verse</div>
            </div>
          </div>

          <p className={cn("text-sm font-semibold text-slate-800 leading-relaxed", !expanded ? "line-clamp-3" : "")}>
            {prompt}
          </p>

          {prompt.length > 120 ? (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[11px] font-bold text-amber-500 hover:text-amber-600">
              {expanded ? "Show less" : "Read more"}
            </button>
          ) : null}

          <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Refreshes daily · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeView({ onNew, onLibrary, onContinue, onReflectVerseOfDay, onQuickPost, hasActive, streak, displayName, devotionals, onOpen, onOpenReadyToPost, showInstallBanner, onInstall, onDismissInstall }) {
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  const { pushToast } = useToast();
  const [moodVerseKey, setMoodVerseKey] = useState("joy");
  const moodVerse = MOOD_VERSES[moodVerseKey] || MOOD_VERSES.joy;

  const handleSelectMoodVerse = (key) => {
    setMoodVerseKey(key);
    const label = (MOOD_VERSES[key] || {}).label || "Verse";
    pushToast(`${label} verse ready.`);
  };

  // Most recently edited entry (not just last in array)
  const latest = devotionals.length > 0
    ? [...devotionals].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0]
    : null;
  const todaysAction = hasActive
    ? { tone: "bg-emerald-50 border-emerald-200 text-emerald-800", text: "🟢 You're ready to post — 1 entry draft waiting" }
    : latest
      ? { tone: "bg-amber-50 border-amber-200 text-amber-800", text: "🟡 In progress — pick up where you left off" }
      : { tone: "bg-sky-50 border-sky-200 text-sky-800", text: "🔵 Fresh start — what's on your heart today?" };

  return (
    <div className="space-y-4 pb-20 animate-enter">
      {showInstallBanner && (
        <div className="flex items-center gap-3 bg-indigo-600 text-white rounded-2xl px-4 py-3 shadow-md">
          <div className="text-xl">📲</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold leading-tight">Add VersedUP to your home screen</div>
            <div className="text-xs text-indigo-200 mt-0.5">Launch instantly, like a native app</div>
          </div>
          <button onClick={onInstall} className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 hover:bg-indigo-50 transition-colors">Install</button>
          <button onClick={onDismissInstall} className="text-indigo-200 hover:text-white transition-colors flex-shrink-0" aria-label="Dismiss"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
      )}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      <div className={`rounded-2xl border px-4 py-3 text-sm font-extrabold ${todaysAction.tone}`}>
        {todaysAction.text}
      </div>

      <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 overflow-hidden relative scroll-card">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-transparent to-sky-50/20 pointer-events-none" />
        <div className="relative space-y-4">
          {/* Streak row — tappable for explanation */}
          <button
            type="button"
            onClick={() => setStreakInfoOpen(true)}
            className="flex items-center gap-3 w-full text-left group"
          >
            <StreakCounter target={streak.count} />
            <div className="relative w-8 h-8 flex-shrink-0">
              <Flame className="w-8 h-8 text-orange-500 drop-shadow-sm animate-pulse-slow absolute inset-0" fill="currentColor" />
              <Flame className="w-8 h-8 text-yellow-400 absolute inset-0 mix-blend-overlay" fill="currentColor" />
            </div>
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Day Streak</div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                {streak.count > 0 ? `${streak.count} day${streak.count === 1 ? "" : "s"} in a row` : "Start your first day"}
              </div>
            </div>
            <span className="text-slate-300 text-xs group-hover:text-slate-400 transition-colors shrink-0">ⓘ</span>
          </button>

          {/* Streak info sheet */}
          {streakInfoOpen ? (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => setStreakInfoOpen(false)}>
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-enter" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Flame className="w-10 h-10 text-orange-500 absolute inset-0" fill="currentColor" />
                    <Flame className="w-10 h-10 text-yellow-400 absolute inset-0 mix-blend-overlay" fill="currentColor" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">{streak.count}-Day Streak</div>
                    <div className="text-sm text-slate-500 font-medium">Daily devotional consistency</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                    <div className="font-extrabold text-slate-800 text-[13px]">How it works</div>
                    <div>✍️ <strong>Write or save</strong> any devotional entry to count today.</div>
                    <div>🔥 <strong>Consecutive days</strong> keep your streak alive — even a short reflection counts.</div>
                    <div>💤 <strong>Miss a day?</strong> Your streak resets to 1, but your entries are never lost.</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                    <div className="font-extrabold text-emerald-800 text-[13px] mb-1">A word of grace</div>
                    <div className="text-emerald-700 italic">"His mercies are new every morning." A missed day is a fresh start, not a failure. Come back — He's here.</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStreakInfoOpen(false)}
                  className="w-full rounded-2xl bg-slate-900 text-white py-3.5 font-extrabold"
                >
                  Got it
                </button>
              </div>
            </div>
          ) : null}

          {/* Primary CTA — one clear action */}
          <RippleButton
            onClick={hasActive ? onContinue : onNew}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-base font-extrabold shadow-lg shadow-emerald-200 hover:bg-emerald-700 btn-spring flex items-center justify-center gap-2"
          >
            <PenTool className="w-5 h-5" />
            {hasActive ? "Continue Writing" : "Start Today's Devotional"}
          </RippleButton>

          {/* Secondary — less prominent */}
          <button
            type="button"
            onClick={onQuickPost}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-extrabold hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            ⚡ 60-Second Post — just a verse + one thought
          </button>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">How's your heart?</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.entries(MOOD_VERSES).map(([k, mv]) => (
            <button
              key={k}
              type="button"
              onClick={() => handleSelectMoodVerse(k)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-extrabold chip-spring",
                moodVerseKey === k ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
              )}
            >
              {mv.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <div className="text-xs font-black text-emerald-700">{moodVerse.verseRef}</div>
          <div className="mt-1 text-sm text-slate-700 font-serif-scripture">{moodVerse.verseText}</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[1.75rem] p-6 text-white shadow-lg relative overflow-hidden float-card">
        <Quote className="absolute -bottom-4 -right-4 w-28 h-28 text-white/10 rotate-12" fill="currentColor" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3 relative z-10">
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Verse of the Day</span>
        </div>
        <div className="text-xl leading-relaxed font-serif-scripture relative z-10">{`"${getVerseOfDay().verseText}"`}</div>
        <div className="mt-3 text-[10px] font-black tracking-widest opacity-70 relative z-10">{getVerseOfDay().verseRef.toUpperCase()}</div>
        <RippleButton onClick={onReflectVerseOfDay} className="mt-4 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-md btn-spring flex items-center gap-2 border border-white/10 relative z-10">
          Reflect on this
        </RippleButton>
      </div>

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
        const statusReady = Boolean(last.reflection && (last.reflection || "").length > 120);
        return (
          <div className="w-full text-left bg-white rounded-[1.75rem] border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all group scroll-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Draft</span>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-black", statusReady ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700")}>
                  {statusReady ? "Ready to Post" : "In Progress"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{ago}</span>
            </div>
            {last.verseRef ? <div className="text-xs font-bold text-emerald-700 mb-1">{last.verseRef}</div> : null}
            <div className="text-sm text-slate-700 leading-relaxed line-clamp-2">
              {preview ? `"${preview}${preview.length >= 120 ? "…" : ""}"` : "Tap to continue writing…"}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {statusReady ? (
                <button type="button" onClick={() => onOpenReadyToPost(last.id)} className="w-full rounded-xl bg-emerald-600 px-3 py-3 text-xs font-extrabold text-white flex items-center justify-center gap-1.5">🚀 Ready to post — preview &amp; share</button>
              ) : null}
              <button type="button" onClick={() => onOpen(last.id)} className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 ${statusReady ? "w-full text-center" : ""}`}>{statusReady ? "✏️ Keep editing" : "Continue writing"}</button>
            </div>
          </div>
        );
      })() : (
        <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[1.75rem] border border-sky-100 p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-2">Fresh Start</div>
          <div className="text-sm text-slate-700 leading-relaxed font-semibold">Verse of the Day is your daily spark.</div>
          <div className="mt-2 text-xs font-bold text-sky-700">Tap the Write button below to start with your own scripture.</div>
        </div>
      )}
      {/* ── Daily Reflection Prompt + Scripture Image Card ── */}
      <DailyInspirationSection />

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

function VersePill({ verseRef, verseText }) {
  const [expanded, setExpanded] = useState(false);
  if (!verseRef) return null;
  const sentences = verseText ? verseText.split(/(?<=[.!?])\s+/) : [];
  const firstSentence = sentences[0] || "";
  const hasMore = verseText && firstSentence.length < verseText.length;
  return (
    <button
      type="button"
      onClick={() => setExpanded(v => !v)}
      className="w-full text-left rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 flex items-start gap-2.5 transition-all hover:bg-emerald-50"
    >
      <BookOpen className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <span className="text-xs font-black text-emerald-700">{verseRef}</span>
        {firstSentence ? (
          <p className={cn("text-xs text-slate-600 font-serif-scripture leading-snug mt-0.5", expanded ? "" : "line-clamp-1")}>
            {expanded ? verseText : `"${firstSentence}${hasMore ? "…" : ""}"`}
          </p>
        ) : null}
      </div>
      <span className="text-slate-300 text-[10px] shrink-0 mt-0.5">{expanded ? "▲" : "▼"}</span>
    </button>
  );
}

function WriteView({ devotional, settings, onUpdate, onGoCompile, onGoPolish, onSaved }) {
  const verseOfDay = React.useMemo(() => getVerseOfDay(), []);
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const [step, setStep] = useState(1);
  // Undo/redo history for reflection, prayer, questions
  const historyRef = React.useRef({ stack: [], index: -1, skipNext: false });
  const pushHistory = React.useCallback((patch) => {
    const h = historyRef.current;
    if (h.skipNext) { h.skipNext = false; return; }
    // Trim forward history
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(patch);
    if (h.stack.length > 100) h.stack.shift();
    h.index = h.stack.length - 1;
  }, []);
  const canUndo = historyRef.current.index > 0;
  const canRedo = historyRef.current.index < historyRef.current.stack.length - 1;
  const doUndo = React.useCallback(() => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index--;
    h.skipNext = true;
    onUpdate(h.stack[h.index]);
  }, [onUpdate]);
  const doRedo = React.useCallback(() => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index++;
    h.skipNext = true;
    onUpdate(h.stack[h.index]);
  }, [onUpdate]);
  const [contentTab, setContentTab] = useState("reflection");
  const [platform, setPlatform] = useState(() => (settings.myPlatforms && settings.myPlatforms[0]) || "tiktok");
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_CHIPS[0]?.id || "");
  const [postText, setPostText] = useState("");
  const [igMode, setIgMode] = useState("caption");
  const [igBg, setIgBg] = useState("minimal");
  const [shareBusy, setShareBusy] = useState(false);
  const [ttOverlay, setTtOverlay] = useState(false);
  const [ttCountdown, setTtCountdown] = useState(2);
  const [changingPlatform, setChangingPlatform] = useState(false);
  const [sharedConfirm, setSharedConfirm] = useState(false);
  const [showTikTokScriptModal, setShowTikTokScriptModal] = useState(false);
  const [showTikTokExportModal, setShowTikTokExportModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  const igCardRef = useRef(null);
  const autoFetchTimer = useRef(null);

  const verseRef = String(devotional.verseRef || "").trim();
  const normalizedVerseRef = normalizeVerseReferenceInput(verseRef);
  const verseText = String(devotional.verseText || "").trim();
  const version = devotional.bibleVersion || settings.defaultBibleVersion || "KJV";
  const bookQuery = (devotional.verseRef || "").replace(/\d.*$/, "").trim();
  const smartBookSuggestions = useMemo(() => {
    if (!bookQuery) return [];
    const q = bookQuery.toLowerCase();
    return BIBLE_BOOKS.filter((b) => b.toLowerCase().startsWith(q) || b.toLowerCase().includes(q)).slice(0, 6);
  }, [bookQuery]);
  const guidedMode = Boolean(settings.guidedMode);
  const aiNeedsKey =
    (settings.aiProvider === "openai" && !settings.openaiKey) ||
    (settings.aiProvider === "gemini" && !settings.geminiKey);

  const stepStorageKey = `${APP_ID}_wizard_step_${devotional.id}`;

  useEffect(() => {
    const saved = Number(localStorage.getItem(stepStorageKey) || "1");
    if ([1,2,3,4].includes(saved)) setStep(saved);
  }, [stepStorageKey]);

  useEffect(() => {
    localStorage.setItem(stepStorageKey, String(step));
  }, [step, stepStorageKey]);

  useEffect(() => {
    onSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devotional.verseRef, devotional.verseText, devotional.title, devotional.reflection, devotional.prayer, devotional.questions, devotional.tiktokScript, devotional.mood]);

  useEffect(() => {
    setPostText(compileForPlatform(platform, devotional, settings));
  }, [platform, devotional, settings]);


  useEffect(() => {
    if (!ttOverlay) return;
    if (ttCountdown <= 0) {
      window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
      setTtOverlay(false);
      setTtCountdown(2);
      return;
    }
    const t = setTimeout(() => setTtCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [ttOverlay, ttCountdown]);

  useEffect(() => {
    if (step !== 1) return;
    if (!normalizedVerseRef) return;
    const validLike = /\b\d{1,3}:\d{1,3}/.test(normalizedVerseRef) || /\b\d{1,3}\b/.test(normalizedVerseRef);
    if (!validLike) return;
    if (verseText) return;
    if (autoFetchTimer.current) clearTimeout(autoFetchTimer.current);
    autoFetchTimer.current = setTimeout(() => { void doFetch(); }, 500);
    return () => autoFetchTimer.current && clearTimeout(autoFetchTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, normalizedVerseRef, version]);

  const handleBookSuggestionPick = (book) => {
    const tail = String(devotional.verseRef || "").replace(/^\s*[^\d]*\s*/, "").trim();
    const nextRef = tail ? `${book} ${tail}` : `${book} `;
    onUpdate({ verseRef: nextRef, verseText: "", scriptureSource: "your_verse" });
  };

  const doFetch = async () => {
    if (!normalizedVerseRef) return;
    setFetching(true);
    try {
      if (canFetchDirect(version)) {
        const text = await fetchVerseFromBibleApi(normalizedVerseRef, version);
        onUpdate({ verseRef: normalizedVerseRef, verseText: text, verseTextEdited: false, scriptureSource: "your_verse" });
      } else {
        window.open(bibleGatewayUrl(normalizedVerseRef, version), "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      pushToast(e?.message || "Fetch failed.");
    } finally {
      setFetching(false);
    }
  };

  const onTopicClick = (t) => {
    setSelectedTopic(t.id);
  };

  const moodPrompt = {
    grateful: "What gift from this verse can you thank God for right now?",
    anxious: "What truth from this verse counters what you're afraid of?",
    hopeful: "What promise here gives you hope for today?",
    weary: "Where does this verse offer rest for your tired heart?",
    peaceful: "How can you carry this peace into someone else's life today?",
  };

  const doDraftForMe = async () => {
    setBusy(true);
    try {
      const topic = TOPIC_CHIPS.find((t) => t.id === selectedTopic) || TOPIC_CHIPS[0];
      const out = await aiGuidedFill(settings, {
        topicLabel: topic?.label || "",
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        mood: devotional.mood,
      });
      onUpdate({
        title: out.title || devotional.title,
        reflection: out.reflection || devotional.reflection,
        prayer: out.prayer || devotional.prayer,
        questions: out.questions || devotional.questions,
      });
    } catch (e) {
      pushToast(e?.message || "Draft failed.");
    } finally {
      setBusy(false);
    }
  };

  const doFix = async () => {
    const key = contentTab;
    const txt = String(devotional[key] || "");
    if (!txt.trim()) return;
    setBusy(true);
    try {
      const out = await aiFixGrammar(settings, { text: txt, mood: devotional.mood });
      onUpdate({ [key]: out });
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally { setBusy(false); }
  };

  const doLength = async (direction) => {
    const key = contentTab;
    const txt = String(devotional[key] || "");
    if (!txt.trim()) return;
    setBusy(true);
    try {
      const out = await aiRewriteLength(settings, { text: txt, mood: devotional.mood, direction });
      onUpdate({ [key]: out });
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally { setBusy(false); }
  };

  const doTone = async (tone) => {
    setToneMenuOpen(false);
    if (!devotional.reflection?.trim()) return;
    setBusy(true);
    try {
      const out = await ai(settings, `Rewrite this in a ${tone} tone while keeping the same meaning. Return only the rewritten text.

${devotional.reflection}`);
      onUpdate({ reflection: out });
    } catch (e) { pushToast(e?.message || "Tone failed."); }
    finally { setBusy(false); }
  };

  const limit = PLATFORM_LIMITS[platform] || 999999;
  const count = String(contentTab === "reflection" ? devotional.reflection : contentTab === "prayer" ? devotional.prayer : devotional.questions || "").length;
  const over = count > limit;

  const copyAndOpen = async () => {
    // Auto-save entry as "shared" immediately so work is never lost
    onUpdate({ status: "ready", updatedAt: new Date().toISOString() });
    try { await navigator.clipboard.writeText(postText); } catch {}
    if (platform === "tiktok") {
      setTtOverlay(true); setTtCountdown(2);
      setSharedConfirm(true);
      return;
    }
    if (platform === "instagram") {
      window.location.href = "instagram://camera";
      setTimeout(() => window.open("https://www.instagram.com/create/select/", "_blank", "noopener,noreferrer"), 800);
      setSharedConfirm(true);
      return;
    }
    if (platform === "twitter") {
      const shareUrl = encodeURIComponent(window.location.href);
      const shareText = encodeURIComponent(postText);
      window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, "_blank", "noopener,noreferrer");
      setSharedConfirm(true);
      return;
    }
    if (platform === "facebook") {
      const u = encodeURIComponent(window.location.href);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank", "noopener,noreferrer");
      setSharedConfirm(true);
      return;
    }
    if (platform === "email") {
      const subject = encodeURIComponent(devotional.title || devotional.verseRef || "Encouragement");
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(postText)}`;
      setSharedConfirm(true);
    }
  };

  const exportInstagramCard = async () => {
    try {
      const dataUrl = await toPng(igCardRef.current, { cacheBust: true });
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `instagram-card-${(devotional.verseRef || "verse").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      a.click();
    } catch (e) { pushToast(e?.message || "Export failed"); }
  };

  const stepTitles = ["Scripture", "Your Heart", "Shape It", "Post It"];

  const onboardingStyleSteps = [
    { label: "Step 1", title: "Scripture", stepNum: 1 },
    { label: "Step 2", title: "Your Heart", stepNum: 2 },
    { label: "Step 3", title: "Shape It", stepNum: 3 },
    { label: "Step 4", title: "Post It", stepNum: 4 },
  ];
  const displayStep = step;
  const progress = (displayStep / 4) * 100;
  const verseReady = Boolean(normalizedVerseRef);
  const heartReady = Boolean(String(devotional.reflection || "").trim() || String(devotional.prayer || "").trim() || String(devotional.questions || "").trim());
  const canAccessStep = (nextStep) => {
    if (nextStep <= 1) return true;
    if (nextStep === 2) return verseReady;
    if (nextStep === 3) return verseReady;
    if (nextStep === 4) return verseReady && heartReady;
    return false;
  };
  const goToStep = (nextStep) => {
    if (canAccessStep(nextStep)) setStep(nextStep);
  };

  return (
    <div className="space-y-3 pb-20 animate-enter relative">
      {ttOverlay ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
            <div className="mt-3 text-lg font-black text-slate-900">Caption copied to clipboard!</div>
            <div className="mt-1 text-sm text-slate-600">Opening TikTok in {ttCountdown}… paste your caption to create a post.</div>
          </div>
        </div>
      ) : null}

      {/* ── Step Progress Header ── */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {/* Top row: back + step label */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-1">
          <button
            type="button"
            onClick={() => (step === 1 ? onGoCompile() : setStep((s) => Math.max(1, s - 1)))}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors active:scale-95"
            title={step === 1 ? "Exit" : "Back"}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {step === 1 ? "Exit" : "Back"}
          </button>
          <div className="flex-1 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {displayStep} of 4</span>
            <span className="mx-2 text-slate-200">·</span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {onboardingStyleSteps[displayStep - 1]?.title || stepTitles[step - 1]}
            </span>
          </div>
          {/* Spacer to balance the back button */}
          <div className="w-16" />
        </div>

        {/* Progress bar — thick, prominent */}
        <div className="px-4 pb-1">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step bubbles */}
        <div className="grid grid-cols-4 gap-1.5 px-4 pb-3.5 pt-2">
          {onboardingStyleSteps.map((item) => {
            const enabled = canAccessStep(item.stepNum);
            const isActive = item.stepNum === displayStep;
            const isDone = item.stepNum < displayStep;
            return (
              <button
                key={item.label}
                type="button"
                disabled={!enabled}
                onClick={() => goToStep(item.stepNum)}
                className={cn(
                  "rounded-xl py-2 px-1 text-center transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : isDone
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : enabled
                        ? "bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300"
                        : "bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed"
                )}
              >
                <div className={cn("text-[9px] font-black uppercase tracking-wider mb-0.5", isActive ? "text-emerald-200" : isDone ? "text-emerald-500" : "text-slate-400")}>
                  {isDone ? "✓" : `Step ${item.stepNum}`}
                </div>
                <div className="text-[11px] font-extrabold leading-tight">{item.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {step === 1 ? (() => {
        const isVotd = (devotional.scriptureSource || "verse_of_day") === "verse_of_day";
        const switchToYourVerse = () => {
          onUpdate({ verseRef: "", verseText: "", verseTextEdited: false, scriptureSource: "your_verse" });
        };
        const switchToVotd = () => {
          onUpdate({ verseRef: verseOfDay.verseRef, verseText: verseOfDay.verseText, verseTextEdited: false, scriptureSource: "verse_of_day" });
        };
        return (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-2xl font-black text-slate-900 leading-tight">What verse is speaking to you today?</div>
                {settings.ocrEndpoint?.trim() ? (
                  <button
                    type="button"
                    onClick={() => setShowOcrModal(true)}
                    className="shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:border-slate-300 hover:bg-white transition-colors"
                    title="Scan a Bible page with camera"
                  >
                    <ScanLine className="w-3.5 h-3.5" /> Scan
                  </button>
                ) : null}
              </div>

              {/* Segmented source selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={switchToVotd}
                  className={cn(
                    "rounded-xl py-3 px-4 transition-all duration-200 text-left",
                    isVotd
                      ? "bg-emerald-600 shadow-md"
                      : "hover:bg-white/60"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Sparkles className={cn("w-3.5 h-3.5 flex-shrink-0", isVotd ? "text-emerald-200" : "text-slate-400")} />
                    <span className={cn("text-[11px] font-black uppercase tracking-widest", isVotd ? "text-emerald-200" : "text-slate-400")}>Daily</span>
                  </div>
                  <div className={cn("text-sm font-extrabold leading-tight", isVotd ? "text-white" : "text-slate-500")}>Verse of the Day</div>
                </button>
                <button
                  type="button"
                  onClick={switchToYourVerse}
                  className={cn(
                    "rounded-xl py-3 px-4 transition-all duration-200 text-left",
                    !isVotd
                      ? "bg-sky-600 shadow-md"
                      : "hover:bg-white/60"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <Search className={cn("w-3.5 h-3.5 flex-shrink-0", !isVotd ? "text-sky-200" : "text-slate-400")} />
                    <span className={cn("text-[11px] font-black uppercase tracking-widest", !isVotd ? "text-sky-200" : "text-slate-400")}>Search</span>
                  </div>
                  <div className={cn("text-sm font-extrabold leading-tight", !isVotd ? "text-white" : "text-slate-500")}>Your Verse</div>
                </button>
              </div>

              {/* Your Verse search — only shown when in your_verse mode */}
              {!isVotd ? (
                <div className="space-y-2 animate-enter">
                  <input
                    list="bible-books-list"
                    value={devotional.verseRef}
                    autoFocus
                    onChange={(e) => onUpdate({ verseRef: e.target.value, verseText: "", scriptureSource: "your_verse" })}
                    onBlur={(e) => {
                      const normalized = normalizeVerseReferenceInput(e.target.value);
                      if (normalized && normalized !== e.target.value) onUpdate({ verseRef: normalized, scriptureSource: "your_verse" });
                    }}
                    placeholder="e.g. John 15:5 or Psalm 23:1"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-300"
                  />
                  <datalist id="bible-books-list">{BIBLE_BOOKS.map((b) => <option key={b} value={b} />)}</datalist>
                  {smartBookSuggestions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {smartBookSuggestions.map((book) => (
                        <button
                          key={book}
                          type="button"
                          onClick={() => handleBookSuggestionPick(book)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 hover:border-sky-200 hover:bg-sky-50 transition-colors"
                        >
                          {book}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {fetching ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Looking up verse…
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Shared verse display card — same for both modes */}
              <div className={cn(
                "rounded-3xl border p-5 transition-all",
                isVotd
                  ? "border-emerald-100 bg-emerald-50/50"
                  : verseText
                    ? "border-sky-100 bg-sky-50/50 animate-enter"
                    : "border-slate-100 bg-slate-50"
              )}>
                {(verseRef || isVotd) ? (
                  <>
                    <div className={cn("text-xs font-black uppercase tracking-wide", isVotd ? "text-emerald-700" : "text-sky-700")}>
                      {devotional.verseRef || verseOfDay.verseRef}{version ? ` (${version})` : ""}
                    </div>
                    <div className="mt-2 text-base leading-relaxed font-serif-scripture text-slate-800 whitespace-pre-wrap">
                      {devotional.verseText || (isVotd ? verseOfDay.verseText : "")}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400 font-medium italic">Your verse will appear here once you type a reference above.</div>
                )}
              </div>

              <button type="button" disabled={!verseReady} onClick={() => goToStep(2)} className="w-full rounded-2xl bg-emerald-600 disabled:opacity-40 text-white py-3 font-extrabold">
                Use this verse
              </button>
            </div>
          </Card>
        );
      })() : null}

      {step === 2 ? (
        <Card>
          <div className="space-y-4">
            {/* Heading + mood row */}
            <div className="flex items-start justify-between gap-3">
              <div className="text-2xl font-black text-slate-900 leading-tight">Write your reflection</div>
              {devotional.mood ? (
                <span className="shrink-0 mt-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
                  {MOODS.find(m => m.id === devotional.mood)?.label || devotional.mood}
                </span>
              ) : null}
            </div>

            {/* Verse reminder — collapsed pill so user never loses their scripture */}
            <VersePill verseRef={devotional.verseRef || verseOfDay.verseRef} verseText={devotional.verseText || (devotional.scriptureSource !== "your_verse" ? verseOfDay.verseText : "")} />

            {/* Guided writing prompt — only shows when mood is set */}
            {devotional.mood ? (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800 font-medium italic animate-enter">
                💭 {moodPrompt[devotional.mood] || "What is God showing you in this verse?"}
              </div>
            ) : null}

            {/* Content tabs ABOVE textarea */}
            <div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 mb-3">
                {[
                  { k: "reflection", label: "Reflection" },
                  { k: "prayer", label: "Prayer" },
                  { k: "questions", label: "Questions" },
                ].map(({ k, label }) => (
                  <button key={k} type="button" onClick={() => setContentTab(k)}
                    className={cn("rounded-xl py-2 text-xs font-extrabold transition-all", contentTab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                    {label}
                    {k !== "reflection" && devotional[k]?.trim() ? (
                      <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Undo / Redo */}
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={doUndo} disabled={!canUndo || busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-30 hover:border-slate-400 hover:text-slate-700 transition-all">
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button type="button" onClick={doRedo} disabled={!canRedo || busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-30 hover:border-slate-400 hover:text-slate-700 transition-all">
                  <Redo2 className="w-3.5 h-3.5" /> Redo
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={contentTab === "reflection" ? devotional.reflection : contentTab === "prayer" ? devotional.prayer : devotional.questions}
                onChange={(e) => {
                  const patch = { [contentTab]: e.target.value };
                  onUpdate(patch);
                  pushHistory({ reflection: devotional.reflection, prayer: devotional.prayer, questions: devotional.questions, ...patch });
                }}
                placeholder={
                  contentTab === "reflection"
                    ? (devotional.mood ? "Start writing… there are no rules here." : "Select a mood above, then write freely.")
                    : contentTab === "prayer"
                      ? "Write a prayer based on this verse…"
                      : "Questions this verse raises for you…"
                }
                rows={10}
                spellCheck
                autoCorrect="on"
                autoCapitalize="sentences"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-relaxed outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
              />
              <div className="text-right text-[11px] text-slate-400 mt-1">
                {String(contentTab === "reflection" ? devotional.reflection : contentTab === "prayer" ? devotional.prayer : devotional.questions || "").trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            {/* CTA — clear next step name */}
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="w-full rounded-2xl bg-emerald-600 text-white py-3.5 font-extrabold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Polish &amp; Preview
            </button>
            {!heartReady ? (
              <div className="text-xs text-center text-slate-400 -mt-2">Add a reflection, prayer, or question to continue.</div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <div className="space-y-4">
            {/* Heading — clearly different from Step 2, shows mood context */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black text-slate-900">Polish your writing</div>
                <div className="text-sm text-slate-500 mt-1 font-medium">Refine with AI, then choose where to post.</div>
              </div>
              {devotional.mood ? (
                <span className="shrink-0 mt-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
                  {MOODS.find(m => m.id === devotional.mood)?.label || devotional.mood}
                </span>
              ) : null}
            </div>

            {/* Optional title */}
            <input
              value={devotional.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Give it a title (optional)"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-serif-scripture font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
            />

            {/* Tabs ABOVE textarea */}
            <div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 mb-3">
                {[
                  { k: "reflection", label: "Reflection" },
                  { k: "prayer", label: "Prayer" },
                  { k: "questions", label: "Questions" },
                ].map(({ k, label }) => (
                  <button key={k} type="button" onClick={() => setContentTab(k)}
                    className={cn("rounded-xl py-2 text-xs font-extrabold transition-all", contentTab === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                    {label}
                    {k !== "reflection" && devotional[k]?.trim() ? (
                      <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 align-middle" />
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Undo / Redo */}
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={doUndo} disabled={!canUndo || busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-30 hover:border-slate-400 hover:text-slate-700 transition-all">
                  <Undo2 className="w-3.5 h-3.5" /> Undo
                </button>
                <button type="button" onClick={doRedo} disabled={!canRedo || busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 disabled:opacity-30 hover:border-slate-400 hover:text-slate-700 transition-all">
                  <Redo2 className="w-3.5 h-3.5" /> Redo
                </button>
              </div>

              {/* AI toolbar */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => void doDraftForMe()} disabled={busy || aiNeedsKey}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs font-extrabold disabled:opacity-40 hover:bg-emerald-700 transition-all tool-spring">
                  <Sparkles className="w-3.5 h-3.5" /> AI Draft
                </button>
                <button onClick={() => void doFix()} disabled={busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40 hover:border-slate-400 transition-all tool-spring">
                  <Check className="w-3.5 h-3.5" /> Fix Grammar
                </button>
                <button onClick={() => void doLength("shorten")} disabled={busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40 hover:border-slate-400 transition-all tool-spring">
                  <ArrowUpToLine className="w-3.5 h-3.5" /> Shorten
                </button>
                <button onClick={() => void doLength("lengthen")} disabled={busy}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40 hover:border-slate-400 transition-all tool-spring">
                  <ArrowDownToLine className="w-3.5 h-3.5" /> Expand
                </button>
                <div className="relative">
                  <button onClick={() => setToneMenuOpen((o) => !o)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-400 transition-all tool-spring">
                    <Wand2 className="w-3.5 h-3.5" /> Tone
                  </button>
                  {toneMenuOpen ? (
                    <div className="absolute bottom-full left-0 mb-1 z-30 w-44 rounded-xl border bg-white shadow-lg overflow-hidden">
                      {["Reverent","Poetic","Direct","Encouraging","Conversational"].map((t) => (
                        <button key={t} onClick={() => void doTone(t)} className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">{t}</button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Verse context pill */}
              <VersePill verseRef={devotional.verseRef || verseOfDay.verseRef} verseText={devotional.verseText || (devotional.scriptureSource !== "your_verse" ? verseOfDay.verseText : "")} />

              {/* Empty state guidance */}
              {!devotional.reflection && !devotional.prayer && !devotional.questions && contentTab === "reflection" ? (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 font-medium animate-enter">
                  💡 No reflection yet — go back to Step 2 to write, or use <strong>AI Draft</strong> above to generate a starting point.
                </div>
              ) : null}

              {/* Textarea — same editing surface, clearly labeled as the polishing area */}
              <textarea
                value={contentTab === "reflection" ? devotional.reflection : contentTab === "prayer" ? devotional.prayer : devotional.questions}
                onChange={(e) => {
                  const patch = { [contentTab]: e.target.value };
                  onUpdate(patch);
                  pushHistory({ reflection: devotional.reflection, prayer: devotional.prayer, questions: devotional.questions, ...patch });
                }}
                placeholder={
                  contentTab === "reflection" ? "Your reflection…"
                  : contentTab === "prayer" ? "Your prayer…"
                  : "Questions this verse raises…"
                }
                rows={10}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base leading-relaxed outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <div className="text-[11px] text-slate-400">
                  {String(contentTab === "reflection" ? devotional.reflection : contentTab === "prayer" ? devotional.prayer : devotional.questions || "").trim().split(/\s+/).filter(Boolean).length} words
                </div>
                <span className={cn("text-[11px] font-extrabold", over ? "text-red-600" : count > limit * 0.8 ? "text-amber-600" : "text-emerald-600")}>
                  {count}/{limit}
                </span>
              </div>
              {over ? (
                <button onClick={() => void doLength("shorten")} className="mt-1 text-xs font-bold underline text-red-600">
                  Auto-Shorten to fit
                </button>
              ) : null}
            </div>

            {/* Platform selector — clearly labeled, prominent */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Where are you posting?</div>
              <div className="flex flex-wrap gap-2">
                {(settings.myPlatforms && settings.myPlatforms.length ? settings.myPlatforms : ["tiktok","instagram","twitter","facebook","email"]).map((p) => {
                  const labels = { tiktok: "TikTok", instagram: "Instagram", twitter: "Twitter / X", facebook: "Facebook", email: "Email" };
                  return (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn("rounded-full px-3 py-1.5 text-xs font-extrabold border transition-all",
                        platform === p ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                      )}>
                      {labels[p] || p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview & Post CTA */}
            <button type="button" onClick={() => goToStep(4)} disabled={!heartReady}
              className="w-full rounded-2xl bg-slate-900 text-white py-3.5 font-extrabold disabled:opacity-40 flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" /> Preview &amp; Post
            </button>
          </div>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <div className="space-y-4">
            {/* Step 4 heading */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900">Ready to post</div>
                <div className="text-sm text-slate-500 mt-0.5 font-medium">Review your caption, then share.</div>
              </div>
            </div>

            {/* Verse reminder */}
            <VersePill verseRef={devotional.verseRef || verseOfDay.verseRef} verseText={devotional.verseText || (devotional.scriptureSource !== "your_verse" ? verseOfDay.verseText : "")} />

            {/* Platform confirmation — shows what was chosen in Step 3, collapsible change */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posting to</div>
                  <span className="rounded-full bg-slate-900 text-white text-xs font-extrabold px-3 py-1">
                    {{ tiktok: "TikTok", instagram: "Instagram", twitter: "Twitter / X", facebook: "Facebook", email: "Email" }[platform] || platform}
                  </span>
                </div>
                <button type="button" onClick={() => setChangingPlatform(v => !v)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                  {changingPlatform ? "Done" : "Change"}
                </button>
              </div>
              {changingPlatform ? (
                <div className="flex flex-wrap gap-2 mt-3 animate-enter">
                  {[
                    { id: "tiktok", label: "TikTok", Icon: TikTokIcon },
                    { id: "instagram", label: "Instagram", Icon: InstagramIcon },
                    { id: "twitter", label: "X", Icon: XIcon },
                    { id: "facebook", label: "Facebook", Icon: FacebookIcon },
                    { id: "email", label: "Email", Icon: EmailIcon },
                  ].map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => { setPlatform(id); setChangingPlatform(false); }}
                      className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold border flex items-center gap-1.5 transition-all",
                        platform === id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                      )}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {platform === "tiktok" ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-700 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">✓ Caption will be copied to clipboard when TikTok opens.</div>
                {/* TikTok power tools — script + visual export */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TikTok Tools</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTikTokScriptModal(true)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> AI Script
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTikTokExportModal(true)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" /> Visual Card
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Script: AI writes a hook + talking points. Visual Card: exportable image for overlay.</div>
                </div>
              </div>
            ) : null}

            <SocialPreview platform={platform} devotional={devotional} settings={settings} text={postText} />

            <div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className={cn("h-full", postText.length>limit?"bg-red-500":postText.length>limit*0.8?"bg-amber-500":"bg-emerald-500")} style={{ width: `${Math.min(100, (postText.length/limit)*100)}%` }} /></div>
              <div className="text-xs mt-1 text-slate-500">{postText.length} / {limit}</div>
            </div>

            {platform === "instagram" ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIgMode("caption")} className={cn("rounded-full px-3 py-1 text-xs font-bold border", igMode==="caption"?"bg-slate-900 text-white border-slate-900":"border-slate-200 text-slate-600")}>Text caption</button>
                  <button type="button" onClick={() => setIgMode("card")} className={cn("rounded-full px-3 py-1 text-xs font-bold border", igMode==="card"?"bg-slate-900 text-white border-slate-900":"border-slate-200 text-slate-600")}>Visual card</button>
                </div>
                {igMode === "card" ? (
                  <>
                    <div className="flex gap-1">{[["minimal","Minimal Light"],["dark","Dark Gradient"],["emerald","Emerald Brand"]].map(([k,l])=> <button key={k} onClick={()=>setIgBg(k)} className={cn("text-[10px] px-2 py-1 rounded border font-bold", igBg===k?"border-slate-900":"border-slate-200 text-slate-500")}>{l}</button>)}</div>
                    <div ref={igCardRef} className={cn("aspect-square rounded-3xl border p-6 flex flex-col justify-between", igBg==="minimal"?"bg-white":"", igBg==="dark"?"bg-gradient-to-br from-slate-900 to-slate-700 text-white":"", igBg==="emerald"?"bg-gradient-to-br from-emerald-600 to-teal-700 text-white":"")}> 
                      <div className="text-2xl font-serif-scripture leading-relaxed whitespace-pre-wrap">{devotional.verseText || postText.slice(0,220)}</div>
                      <div className="flex justify-between text-xs font-bold"><span>{devotional.verseRef || "Scripture"}</span><span>{settings.username || "@yourname"}</span></div>
                    </div>
                    <SmallButton onClick={() => void exportInstagramCard()}>Export PNG</SmallButton>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="sticky bottom-20 z-20 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow space-y-2">
              {sharedConfirm ? (
                /* Post-share confirmation state */
                <>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-xs font-semibold text-emerald-800">
                      Caption copied &amp; {platform === "email" ? "email opened" : `${platform[0].toUpperCase() + platform.slice(1)} opened`}. Mark this as posted once you publish.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ status: "posted", reviewed: true });
                      pushToast("Another seed planted 🌱");
                      setSharedConfirm(false);
                    }}
                    className="w-full rounded-2xl bg-emerald-600 text-white py-3.5 font-extrabold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Posted
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyAndOpen()}
                    className="w-full rounded-2xl border border-slate-200 text-slate-700 py-2.5 font-extrabold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Copy &amp; open again
                  </button>
                </>
              ) : (
                /* Pre-share state */
                <>
                  {typeof navigator !== "undefined" && navigator.share ? (
                    <button type="button" onClick={async () => { try { await navigator.share({ title: devotional.title || devotional.verseRef || "Devotional", text: postText }); setSharedConfirm(true); } catch {} }} className="w-full rounded-2xl bg-emerald-600 text-white py-3 font-extrabold">Share via…</button>
                  ) : null}
                  <button type="button" onClick={() => void copyAndOpen()} className="w-full rounded-2xl bg-slate-900 text-white py-3 font-extrabold">
                    Copy &amp; Open {platform[0].toUpperCase() + platform.slice(1)}
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <SmallButton onClick={() => { const s=encodeURIComponent(devotional.title||devotional.verseRef||"Encouragement"); window.location.href=`mailto:?subject=${s}&body=${encodeURIComponent(postText)}`; }}>Email Draft</SmallButton>
                    <SmallButton onClick={() => { window.location.href=`sms:?&body=${encodeURIComponent(postText)}`; }}>Text Draft</SmallButton>
                  </div>
                  <SmallButton onClick={() => { onUpdate({ status: "posted", reviewed: true }); pushToast("Another seed planted 🌱"); }} className="w-full">Already posted? Mark it ✓</SmallButton>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : null}
      {/* OCR Scan Modal */}
      {showOcrModal ? (
        <OcrScanModal
          settings={settings}
          mood={devotional.mood}
          onClose={() => setShowOcrModal(false)}
          onApplyToDevotional={(patch) => { onUpdate(patch); setShowOcrModal(false); }}
        />
      ) : null}

      {/* TikTok Script Modal */}
      {showTikTokScriptModal ? (
        <TikTokScriptModal
          devotional={devotional}
          settings={settings}
          onClose={() => setShowTikTokScriptModal(false)}
          onUpdate={onUpdate}
        />
      ) : null}

      {/* TikTok Export Modal */}
      {showTikTokExportModal ? (
        <TikTokExportModal
          devotional={devotional}
          settings={settings}
          onClose={() => setShowTikTokExportModal(false)}
        />
      ) : null}
    </div>
  );
}

function PolishView({ devotional, settings, onUpdate, onBackToWrite, onLooksGood, onGoShare }) {
  const { pushToast } = useToast();
  const [draft, setDraft] = useState({
    verseRef: devotional.verseRef || "",
    verseText: devotional.verseText || "",
    reflection: devotional.reflection || "",
    prayer: devotional.prayer || "",
    questions: devotional.questions || "",
  });

  useEffect(() => {
    setDraft({
      verseRef: devotional.verseRef || "",
      verseText: devotional.verseText || "",
      reflection: devotional.reflection || "",
      prayer: devotional.prayer || "",
      questions: devotional.questions || "",
    });
  }, [devotional.id, devotional.verseRef, devotional.verseText, devotional.reflection, devotional.prayer, devotional.questions]);

  const patch = (next) => {
    setDraft((d) => ({ ...d, ...next }));
    onUpdate(next);
  };

  const merged = { ...devotional, ...draft };
  const caption = compileForPlatform("tiktok", merged, settings);
  const words = String(draft.reflection || "").trim().split(/\s+/).filter(Boolean).length;
  const needsShort = words > 150;
  const hasTags = /#\w+/.test(caption);
  const hasHook = /^(pov|today|if you|when|stop|you|god)/i.test(String(caption || "").trim());

  const doShorten = async () => {
    try {
      const out = await aiRewriteLength(settings, { text: draft.reflection || "", mood: devotional.mood, direction: "shorten" });
      patch({ reflection: out });
    } catch {
      patch({ reflection: String(draft.reflection || "").split(/\s+/).slice(0, 120).join(" ") });
      pushToast("Shortened with fallback.");
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-enter">
      <Card>
        <div className="text-2xl font-black text-slate-900">Final Review</div>
        <div className="text-sm text-slate-500 mt-1 font-medium">Review and refine before you share.</div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="space-y-3">
            {[{k:"verseRef",l:"Scripture Ref",rows:1},{k:"verseText",l:"Scripture Text",rows:4},{k:"reflection",l:"Reflection",rows:8},{k:"prayer",l:"Prayer",rows:4},{k:"questions",l:"Questions",rows:4}].map(({k,l,rows}) => (
              <div key={k}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{l}</div>
                <textarea
                  value={draft[k] || ""}
                  onChange={(e) => patch({ [k]: e.target.value })}
                  rows={rows}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Preview (TikTok)</div>
            <div className="mt-2 text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{caption || "—"}</div>
          </Card>

          <Card>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI Suggestions</div>
            <div className="space-y-2">
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-2">
                <div className="text-xs text-slate-700 flex-1">Your reflection is {words} words — TikTok captions perform best under 150. Shorten?</div>
                <SmallButton onClick={() => void doShorten()} disabled={!needsShort}>Shorten</SmallButton>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-2">
                <div className="text-xs text-slate-700 flex-1">No hashtags detected — add some?</div>
                <SmallButton onClick={() => patch({ reflection: `${draft.reflection || ""}

#Faith #Jesus #Devotional` })} disabled={hasTags}>Add</SmallButton>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-2">
                <div className="text-xs text-slate-700 flex-1">Strong hook missing — draft one?</div>
                <SmallButton onClick={() => patch({ reflection: `POV: God met me right here today.

${draft.reflection || ""}` })} disabled={hasHook}>Draft Hook</SmallButton>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex gap-2 pb-4">
        <SmallButton onClick={onBackToWrite} icon={ChevronLeft}>Edit</SmallButton>
        <SmallButton onClick={onLooksGood} icon={Check}>Looks Good ✓</SmallButton>
        <div className="flex-1" />
        <SmallButton onClick={onGoShare} tone="primary" icon={Share2}>Share Now</SmallButton>
      </div>
    </div>
  );
}

function LibraryView({ devotionals, onOpen, onDelete, onDuplicate, onMarkPosted, onBack }) {
  const [q, setQ] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [filter, setFilter] = useState("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // Default all groups to expanded so no work is hidden on first open
  const defaultCollapsed = { ready: false, in_progress: false, draft: false, posted: false };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let results = devotionals;
    if (query) {
      results = results.filter((d) => {
        const hay = `${d.title} ${d.verseRef} ${d.reflection}`.toLowerCase();
        return hay.includes(query);
      });
    }

    if (filter !== "all") {
      results = results.filter((d) => getEntryQueueStatus(d).id === filter);
    }

    const withStatus = results.map((d) => ({ d, st: getEntryQueueStatus(d) }));
    withStatus.sort((a, b) => {
      if (sortOrder === "readiness") {
        const rank = { ready: 0, in_progress: 1, draft: 2, posted: 3 };
        return (rank[a.st.id] ?? 9) - (rank[b.st.id] ?? 9);
      }
      const da = new Date(a.d.updatedAt).getTime();
      const db = new Date(b.d.updatedAt).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return withStatus;
  }, [q, devotionals, sortOrder, filter]);

  const nextSort = () => {
    setSortOrder((s) => (s === "newest" ? "oldest" : s === "oldest" ? "readiness" : "newest"));
  };

    const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [collapsedItems, setCollapsedItems] = useState({});
  const toggleItem = (id) => setCollapsedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  const grouped = useMemo(() => {
    const buckets = { ready: [], in_progress: [], draft: [], posted: [] };
    filtered.forEach((item) => {
      const key = item.st.id;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(item);
    });
    return buckets;
  }, [filtered]);

  const sections = [
    { id: "ready", label: "Ready to Post" },
    { id: "in_progress", label: "In Progress" },
    { id: "draft", label: "Draft" },
    { id: "posted", label: "Posted" },
  ];

  return (
    <div className="space-y-5 pb-20 animate-enter">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors active:scale-95" title="Back">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-2xl font-black text-slate-900">Library</div>
              <div className="text-sm text-slate-500 mt-0.5 font-medium">{devotionals.length} {devotionals.length === 1 ? "entry" : "entries"}</div>
            </div>
          </div>
          <button type="button" onClick={nextSort} className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === "newest" ? "Newest" : sortOrder === "oldest" ? "Oldest" : "Readiness"}
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
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "ready", label: "Ready" },
            { id: "in_progress", label: "In Progress" },
            { id: "posted", label: "Posted" },
          ].map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-extrabold", filter === f.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200")}>
              {f.label}
            </button>
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        {sections.map((section) => {
          const items = grouped[section.id] || [];
          if (filter !== "all" && filter !== section.id) return null;
          if (items.length === 0 && q.trim()) return null;
          return (
            <div key={section.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="text-xs font-black uppercase tracking-widest text-slate-500">{section.label} ({items.length})</div>
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", !collapsed[section.id] ? "rotate-180" : "")} />
              </button>
              {!collapsed[section.id] ? (
                <div className="space-y-3 p-3 pt-0">
                  {items.map(({ d, st }) => (
                    <div key={d.id} className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-emerald-100">
                      <button onClick={() => toggleItem(d.id)} className="w-full text-left p-4 active:scale-[0.99] transition-transform" type="button">
                        <div className="flex items-center gap-2">
                          <div className="font-extrabold text-slate-900 text-[15px] leading-snug flex-1 flex items-center gap-1.5">{d.title || "Untitled"}{d.reviewed ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : null}</div>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-black", st.tone)}>{st.dot} {st.label}</span>
                          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform", !collapsedItems[d.id] ? "rotate-180" : "")} />
                        </div>
                        {d.verseRef ? <div className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wide">{d.verseRef}</div> : null}
                      </button>

                      {!collapsedItems[d.id] ? (
                        <>
                          {d.reflection ? <div className="px-4 pb-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">{d.reflection}</div> : null}
                          <div className="text-[11px] text-slate-300 px-4 pb-2 font-medium">{new Date(d.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                          {/* Action buttons — clear labels, no abbreviations */}
                          <div className="px-3 pb-3 space-y-2">
                            <button
                              type="button"
                              onClick={() => onOpen(d.id)}
                              className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-xs font-extrabold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <PenTool className="w-3.5 h-3.5" /> Open &amp; Edit
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => onDuplicate(d.id)}
                                className="rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Copy className="w-3.5 h-3.5" /> Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => onMarkPosted(d.id)}
                                className="rounded-xl border border-slate-200 py-2 text-xs font-extrabold text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Mark Posted
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(d.id)}
                              className="w-full rounded-xl border border-red-100 bg-red-50 py-2 text-xs font-extrabold text-red-500 hover:bg-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete entry
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <BookOpen className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-sm font-bold text-slate-400">{q ? "No matches found." : "No entries yet. Start one!"}</div>
          </div>
        ) : null}
      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDeleteId ? (() => {
        const entry = devotionals.find(d => d.id === confirmDeleteId);
        const title = entry?.title || entry?.verseRef || "this entry";
        return (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-enter">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">Delete entry?</div>
                  <div className="text-sm text-slate-500 mt-0.5 font-medium">
                    "<span className="text-slate-700 font-semibold">{title}</span>" will be permanently removed. This cannot be undone.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                className="w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white py-3.5 font-extrabold transition-colors"
              >
                Yes, delete entry
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="w-full rounded-2xl border border-slate-200 text-slate-700 py-3 font-extrabold hover:bg-slate-50 transition-colors"
              >
                Keep it
              </button>
            </div>
          </div>
        );
      })() : null}
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

function NotificationSettingsCard() {
  const { pushToast } = useToast();
  const [status, setStatus] = useState(() => {
    if (typeof Notification === "undefined") return "unsupported";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    const p = loadNotifPref();
    return p?.enabled ? "granted" : "idle";
  });
  const [time, setTime] = useState(() => loadNotifPref()?.time || "08:00");
  const [busy, setBusy] = useState(false);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const { status: s } = await requestNotificationPermission();
      if (s === "granted") {
        const token = await getFCMToken();
        saveNotifPref({ enabled: true, time, token });
        if (token) localStorage.setItem(STORAGE_FCM_TOKEN, token);
        pushToast("Reminders on ✓");
        setStatus("granted");
      } else {
        setStatus(s);
        if (s === "denied") pushToast("Notifications blocked — enable in browser settings.");
      }
    } finally { setBusy(false); }
  };

  const handleDisable = () => {
    saveNotifPref({ enabled: false });
    pushToast("Reminders turned off");
    setStatus("idle");
  };

  if (status === "unsupported") {
    return <div className="text-xs text-slate-400 font-medium">Push notifications are not supported on this browser.</div>;
  }

  return (
    <div className="space-y-3">
      {status === "granted" ? (
        <>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
            <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 text-xs font-semibold text-emerald-800">Daily reminder is on</div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reminder time</label>
            <input type="time" value={time}
              onChange={(e) => { setTime(e.target.value); const p = loadNotifPref(); saveNotifPref({ ...p, time: e.target.value }); }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold bg-white outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>
          <button type="button" onClick={handleDisable}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
            <BellOff className="w-3.5 h-3.5" /> Turn off reminders
          </button>
        </>
      ) : status === "denied" ? (
        <div className="text-xs text-amber-700 font-semibold rounded-xl bg-amber-50 border border-amber-200 p-3">
          Notifications are blocked. Open your browser's site settings to allow them.
        </div>
      ) : (
        <>
          <div className="text-xs text-slate-500 leading-relaxed">Get a daily nudge to write, reflect, and post your faith.</div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Preferred time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold bg-white outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>
          <button type="button" onClick={handleEnable} disabled={busy}
            className="w-full rounded-2xl bg-emerald-600 text-white py-3 font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-emerald-700 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            {busy ? "Requesting…" : "Turn on daily reminders"}
          </button>
        </>
      )}
    </div>
  );
}

function SettingsView({ settings, onUpdate, onReset, onLogout, devotionals, onBack }) {
  const { pushToast } = useToast();
  const [aiOpen, setAiOpen] = useState(false);

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

  const CompactToggleRow = ({ title, desc, checked, onChange }) => (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer">
      <div>
        <div className="text-sm font-extrabold text-slate-800 leading-tight">{title}</div>
        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{desc}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
    </label>
  );

  const aiSummary = settings.aiProvider === "mock"
    ? "AI: Built-in (no key)"
    : settings.aiProvider === "openai"
      ? `AI: OpenAI (${settings.openaiKey ? "key set" : "missing key"})`
      : `AI: Gemini (${settings.geminiKey ? "key set" : "missing key"})`;

  const platforms = [
    { id: "tiktok", label: "TikTok" },
    { id: "instagram", label: "Instagram" },
    { id: "twitter", label: "Twitter" },
    { id: "facebook", label: "Facebook" },
    { id: "email", label: "Email" },
  ];

  const selectedPlatforms = Array.isArray(settings.myPlatforms) && settings.myPlatforms.length ? settings.myPlatforms : ["tiktok"];

  const togglePlatform = (id) => {
    const set = new Set(selectedPlatforms);
    if (set.has(id)) set.delete(id); else set.add(id);
    const next = Array.from(set);
    onUpdate({ myPlatforms: next.length ? next : ["tiktok"] });
  };

  const [writingOpen, setWritingOpen] = React.useState(false);

  return (
    <div className="space-y-3 pb-20 animate-enter">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pb-1">
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors active:scale-95" title="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-2xl font-black text-slate-900">Settings</div>
      </div>

      {/* ── SECTION 1: Profile ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Profile</div>
      <Card>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name / Username</label>
        <input
          value={settings.username || ""}
          onChange={(e) => onUpdate({ username: e.target.value })}
          placeholder="@yourname"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
        />
        <div className="mt-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-extrabold transition-all", selectedPlatforms.includes(p.id) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── SECTION 3: AI ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">AI Writing Assistant</div>
      <Card>

        {/* Mode explainer — always visible */}
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3 mb-3">
          {[
            {
              id: "mock",
              label: "Built-in",
              badge: "Free · No setup",
              badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              desc: "Template-based suggestions. Works immediately, no account needed. Great for getting started.",
            },
            {
              id: "openai",
              label: "OpenAI GPT-4",
              badge: "Paid · Best quality",
              badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
              desc: "Highest quality AI writing. Requires an OpenAI API key (~$0.01–0.05 per session).",
              link: "https://platform.openai.com/api-keys",
              linkLabel: "Get a key at platform.openai.com →",
            },
            {
              id: "gemini",
              label: "Google Gemini",
              badge: "Free tier available",
              badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
              desc: "Google's AI model. Generous free tier. Requires a Google AI Studio API key.",
              link: "https://aistudio.google.com/app/apikey",
              linkLabel: "Get a key at aistudio.google.com →",
            },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onUpdate({ aiProvider: mode.id })}
              className={cn(
                "w-full text-left rounded-2xl border p-3.5 transition-all",
                settings.aiProvider === mode.id
                  ? "border-emerald-400 bg-white shadow-sm ring-2 ring-emerald-100"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  settings.aiProvider === mode.id ? "border-emerald-500" : "border-slate-300"
                )}>
                  {settings.aiProvider === mode.id && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
                <span className="text-sm font-extrabold text-slate-900">{mode.label}</span>
                <span className={cn("ml-auto rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", mode.badgeColor)}>
                  {mode.badge}
                </span>
              </div>
              <div className="text-xs text-slate-500 leading-relaxed ml-6">{mode.desc}</div>
              {mode.link && settings.aiProvider === mode.id ? (
                <a
                  href={mode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 ml-6 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  {mode.linkLabel}
                </a>
              ) : null}
            </button>
          ))}
        </div>

        {/* Key input — only shown when a paid provider is selected */}
        {settings.aiProvider === "openai" ? (
          <div className="space-y-2">
            {aiNeedsKey ? (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs font-semibold text-amber-800">
                  Paste your OpenAI key below to enable AI Draft, Fix Grammar, Shorten, Expand, and Tone.
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-xs font-semibold text-emerald-800">OpenAI key saved. AI tools are active.</div>
              </div>
            )}
            <input
              value={settings.openaiKey}
              onChange={(e) => onUpdate({ openaiKey: e.target.value })}
              placeholder="sk-…"
              type="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
            />
            <AiKeyTestButton provider="openai" apiKey={settings.openaiKey} />
          </div>
        ) : null}

        {settings.aiProvider === "gemini" ? (
          <div className="space-y-2">
            {aiNeedsKey ? (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs font-semibold text-amber-800">
                  Paste your Gemini key below to enable AI tools.
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-xs font-semibold text-emerald-800">Gemini key saved. AI tools are active.</div>
              </div>
            )}
            <input
              value={settings.geminiKey}
              onChange={(e) => onUpdate({ geminiKey: e.target.value })}
              placeholder="AIza…"
              type="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-100"
            />
            <AiKeyTestButton provider="gemini" apiKey={settings.geminiKey} />
          </div>
        ) : null}

        {settings.aiProvider === "mock" ? (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 p-2.5">
            <CheckCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-xs font-semibold text-slate-600">
              Built-in mode active — no key needed. Upgrade to OpenAI or Gemini for smarter suggestions.
            </div>
          </div>
        ) : null}

        {/* OCR endpoint — advanced, tucked at the bottom */}
        <div className="pt-3 mt-1 border-t border-slate-100">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
            Bible Scan endpoint <span className="normal-case font-medium text-slate-300">— optional</span>
          </label>
          <input
            value={settings.ocrEndpoint || ""}
            onChange={(e) => onUpdate({ ocrEndpoint: e.target.value })}
            placeholder="https://your-app.vercel.app/api/ocr"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
          />
          <div className="mt-1.5 text-[11px] leading-relaxed">
            {settings.ocrEndpoint?.trim()
              ? <span className="text-emerald-600 font-semibold">&#10003; Scan active — a Scan button appears in Step 1 of the write flow.</span>
              : <span className="text-slate-400">Add a Vercel OCR endpoint to snap a photo of your Bible and auto-fill the verse.</span>
            }
          </div>
        </div>
      </Card>

      {/* ── SECTION 2: Writing ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">Writing</div>
      <Card>
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Bible Version</label>
        </div>
        <select
          value={settings.defaultBibleVersion}
          onChange={(e) => onUpdate({ defaultBibleVersion: e.target.value })}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-extrabold bg-white outline-none focus:ring-4 focus:ring-emerald-100"
        >
          {BIBLE_VERSIONS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

        {/* Collapsible advanced toggles */}
        <button type="button" onClick={() => setWritingOpen(v => !v)}
          className="mt-3 w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
          <span>Advanced options</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", writingOpen ? "rotate-180" : "")} />
        </button>
        {writingOpen ? (
          <div className="mt-2 divide-y divide-slate-100 animate-enter">
            <CompactToggleRow title="Auto-fill on topic tap" desc="Fill Title / Prayer / Questions when empty." checked={Boolean(settings.autoFillEmptyOnTopicTap)} onChange={(e) => onUpdate({ autoFillEmptyOnTopicTap: e.target.checked })} />
            <CompactToggleRow title="Auto-generate TikTok script" desc="Auto-generates in Draft for Me flow." checked={Boolean(settings.guidedAutoGenerateTikTok)} onChange={(e) => onUpdate({ guidedAutoGenerateTikTok: e.target.checked })} />
            <CompactToggleRow title="Include watermark" desc="Adds VersedUP branding on shares." checked={Boolean(settings.includeWatermark !== false)} onChange={(e) => onUpdate({ includeWatermark: e.target.checked })} />
          </div>
        ) : null}
      </Card>

      {/* ── SECTION 4: Appearance ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">Appearance</div>
      <Card>
        <div className="grid grid-cols-4 gap-2">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onUpdate({ theme: t.id })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl py-2.5 px-1 border transition-all active:scale-95",
                settings.theme === t.id ? "border-slate-900 shadow-md scale-[1.04]" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="w-8 h-8 rounded-xl shadow-sm border border-white/80"
                style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 0%, ${t.swatch[1]} 50%, ${t.swatch[2]} 100%)` }} />
              <span className={cn("text-[10px] font-bold leading-none", settings.theme === t.id ? "text-slate-900" : "text-slate-500")}>{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── SECTION 5: Data ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">Data</div>
      <Card>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]">
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer">
            <ArrowUpToLine className="w-4 h-4" /> Import JSON
            <input type="file" accept="application/json,.json" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  try {
                    const parsed = JSON.parse(String(ev.target.result || ""));
                    const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.entries) ? parsed.entries : null;
                    if (!incoming) { pushToast("Invalid backup file."); return; }
                    const valid = incoming.filter(d => d && typeof d === "object" && d.id);
                    if (!valid.length) { pushToast("No valid entries found."); return; }
                    if (!window.confirm(`Import ${valid.length} entr${valid.length === 1 ? "y" : "ies"}? Existing entries with the same ID will be updated.`)) return;
                    onUpdate({ _importEntries: valid });
                    pushToast(`Imported ${valid.length} entr${valid.length === 1 ? "y" : "ies"} ✓`);
                  } catch { pushToast("Could not read file — make sure it is a valid VersedUP JSON backup."); }
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">All data stays on this device. AI calls are the only external requests.</div>
      </Card>

      {/* ── SECTION 5b: Notifications ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">Notifications</div>
      <Card>
        <NotificationSettingsCard />
      </Card>

      {/* ── SECTION 6: Account ── */}
      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1 pt-1">Account</div>
      <Card>
        <SmallButton onClick={onLogout} tone="danger" icon={LogOut}>Sign out</SmallButton>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onReset}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-100 transition-all active:scale-[0.98]">
            <Trash2 className="w-3.5 h-3.5" /> Reset all local data
          </button>
          <div className="mt-1.5 text-[10px] text-slate-400 text-center">This cannot be undone.</div>
        </div>
      </Card>
    </div>
  );
}

/* ---------------- Compile + previews ---------------- */

const PLATFORM_HASHTAGS = {
  tiktok:    "#Faith #Devotional #Jesus #ChristianTikTok",
  instagram: "#Faith #Devotional #Jesus #ScriptureOfTheDay",
  twitter:   "#Faith #Jesus",
  facebook:  "#Faith #Devotional",
  email:     "",
};

function compileForPlatform(platform, d, settings) {
  const nl = "\n";
  const verseLine = d.verseRef ? `"${d.verseText || ""}"${nl}— ${d.verseRef}${nl}${nl}` : "";
  const titleLine = d.title ? `${d.title}${nl}${nl}` : "";
  const body = d.reflection || "";
  const prayer = d.prayer ? `${nl}${nl}Prayer:${nl}${d.prayer}` : "";
  const questions = d.questions ? `${nl}${nl}Questions:${nl}${d.questions}` : "";
  const allUserText = body + (d.prayer || "") + (d.questions || "");
  const userHasTags = /#\w+/.test(allUserText);
  const tags = (!userHasTags && PLATFORM_HASHTAGS[platform]) ? nl + nl + PLATFORM_HASHTAGS[platform] : "";

  // Smart truncation helper — fits text into limit, always preserving tags
  const fitToLimit = (parts, limit) => {
    if (!limit) return parts.join("").trim();
    const tagStr = tags;
    const tagLen = tagStr.length;
    const available = limit - tagLen;
    let result = "";
    for (const part of parts) {
      if ((result + part).length <= available) result += part;
      else if (result.length < available) {
        // Truncate this part to fit, break at word boundary
        const room = available - result.length - 1;
        const trimmed = part.slice(0, room).replace(/\s+\S*$/, "");
        result += trimmed + "…";
        break;
      } else break;
    }
    return (result + (result.trim() ? tagStr : "")).trim();
  };

  if (platform === "tiktok") {
    const base = d.tiktokScript || `POV: You needed this today ✨${nl}${nl}${d.verseRef || ""}${nl}${nl}${body}${nl}${nl}Save this for later ❤️`;
    const baseTags = /#\w+/.test(base) ? "" : tags;
    const full = (base + baseTags).trim();
    return full.length <= 2200 ? full : full.slice(0, 2197) + "…";
  }
  if (platform === "instagram") {
    return fitToLimit([titleLine, verseLine, body, questions, prayer], 2200);
  }
  if (platform === "twitter") {
    return fitToLimit([body, questions ? nl + nl + "Q: " + d.questions.split(nl)[0] : ""], 280);
  }
  if (platform === "email") {
    return `Subject: ${d.verseRef || "Encouragement"}${nl}${nl}Hi friend,${nl}${nl}${verseLine}${body}${prayer}${nl}${nl}Blessings,${nl}${settings.username || ""}`.trim();
  }
  // facebook, generic — generous limit
  return fitToLimit([titleLine, verseLine, body, questions, prayer], PLATFORM_LIMITS[platform] || 0);
}

function CompileView({ devotional, settings, onUpdate, onBackToWrite }) {
  const { pushToast } = useToast();
  const [platform, setPlatform] = useState(() => (settings.myPlatforms && settings.myPlatforms[0]) || "tiktok");
  const [text, setText] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [tiktokOverlay, setTiktokOverlay] = useState(false);
  const [ttCountdown, setTtCountdown] = useState(2);
  const [showTikTokScript, setShowTikTokScript] = useState(false);
  const [inlineScriptBusy, setInlineScriptBusy] = useState(false);
  const [igBg, setIgBg] = useState("white");
  const igCardRef = useRef(null);

  useEffect(() => {
    setText(compileForPlatform(platform, devotional, settings));
  }, [platform, devotional, settings]);

  useEffect(() => {
    if (!tiktokOverlay) return;
    if (ttCountdown <= 0) {
      window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
      setTiktokOverlay(false);
      setTtCountdown(2);
      return;
    }
    const t = setTimeout(() => setTtCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [tiktokOverlay, ttCountdown]);

  const limit = PLATFORM_LIMITS[platform] || 999999;
  const charCount = text.length;
  const pct = Math.min(1, charCount / limit);
  const over = charCount > limit;

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
        await navigator.share({ title: devotional.title || devotional.verseRef || "Devotional", text, url: window.location.href });
      } else {
        await copy();
      }
    } catch {}
    finally { setShareBusy(false); }
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
    await copy();
    const u = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank", "noopener,noreferrer");
  };

  const shareToX = async () => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, "_blank", "noopener,noreferrer");
  };

  const shareToTikTok = async () => {
    await copy();
    setTiktokOverlay(true);
    setTtCountdown(2);
  };

  const shareToInstagram = async () => {
    await copy();
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

  const generateInlineScript = async (mode = "regenerate") => {
    setInlineScriptBusy(true);
    try {
      const out = await aiTikTokScript(settings, {
        verseRef: devotional.verseRef,
        verseText: devotional.verseText,
        reflection: devotional.reflection,
        mood: devotional.mood,
        baseScript: devotional.tiktokScript || "",
        mode,
      });
      onUpdate({ tiktokScript: out });
      setText(out);
      setShowTikTokScript(true);
    } catch (e) {
      pushToast(e?.message || "AI failed.");
    } finally {
      setInlineScriptBusy(false);
    }
  };

  const exportInstagramCard = async () => {
    try {
      const dataUrl = await toPng(igCardRef.current, { cacheBust: true });
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `instagram-card-${(devotional.verseRef || "verse").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      a.click();
      pushToast("Instagram card exported");
    } catch (e) {
      pushToast(e?.message || "Export failed");
    }
  };

  const tabDefs = [
    { id: "tiktok", label: "🎵 TikTok" },
    { id: "instagram", label: "📸 Instagram" },
    { id: "twitter", label: "🐦 Twitter" },
    { id: "facebook", label: "👥 Facebook" },
    { id: "email", label: "✉️ Email" },
  ];

  const igBgClass = igBg === "white" ? "bg-white" : igBg === "dark" ? "bg-gradient-to-br from-slate-900 to-slate-700 text-white" : "bg-gradient-to-br from-emerald-600 to-teal-700 text-white";

  return (
    <div className="space-y-5 pb-24 animate-enter relative">
      {tiktokOverlay ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto" />
            <div className="mt-3 text-lg font-black text-slate-900">Caption copied to clipboard!</div>
            <div className="mt-1 text-sm text-slate-600">Opening TikTok in {ttCountdown}… paste your caption to create a post.</div>
          </div>
        </div>
      ) : null}

      <div>
        <div className="text-2xl font-black text-slate-900">Launch Pad</div>
        <div className="text-sm text-slate-500 mt-1 font-medium">Ready to publish. Pick a platform and go.</div>
      </div>

      {/* FIX 5b: Platform colors on CompileView tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabDefs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn("shrink-0 rounded-full px-3 py-2 text-xs font-extrabold border", platform === p.id ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {over ? (
        <Card>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="text-sm font-extrabold text-red-700">{charCount - limit} characters over limit.</div>
            <SmallButton onClick={() => void autoShorten()} className="mt-2">Auto-Shorten</SmallButton>
          </div>
        </Card>
      ) : null}

      <Card>
        <SocialPreview platform={platform} devotional={devotional} settings={settings} text={text} />
        <div className="mt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none bg-slate-50"
          />
          <div className="mt-2">
            <span className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold",
              pct < 0.8 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : pct <= 1 ? "bg-amber-50 border-amber-200 text-amber-700 text-sm" : "bg-red-50 border-red-200 text-red-700"
            )}>
              {charCount} / {limit}
            </span>
          </div>
        </div>
      </Card>

      {platform === "tiktok" ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-slate-800">TikTok Script</div>
            <SmallButton onClick={() => setShowTikTokScript((v) => !v)}>{showTikTokScript ? "Hide" : "Show"}</SmallButton>
          </div>
          <div className="mt-2 flex gap-2">
            <SmallButton onClick={() => void generateInlineScript("regenerate")} disabled={inlineScriptBusy}>{inlineScriptBusy ? "Generating..." : "Generate Script"}</SmallButton>
            <SmallButton onClick={() => onUpdate({ tiktokScript: "" })} tone="neutral">Clear</SmallButton>
          </div>
          {showTikTokScript ? (
            <textarea
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 resize-none"
              rows={8}
              value={devotional.tiktokScript || ""}
              onChange={(e) => { onUpdate({ tiktokScript: e.target.value }); setText(e.target.value); }}
            />
          ) : null}
        </Card>
      ) : null}

      {platform === "instagram" ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-black text-slate-800">Instagram Visual Card Export</div>
            <div className="flex gap-1">
              {["white","dark","emerald"].map((bg) => (
                <button key={bg} onClick={() => setIgBg(bg)} className={cn("px-2 py-1 rounded-lg text-[10px] font-bold border", igBg===bg?"border-slate-900 text-slate-900":"border-slate-200 text-slate-500")}>{bg}</button>
              ))}
            </div>
          </div>
          <div ref={igCardRef} className={cn("mt-3 aspect-square rounded-3xl border p-6 flex flex-col justify-between", igBgClass)}>
            <div className="text-2xl leading-relaxed font-serif-scripture whitespace-pre-wrap">{devotional.verseText || text.slice(0, 220)}</div>
            <div className="flex items-end justify-between text-xs font-bold">
              <span>{devotional.verseRef || "Scripture"} {devotional.bibleVersion ? `(${devotional.bibleVersion})` : ""}</span>
              <span>{settings.username || "@yourname"}</span>
            </div>
          </div>
          <SmallButton onClick={() => void exportInstagramCard()} className="mt-3">Export PNG</SmallButton>
        </Card>
      ) : null}

      <div className="sticky bottom-20 z-20">
        <div className="rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl p-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <SmallButton onClick={copy} icon={Copy} tone="neutral">Copy</SmallButton>
            <SmallButton onClick={() => void shareNow()} icon={ICONS.actions.shareNow} disabled={shareBusy} tone="primary">{shareBusy ? "Sharing..." : "Share"}</SmallButton>
          </div>
          {(platform === "tiktok" || platform === "instagram" || platform === "facebook" || platform === "twitter") ? (
            <SmallButton
              onClick={() => {
                if (platform === "tiktok") void shareToTikTok();
                else if (platform === "instagram") void shareToInstagram();
                else if (platform === "facebook") void shareToFacebook();
                else if (platform === "twitter") void shareToX();
              }}
              className="w-full justify-center"
              tone="neutral"
            >
              Open in {platform === "tiktok" ? "TikTok" : platform === "instagram" ? "Instagram" : platform === "facebook" ? "Facebook" : "Twitter / X"}
            </SmallButton>
          ) : null}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <SmallButton onClick={openEmailDraft}>Email Draft</SmallButton>
            <SmallButton onClick={openTextDraft}>Text Draft</SmallButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialPreview({ platform, devotional, settings, text }) {
  switch (platform) {
    case "instagram":
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
          <span className="ml-auto text-slate-400 text-lg">···</span>
        </div>
      );

    case "email":
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

    case "facebook":
      return (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="text-sm font-extrabold text-slate-900">Facebook Preview</div>
            <div className="text-xs text-slate-500">Link post style preview</div>
          </div>
          <div className="p-4">
            <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{text}</div>
          </div>
        </div>
      );

    case "twitter":
      return (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="text-sm font-extrabold text-slate-900">Twitter / X Preview</div>
            <div className="text-xs text-slate-500">Short-form feed post</div>
          </div>
          <div className="p-4">
            <div className="text-sm whitespace-pre-wrap text-slate-800 leading-relaxed">{text}</div>
          </div>
        </div>
      );

  default: return (
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

/* ---------------- Google OAuth helpers ---------------- */

// Replace with your actual Google OAuth Client ID from console.cloud.google.com
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });
}

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function GoogleSignInButton({ onSuccess, onError }) {
  const btnRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    loadGoogleScript().then(() => {
      if (cancelled || !window.google?.accounts?.id) {
        if (!cancelled) setReady(false);
        return;
      }
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const payload = parseJwt(response.credential);
            if (payload) {
              onSuccess({ name: payload.name || payload.email, email: payload.email, picture: payload.picture, sub: payload.sub });
            } else {
              onError("Sign-in failed. Please try again.");
            }
          },
          ux_mode: "popup",
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            type: "standard",
            shape: "pill",
            theme: "outline",
            size: "large",
            text: "continue_with",
            logo_alignment: "left",
            width: Math.min(btnRef.current.offsetWidth || 320, 400),
          });
        }
        setReady(true);
      } catch {
        setReady(false);
        onError("Google Sign-In could not be loaded.");
      }
    });
    return () => { cancelled = true; };
  }, [onSuccess, onError]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div ref={btnRef} className="w-full min-h-[44px] flex justify-center" />
      {!ready && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 flex items-center justify-center gap-3 text-sm font-semibold text-slate-500 opacity-70 cursor-not-allowed select-none">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </div>
      )}
    </div>
  );
}

/* ---------------- Entry flow ---------------- */

function LandingView({ onGetStarted, onViewDemo, onGoogleSuccess }) {
  const [googleError, setGoogleError] = React.useState("");
  const handleGoogleSuccess = React.useCallback((profile) => { onGoogleSuccess(profile); }, [onGoogleSuccess]);
  const handleGoogleError = React.useCallback((msg) => { setGoogleError(msg); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50 px-4 py-10 animate-enter flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white/80 backdrop-blur-xl p-10 shadow-2xl">
          <BrandLogo className="h-36 sm:h-40 w-auto mx-auto drop-shadow-md mb-6" />
          <h1 className="mt-4 text-3xl font-black text-slate-900 text-center tracking-tight leading-tight">Rooted in Christ,<br/>growing in His fruit.</h1>
          <p className="mt-4 text-base text-slate-600 text-center leading-relaxed font-medium">Create devotionals, polish your reflection, and share your faith.</p>

          <div className="mt-8 space-y-3">
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            {googleError ? <p className="text-xs text-red-500 font-bold text-center">{googleError}</p> : null}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs font-bold text-slate-300">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <button onClick={onViewDemo} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-extrabold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors" type="button">
              Continue as Guest
            </button>
          </div>
          <p className="mt-6 text-center text-[11px] text-slate-300 leading-relaxed">Your data stays on your device.</p>
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
        <button type="button" onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Card>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">One more thing</div>
          <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">What should we call you?</h2>
          <div className="mt-6">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus
              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg font-semibold outline-none focus:ring-4 focus:ring-emerald-100 transition-all" />
          </div>
          <div className="mt-6">
            <PrimaryButton onClick={() => onContinue({ mode: "signed-in", name: name.trim() || "Friend" })} icon={User}>Continue</PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OnboardingWizard({ authDraft, onFinish }) {
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState(authDraft?.name || "");
  const [version, setVersion] = useState("KJV");
  const [platforms, setPlatforms] = useState(["instagram", "tiktok"]);
  const [notifStatus, setNotifStatus] = useState(() => {
    const p = loadNotifPref();
    if (Notification?.permission === "granted") return "granted";
    if (Notification?.permission === "denied") return "denied";
    return p?.enabled ? "granted" : "idle";
  });
  const [notifTime, setNotifTime] = useState("08:00");
  const [notifBusy, setNotifBusy] = useState(false);
  const totalSlides = 5;

  const DEMO_PLATFORMS = [
    { id: "tiktok", label: "TikTok", emoji: "🎵" },
    { id: "instagram", label: "Instagram", emoji: "📸" },
    { id: "twitter", label: "X / Twitter", emoji: "🐦" },
    { id: "facebook", label: "Facebook", emoji: "👥" },
    { id: "email", label: "Email / Newsletter", emoji: "✉️" },
  ];

  const togglePlatform = (id) => {
    setPlatforms(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(p => p !== id) : prev) : [...prev, id]
    );
  };

  const handleRequestNotif = async () => {
    setNotifBusy(true);
    try {
      const { status } = await requestNotificationPermission();
      if (status === "granted") {
        const token = await getFCMToken();
        saveNotifPref({ enabled: true, time: notifTime, token });
        if (token) localStorage.setItem(STORAGE_FCM_TOKEN, token);
        setNotifStatus("granted");
      } else {
        setNotifStatus(status);
      }
    } finally {
      setNotifBusy(false);
    }
  };

  const finish = () => {
    onFinish({
      mode: authDraft?.mode || "guest",
      name: name.trim() || (authDraft?.mode === "guest" ? "Guest" : "Friend"),
      settingsPatch: {
        username: name.trim(),
        defaultBibleVersion: version,
        myPlatforms: platforms,
        onboardingComplete: true,
      },
      starterMood: "hopeful",
    });
  };

  const next = () => setSlide(s => Math.min(s + 1, totalSlides - 1));
  const back = () => setSlide(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-sky-50 px-4 py-8 animate-enter">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">

        {/* Progress dots */}
        {slide > 0 ? (
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div key={i} className={`transition-all duration-300 rounded-full ${
                i === slide ? "w-6 h-2 bg-emerald-500" : i < slide ? "w-2 h-2 bg-emerald-400" : "w-2 h-2 bg-slate-200"
              }`} />
            ))}
          </div>
        ) : <div className="mb-8" />}

        {/* ── SLIDE 0: Welcome ── */}
        {slide === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-enter">
            <BrandLogo className="h-32 w-auto object-contain drop-shadow-xl" />
            <div>
              <div className="text-4xl font-black text-slate-900 tracking-tight">VersedUP</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">Write. Reflect. Share.</div>
            </div>
            <div className="text-base text-slate-500 font-medium max-w-xs leading-relaxed">
              A daily space to capture God's word, write your heart, and share your faith — in one flowing motion.
            </div>
            <div className="w-full pt-4 space-y-3">
              <button type="button" onClick={next}
                className="w-full rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-base py-4 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99]">
                Get started
              </button>
              <button type="button" onClick={() => setSlide(4)}
                className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors py-1">
                Skip setup
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 1: Name ── */}
        {slide === 1 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-6">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 1 of 4</div>
              <h2 className="text-3xl font-black text-slate-900 mt-2 leading-tight">What should<br/>we call you?</h2>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or @handle"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && next()}
              className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-lg font-semibold outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 bg-white transition-all"
            />
            <div className="text-sm text-slate-400 font-medium">This appears on your shares and in the app greeting.</div>
            <div className="flex-1" />
            <div className="flex gap-3">
              <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={next}
                className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3.5 shadow-md hover:shadow-lg transition-all">
                {name.trim() ? "Continue" : "Skip for now"} →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 2: Platforms ── */}
        {slide === 2 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 2 of 4</div>
              <h2 className="text-3xl font-black text-slate-900 mt-2 leading-tight">Where do you<br/>share your faith?</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Pick all that apply. We'll optimize your caption for each platform.</p>
            </div>
            <div className="space-y-2">
              {DEMO_PLATFORMS.map((p) => {
                const selected = platforms.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                    className={`w-full flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                      selected ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                    <span className="text-2xl">{p.emoji}</span>
                    <span className={`text-sm font-extrabold flex-1 ${selected ? "text-emerald-800" : "text-slate-700"}`}>{p.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                    }`}>
                      {selected ? <Check className="w-3 h-3 text-white" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={next}
                className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3.5 shadow-md hover:shadow-lg transition-all">
                Continue →
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 3: Notifications ── */}
        {slide === 3 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Step 3 of 4</div>
              <h2 className="text-3xl font-black text-slate-900 mt-2 leading-tight">Daily reminders<br/>keep you rooted.</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Get a gentle nudge each morning to write and share your faith.</p>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm space-y-4">
              {notifStatus === "granted" ? (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <Bell className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-sm font-extrabold text-emerald-800">Reminders are on ✓</div>
                    <div className="text-xs text-emerald-600 mt-0.5">We'll notify you at {notifTime} each day.</div>
                  </div>
                </div>
              ) : notifStatus === "denied" ? (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <BellOff className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <div className="text-sm font-extrabold text-amber-800">Notifications blocked</div>
                    <div className="text-xs text-amber-600 mt-0.5">You can enable them anytime in your browser settings.</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">Morning devotional reminder</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">A gentle push each day to write, reflect, and share. No spam — just one nudge.</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Preferred time</label>
                    <input type="time" value={notifTime} onChange={(e) => setNotifTime(e.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-extrabold bg-white outline-none focus:ring-2 focus:ring-emerald-200" />
                  </div>
                  <button type="button" onClick={handleRequestNotif} disabled={notifBusy}
                    className="w-full rounded-2xl bg-emerald-600 text-white py-3.5 font-extrabold flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-emerald-700 transition-colors">
                    {notifBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                    {notifBusy ? "Requesting…" : "Turn on reminders"}
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={next}
                className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold py-3.5 shadow-md hover:shadow-lg transition-all">
                {notifStatus === "granted" ? "Continue →" : "Skip for now →"}
              </button>
            </div>
          </div>
        ) : null}

        {/* ── SLIDE 4: Bible version + Finish ── */}
        {slide === 4 ? (
          <div className="flex-1 flex flex-col animate-enter space-y-5">
            <div>
              <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Last step</div>
              <h2 className="text-3xl font-black text-slate-900 mt-2 leading-tight">Choose your<br/>Bible version.</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Used when we look up your verse automatically. Change anytime in Settings.</p>
            </div>

            <div className="space-y-2">
              {BIBLE_VERSIONS.map((v) => (
                <button key={v} type="button" onClick={() => setVersion(v)}
                  className={`w-full flex items-center justify-between rounded-2xl border px-5 py-3.5 text-left transition-all ${
                    version === v ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}>
                  <span className={`text-sm font-extrabold ${version === v ? "text-emerald-800" : "text-slate-700"}`}>{v}</span>
                  {version === v ? <Check className="w-4 h-4 text-emerald-600" /> : null}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="button" onClick={finish}
                className="flex-1 rounded-[1.75rem] bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-base py-4 shadow-lg shadow-emerald-200 hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99]">
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

function BottomNav({ view, onWriteFromYourVerse, onHome, onLibrary, onContinueWrite, showWriteHint, onSettings, hasActiveDraft }) {
  const [bouncing, setBouncing] = React.useState(null);
  const [fabPulse, setFabPulse] = React.useState(false);
  const handleNav = (target, fn) => {
    setBouncing(target);
    setTimeout(() => setBouncing(null), 500);
    fn();
  };
  const [fabChoiceOpen, setFabChoiceOpen] = React.useState(false);

  const handleFab = () => {
    setFabPulse(true);
    setTimeout(() => setFabPulse(false), 600);
    if (view === "write") {
      // Already writing — just go back there
      onContinueWrite();
    } else if (hasActiveDraft && view !== "write") {
      // Has in-progress draft but not currently on write view — show choice
      setFabChoiceOpen(true);
    } else {
      onWriteFromYourVerse();
    }
  };

  const isWriting = view === "write";

  return (
    <>
    {/* Draft-in-progress choice modal */}
    {fabChoiceOpen ? (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-3 animate-enter">
          <div className="text-lg font-black text-slate-900">You have a draft in progress</div>
          <div className="text-sm text-slate-500 font-medium">Continue where you left off, or start fresh?</div>
          <button type="button" onClick={() => { setFabChoiceOpen(false); onContinueWrite(); }}
            className="w-full rounded-2xl bg-emerald-600 text-white py-3.5 font-extrabold flex items-center justify-center gap-2">
            <PenTool className="w-4 h-4" /> Continue writing
          </button>
          <button type="button" onClick={() => { setFabChoiceOpen(false); onWriteFromYourVerse(); }}
            className="w-full rounded-2xl border border-slate-200 text-slate-700 py-3 font-extrabold hover:bg-slate-50 transition-colors">
            Start a new entry
          </button>
          <button type="button" onClick={() => setFabChoiceOpen(false)}
            className="w-full text-sm font-bold text-slate-400 py-1 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    ) : null}
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-6 pt-3 pb-7 bg-white/90 backdrop-blur-xl border-t border-slate-100">
      {/* Home */}
      <button type="button" onClick={() => handleNav("home", onHome)}
        className={cn("flex flex-col items-center gap-1 transition-colors min-w-[48px]", view === "home" ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}
        title="Home">
        <BookOpen className={cn("w-6 h-6", bouncing === "home" ? "nav-bounce" : "")} />
        <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
      </button>

      {/* Write FAB */}
      <div className="relative flex flex-col items-center justify-center">
        {showWriteHint && view === "home" ? (
          <div className="absolute -top-7 text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full whitespace-nowrap">
            Your Verse
          </div>
        ) : null}
        {isWriting ? (
          <div className="absolute -top-7 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
            Writing
          </div>
        ) : null}
        {fabPulse && <span className="absolute inset-0 rounded-full bg-slate-900 pointer-events-none" style={{ animation: "fabRing 0.6s ease-out forwards" }} />}
        <button type="button" onClick={handleFab}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.18)] btn-spring relative z-10",
            isWriting ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"
          )}
          title={isWriting ? "Back to writing" : "Write"}>
          {isWriting ? <PenTool className="w-6 h-6" /> : <Pencil className="w-6 h-6" />}
        </button>
        <span className={cn("text-[9px] font-black uppercase tracking-wider mt-1", isWriting ? "text-emerald-600" : "text-slate-400")}>
          {isWriting ? "Writing" : "Write"}
        </span>
      </div>

      {/* Library */}
      <button type="button" onClick={() => handleNav("library", onLibrary)}
        className={cn("flex flex-col items-center gap-1 transition-colors min-w-[48px]", view === "library" ? "text-emerald-600" : "text-slate-400 hover:text-slate-700")}
        title="Library">
        <Library className={cn("w-6 h-6", bouncing === "library" ? "nav-bounce" : "")} />
        <span className="text-[9px] font-black uppercase tracking-wider">Library</span>
      </button>


    </div>
    </>
  );
}

function FABOption({ icon: Icon, label, onClick, active }) {
  return (
    <div className="flex items-center gap-3 justify-end">
      <span className={cn(
        "text-xs font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm transition-all",
        active ? "bg-emerald-600 text-white" : "bg-white/90 text-slate-700"
      )}>{label}</span>
      <button
        onClick={onClick}
        type="button"
        className={cn(
          "w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-95",
          active ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
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
  const [activeId, setActiveId] = useState(() => {
    const saved = String(localStorage.getItem(STORAGE_ACTIVE_ID) || "");
    if (saved) return saved;
    return Array.isArray(devotionals) && devotionals[0] ? devotionals[0].id : "";
  });
  const [view, setView] = useState(() => String(localStorage.getItem(STORAGE_VIEW) || "home"));
  const [lastNonSettingsView, setLastNonSettingsView] = useState(() => String(localStorage.getItem(`${STORAGE_VIEW}_last`) || "home"));
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [customVerseRef, setCustomVerseRef] = useState("");
  const [customVerseText, setCustomVerseText] = useState("");
  const [hasUsedWriteFab, setHasUsedWriteFab] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = localStorage.getItem("versed_install_dismissed");
      if (!dismissed) setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallBanner(false);
    if (outcome === "accepted") localStorage.setItem("versed_install_dismissed", "1");
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem("versed_install_dismissed", "1");
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
 // home | write | library | settings

  useEffect(() => {
    if (view !== "settings") setLastNonSettingsView(view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(STORAGE_VIEW, view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_VIEW}_last`, lastNonSettingsView || "home");
  }, [lastNonSettingsView]);

  useEffect(() => {
    if (activeId) localStorage.setItem(STORAGE_ACTIVE_ID, activeId);
    else localStorage.removeItem(STORAGE_ACTIVE_ID);
  }, [activeId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);



  const openSettings = () => {
    setView("settings");
    setMenuOpen(false);
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

  useEffect(() => {
    const allowed = new Set(["home", "write", "library", "settings"]);
    if (!allowed.has(view)) {
      setView("home");
      return;
    }
    if (view === "write" && !active) {
      setView(safeDevotionals.length ? "library" : "home");
    }
  }, [view, active, safeDevotionals.length]);

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

  const updateSettings = (patch) => {
    // Special key: _importEntries — merge backup entries into devotionals list
    if (patch._importEntries) {
      const incoming = patch._importEntries;
      setDevotionals((list) => {
        const current = Array.isArray(list) ? list : [];
        const existingIds = new Set(current.map((d) => d.id));
        // Update existing entries in-place, prepend new ones
        const updated = current.map((d) => {
          const match = incoming.find((i) => i.id === d.id);
          return match ? { ...d, ...match } : d;
        });
        const added = incoming.filter((i) => !existingIds.has(i.id));
        return [...added, ...updated];
      });
      return;
    }
    setSettings((s) => ({ ...s, ...patch }));
  };

  const updateDevotional = (patch) => {
    if (!active) return;
    const safePatch = { ...patch };
    if (Object.prototype.hasOwnProperty.call(safePatch, "verseRef")) {
      // Only auto-derive scriptureSource if the patch doesn't already set it explicitly
      if (!Object.prototype.hasOwnProperty.call(safePatch, "scriptureSource")) {
        safePatch.scriptureSource = String(safePatch.verseRef || "").trim() ? "your_verse" : (active.scriptureSource || "verse_of_day");
      }
      setCustomVerseRef(String(safePatch.verseRef || "").trim());
    }
    if (Object.prototype.hasOwnProperty.call(safePatch, "verseText")) {
      setCustomVerseText(String(safePatch.verseText || "").trim());
    }
    setDevotionals((list) =>
      (Array.isArray(list) ? list : []).map((d) => (d.id === active.id ? { ...d, ...safePatch, updatedAt: nowIso() } : d))
    );
  };

  const newEntry = () => {
    const d = createDevotional(settings);
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const quickPost = () => {
    const d = createDevotional(settings);
    // Start blank — no pre-filled title or reflection
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const writeFromYourVerse = () => {
    setHasUsedWriteFab(true);
    const d = createDevotional(settings);
    d.scriptureSource = "your_verse";
    d.verseRef = customVerseRef;
    d.verseText = customVerseText;
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const reflectVerseOfDay = () => {
    const d = createDevotional(settings);
    const _votd = getVerseOfDay();
    d.verseRef = _votd.verseRef;
    d.verseText = _votd.verseText;
    d.title = _votd.suggestedTitle;
    d.reflection = `Today I reflect on ${_votd.verseRef}. Lord, help me trust Your shepherding in every step.`;
    d.scriptureSource = "verse_of_day";
    setDevotionals((list) => [d, ...(Array.isArray(list) ? list : [])]);
    setActiveId(d.id);
    setView("write");
  };

  const openEntry = (id, targetView = "write") => {
    setActiveId(id);
    setView(targetView);
  };

  const deleteEntry = (id) => {
    setDevotionals((list) => (Array.isArray(list) ? list : []).filter((d) => d.id !== id));
    if (activeId === id) {
      setActiveId("");
      setView("home");
    }
  };

  const markPosted = (id) => {
    setDevotionals((list) => (Array.isArray(list) ? list : []).map((d) => (d.id === id ? { ...d, status: "posted", updatedAt: nowIso() } : d)));
    pushToast("Marked as posted.");
  };

  const duplicateEntry = (id) => {
    const source = safeDevotionals.find((d) => d.id === id);
    if (!source) return;
    const copy = { ...source, id: crypto.randomUUID(), createdAt: nowIso(), updatedAt: nowIso(), status: "draft", reviewed: false };
    setDevotionals((list) => [copy, ...(Array.isArray(list) ? list : [])]);
    setActiveId(copy.id);
    setView("write");
    pushToast("Entry duplicated.");
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
          <BrandLogo className="h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105" />
          <div className="min-w-0 leading-tight flex-1">
            {view === "write" && active ? (
              <div className="text-[13px] font-bold text-slate-500 truncate">{active.verseRef || "New Entry"}</div>
            ) : (
              <div className="text-[13px] font-semibold text-slate-400">{getTimeGreeting(getDisplayName(session, settings))}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setView(v => v === "settings" ? (lastNonSettingsView || "home") : "settings")}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
              view === "settings" ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto w-full px-3 pt-5 pb-32 sm:px-4 sm:pt-8 relative z-10">
        <PageTransition key={view}>
        {view === "home" ? (
          <HomeView
            onNew={newEntry}
            onLibrary={() => setView("library")}
            onContinue={() => setView(active ? "write" : "home")}
            onReflectVerseOfDay={reflectVerseOfDay}
            onQuickPost={quickPost}
            hasActive={Boolean(active)}
            streak={streak}
            displayName={getDisplayName(session, settings)}
            devotionals={safeDevotionals}
            onOpen={openEntry}
            onOpenReadyToPost={(id) => { openEntry(id, "write"); localStorage.setItem(`${APP_ID}_wizard_step_${id}`, "4"); }}
            showInstallBanner={showInstallBanner}
            onInstall={doInstall}
            onDismissInstall={dismissInstall}
          />
        ) : null}

        {view === "write" && active ? (
          <WriteView
            devotional={active}
            settings={settings}
            onUpdate={updateDevotional}
            onGoCompile={() => {}}
            onGoPolish={() => {}}
            onSaved={onSaved}
          />
        ) : null}

                {/* CompileView removed — sharing unified into WriteView Step 4 */}

        {view === "library" ? <LibraryView devotionals={safeDevotionals} onOpen={openEntry} onDelete={deleteEntry} onDuplicate={duplicateEntry} onMarkPosted={markPosted} onBack={() => setView("home")} /> : null}

        {view === "settings" ? <SettingsView settings={settings} onUpdate={updateSettings} onReset={reset} onLogout={onLogout} devotionals={safeDevotionals} onBack={() => setView(lastNonSettingsView || "home")} /> : null}
        </PageTransition>
      </main>

      {/* ── Bottom Nav Bar ── */}
      <BottomNav view={view} onHome={() => setView("home")} onWriteFromYourVerse={writeFromYourVerse} onContinueWrite={() => setView(active ? "write" : "home")} onLibrary={() => setView("library")} onSettings={() => setView("settings")} showWriteHint={!hasUsedWriteFab && !customVerseRef} hasActiveDraft={Boolean(active)} />
    </div>
    </ToastContext.Provider>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [stage, setStage] = useState(() => (loadSession() ? "app" : "landing"));

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 700);
    return () => clearTimeout(t);
  }, []);

  const [authDraft, setAuthDraft] = useState(null);
  const [session, setSession] = useState(() => loadSession());
  const [starterMood, setStarterMood] = useState("");

  if (splash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-sky-50">
        <BrandLogo className="h-36 w-auto object-contain drop-shadow-lg animate-enter" />
      </div>
    );
  }

  // Google OAuth success — skip onboarding name step, go straight to onboarding slides
  const handleGoogleSuccess = (profile) => {
    const draft = { mode: "google", name: profile.name, email: profile.email, picture: profile.picture, sub: profile.sub };
    setAuthDraft(draft);
    setStage("onboarding");
  };

  const startDemo = () => {
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
    // Sign out of Google silently so next visit shows the picker again
    try { if (window.google?.accounts?.id) window.google.accounts.id.disableAutoSelect(); } catch {}
    setStage("landing");
  };

  return (
    <ErrorBoundary>
      {stage === "landing" ? <LandingView onGetStarted={() => setStage("auth")} onViewDemo={startDemo} onGoogleSuccess={handleGoogleSuccess} /> : null}
      {stage === "auth" ? <AuthView onBack={() => setStage("landing")} onContinue={handleAuthContinue} /> : null}
      {stage === "onboarding" ? <OnboardingWizard authDraft={authDraft} onFinish={handleFinishOnboarding} /> : null}
      {stage === "app" ? <AppInner session={session} starterMood={starterMood} onLogout={logout} /> : null}
    </ErrorBoundary>
  );
}
