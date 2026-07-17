import React, { useState, useEffect, useRef } from "react";

// ---------- Design tokens ----------
const C = {
  deep: "#0A1826",
  panel: "#122436",
  line: "#1E3A52",
  foam: "#F2F6F7",
  mist: "#8FA8BC",
  sea: "#39C4B6",
  sand: "#E4D5B8",
  alert: "#F2795C",
};

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');`;

// ---------- Local storage (replaces Claude artifact window.storage) ----------
// Same async shape the original code expected: get -> {value} | null, set(key, value).
const storage = {
  get: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value == null ? null : { value };
    } catch {
      return null;
    }
  },
  // Deliberately lets errors through — callers surface them. A silent write
  // failure looks exactly like a successful save, which is worse than a crash.
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
};

// localStorage refuses writes in Private Browsing and when the origin is full.
// Both arrive as exceptions here; translate them into something actionable.
const storageErrorMessage = (e) => {
  const s = `${e?.name || ""} ${e?.message || ""}`;
  if (/quota|exceeded|full/i.test(s))
    return "Out of storage space — progress photos take up the most room. Export a backup in Plan, then delete a few photos under Me.";
  return "This browser is blocking local storage, so nothing can be saved. If you're using Private Browsing, open the app normally instead.";
};

const API_KEY_STORAGE = "craig-api-key";
const getApiKey = () => (localStorage.getItem(API_KEY_STORAGE) || "").trim();

// ---------- Exercise illustrations ----------
const Fig = ({ children }) => (
  <svg viewBox="0 0 120 90" className="w-full h-28" fill="none" stroke={C.sea} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const Head = ({ x, y }) => <circle cx={x} cy={y} r="6" />;

const ILLUS = {
  swing: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={52} y={26} />
      <path d="M52 32 L46 52 L38 72 M46 52 L58 72" />
      <path d="M52 36 L78 30" />
      <circle cx="86" cy="28" r="7" fill={C.sea} stroke="none" opacity="0.9" />
      <path d="M70 60 q14 -18 16 -30" strokeDasharray="3 5" stroke={C.mist} strokeWidth="2" />
    </Fig>
  ),
  goblet: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={60} y={22} />
      <path d="M60 28 L60 46 M60 46 L46 58 L46 78 M60 46 L74 58 L74 78" />
      <path d="M60 32 L54 40 M60 32 L66 40" />
      <circle cx="60" cy="42" r="6" fill={C.sea} stroke="none" opacity="0.9" />
    </Fig>
  ),
  press: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={60} y={30} />
      <path d="M60 36 L60 60 M60 60 L50 80 M60 60 L70 80" />
      <path d="M60 40 L48 46 M60 40 L72 26" />
      <circle cx="75" cy="20" r="6" fill={C.sea} stroke="none" opacity="0.9" />
    </Fig>
  ),
  lunge: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={56} y={24} />
      <path d="M56 30 L56 50 M56 50 L40 62 L42 80 M56 50 L72 60 L88 78" />
      <circle cx="46" cy="44" r="5" fill={C.sea} stroke="none" opacity="0.9" />
      <path d="M56 34 L46 40" />
    </Fig>
  ),
  pullup: (
    <Fig>
      <line x1="20" y1="16" x2="100" y2="16" strokeWidth="4" stroke={C.sand} />
      <Head x={60} y={32} />
      <path d="M60 38 L60 58 M60 58 L52 76 M60 58 L68 76" />
      <path d="M60 40 L46 20 M60 40 L74 20" />
    </Fig>
  ),
  dip: (
    <Fig>
      <line x1="26" y1="34" x2="46" y2="34" strokeWidth="4" stroke={C.sand} />
      <line x1="74" y1="34" x2="94" y2="34" strokeWidth="4" stroke={C.sand} />
      <Head x={60} y={26} />
      <path d="M60 32 L60 54 M60 54 L54 74 M60 54 L68 72" />
      <path d="M60 36 L46 34 M60 36 L74 34" />
    </Fig>
  ),
  trxrow: (
    <Fig>
      <line x1="20" y1="10" x2="100" y2="10" strokeWidth="4" stroke={C.sand} />
      <path d="M58 10 L48 34 M62 10 L56 34" stroke={C.mist} strokeWidth="2" />
      <Head x={44} y={40} />
      <path d="M50 44 L72 58 L94 74" />
      <path d="M56 48 L50 36" />
    </Fig>
  ),
  hspu: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={60} y={70} />
      <path d="M60 64 L60 40 M60 40 L52 22 M60 40 L68 22 M60 76 L48 82 M60 76 L72 82" />
      <path d="M52 22 L52 14 M68 22 L68 14" stroke={C.sea} />
    </Fig>
  ),
  rope: (
    <Fig>
      <line x1="15" y1="84" x2="105" y2="84" stroke={C.line} />
      <Head x={60} y={26} />
      <path d="M60 32 L60 52 M60 52 L52 74 M60 52 L68 74" />
      <path d="M60 36 L48 44 M60 36 L72 44" />
      <path d="M46 46 q14 34 28 0 q-14 -52 -28 0" stroke={C.sand} strokeWidth="2" />
    </Fig>
  ),
  pike: (
    <Fig>
      <line x1="20" y1="10" x2="100" y2="10" strokeWidth="4" stroke={C.sand} />
      <path d="M76 10 L74 40" stroke={C.mist} strokeWidth="2" />
      <Head x={36} y={52} />
      <path d="M42 56 L58 64 M58 64 L74 44" />
      <path d="M46 60 L44 76 M50 62 L50 78" />
    </Fig>
  ),
  burpee: (
    <Fig>
      <line x1="15" y1="82" x2="105" y2="82" stroke={C.line} />
      <Head x={30} y={64} />
      <path d="M36 66 L58 66 L80 74 M40 72 L40 80 M58 66 L64 80" />
      <path d="M92 50 L92 30" strokeDasharray="3 4" stroke={C.mist} strokeWidth="2" />
      <path d="M88 34 L92 28 L96 34" stroke={C.mist} strokeWidth="2" />
    </Fig>
  ),
};

// ---------- Program ----------
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const DAYS = {
  A: {
    key: "A", name: "Power", sub: "Kettlebell strength & hinge", color: C.sea,
    format: "4 rounds, rest as little as form allows · ~16 min",
    exercises: [
      { id: "swing", name: "KB Swing", dose: "15 reps", cue: "Hinge, snap hips. Bell to chest height, arms are rope.", video: yt("russian kettlebell swing technique") },
      { id: "goblet", name: "Goblet Squat", dose: "10 reps", cue: "Elbows inside knees at bottom. Slow down, fast up.", video: yt("goblet squat technique") },
      { id: "press", name: "1-arm KB Press", dose: "6/side", cue: "Ribs down, glutes tight. Push yourself away from the bell.", video: yt("single arm kettlebell press") },
      { id: "lunge", name: "KB Front-rack Lunge", dose: "8/side", cue: "Bell in rack position, torso tall, knee kisses floor.", video: yt("kettlebell front rack reverse lunge") },
    ],
  },
  B: {
    key: "B", name: "Torso", sub: "Pull-ups · dips · HSPU — the V-shape day", color: C.sand,
    format: "4 rounds · quality over speed · ~18 min",
    exercises: [
      { id: "pullup", name: "Pull-ups", dose: "AMRAP −2", cue: "Leave 2 reps in the tank. Chest to bar mindset, full hang.", video: yt("strict pull up technique") },
      { id: "dip", name: "Bar Dips", dose: "6–10 reps", cue: "Shoulders down away from ears, lean slightly forward.", video: yt("strict bar dip technique") },
      { id: "hspu", name: "HSPU / Pike Press", dose: "3–6 reps", cue: "Wall HSPU if fresh; pike push-up from box when fatigued.", video: yt("wall handstand push up progression") },
      { id: "trxrow", name: "TRX Row", dose: "12 reps", cue: "Body is a plank. Walk feet forward to make it harder.", video: yt("trx row technique") },
    ],
  },
  C: {
    key: "C", name: "Engine", sub: "Jump rope + conditioning — the fat burner", color: C.alert,
    format: "EMOM-style · 15 min · keep moving",
    exercises: [
      { id: "rope", name: "Jump Rope", dose: "40s hard / 20s off ×5", cue: "Relaxed shoulders, wrists spin the rope. Double-unders if you have them.", video: yt("jump rope conditioning workout") },
      { id: "swing", name: "KB Swing", dose: "20 reps ×3", cue: "Between rope blocks. Heavy breathing is the point today.", video: yt("kettlebell swing conditioning") },
      { id: "burpee", name: "Burpees", dose: "10 reps ×3", cue: "Steady rhythm beats sprint-and-die. Step back if needed.", video: yt("burpee pacing technique") },
      { id: "pike", name: "TRX Pike", dose: "8 reps ×3", cue: "Feet in straps, hips to ceiling. Abs for the final reveal.", video: yt("trx pike exercise") },
    ],
  },
};
const CYCLE = ["A", "B", "C"];

// ---------- Helpers ----------
const todayKey = () => new Date().toISOString().slice(0, 10);
const fmtDay = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const DEFAULT_STATE = {
  completed: [],
  food: {},
  targets: { kcal: 1900, protein: 150 },
  waist: [],
  chat: [],
  roadWorkout: null, // {date, name, format, exercises:[{name,dose,cue}]}
  health: null,      // {updated, days:[{date, steps, sleepHrs, rhr, weightKg, activeKcal}]}
  blood: [],         // [{id, date, markers:[{name,value,unit,flag}], summary}]
  bloodDraft: "",    // transcribed lab text, page by page, awaiting review + save
};

// resize + compress an image file -> dataURL
const compressImage = (file, maxW = 520, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });

// Call the Anthropic Messages API directly from the browser using the user's
// own key. Requires the dangerous-direct-browser-access header (opt-in CORS).
const MODEL = "claude-sonnet-5";
const callClaude = async (messages) => {
  const key = getApiKey();
  if (!key) {
    const err = new Error("Add your Anthropic API key in Plan → AI Connection to use the AI features.");
    err.code = "NO_KEY";
    throw err;
  }
  let resp;
  try {
    resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages }),
    });
  } catch {
    throw new Error("Network error reaching Anthropic — check your connection.");
  }
  if (!resp.ok) {
    let detail = "";
    try { const j = await resp.json(); detail = j?.error?.message || ""; } catch {}
    if (resp.status === 401) throw new Error("Your API key was rejected (401). Update it in Plan → AI Connection.");
    if (resp.status === 429) throw new Error("Rate limited by Anthropic (429). Wait a moment and try again.");
    throw new Error(`Anthropic API error ${resp.status}${detail ? ": " + detail : ""}.`);
  }
  const data = await resp.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
};

// Show the actionable message for API/connection failures, otherwise a fallback.
const aiErrorMessage = (e, fallback) =>
  e && (e.code === "NO_KEY" || /API key|Anthropic API|Network error|Rate limited/.test(e.message || ""))
    ? e.message
    : fallback;

export default function App() {
  const [state, setState] = useState(null);
  const [targetPhoto, setTargetPhoto] = useState(null);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [tab, setTab] = useState("today");
  const [openEx, setOpenEx] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [waistInput, setWaistInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [coachTyping, setCoachTyping] = useState(false);
  const [roadOpen, setRoadOpen] = useState(false);
  const [roadInput, setRoadInput] = useState("");
  const [roadLoading, setRoadLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => getApiKey());
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [storageError, setStorageError] = useState(null);
  // Holds what's currently typed in the target fields, so a value mid-edit
  // isn't lost when the section unmounts (e.g. swiping to another tab).
  const [targetsDraft, setTargetsDraft] = useState({});
  const fileRef = useRef(null);
  const targetRef = useRef(null);
  const progressRef = useRef(null);
  const backupRef = useRef(null);
  const healthRef = useRef(null);
  const bloodRef = useRef(null);
  const chatEndRef = useRef(null);
  const [bloodScanning, setBloodScanning] = useState(false);
  const [bloodSaving, setBloodSaving] = useState(false);
  const [bloodIdx, setBloodIdx] = useState(null); // null = show newest report
  const [showAllMarkers, setShowAllMarkers] = useState(false);
  const [healthMsg, setHealthMsg] = useState(null);
  const touchRef = useRef(null);

  const TAB_ORDER = ["today", "fuel", "coach", "me", "plan"];
  const onTouchStart = (e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return; // must be a clear horizontal swipe
    const i = TAB_ORDER.indexOf(tab);
    if (dx < 0 && i < TAB_ORDER.length - 1) { setTab(TAB_ORDER[i + 1]); setOpenEx(null); }
    if (dx > 0 && i > 0) { setTab(TAB_ORDER[i - 1]); setOpenEx(null); }
  };

  useEffect(() => {
    (async () => {
      let s = DEFAULT_STATE;
      try {
        const r = await storage.get("beach-protocol-v1");
        if (r) s = { ...DEFAULT_STATE, ...JSON.parse(r.value) };
      } catch {}
      setState(s);
      try {
        const tp = await storage.get("craig-photo-target");
        if (tp) setTargetPhoto(tp.value);
      } catch {}
      try {
        const pp = await storage.get("craig-photos-progress");
        if (pp) setProgressPhotos(JSON.parse(pp.value));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.chat, coachTyping]);

  const save = async (next) => {
    setState(next);
    try {
      await storage.set("beach-protocol-v1", JSON.stringify(next));
      setStorageError(null);
    } catch (e) {
      console.error(e);
      setStorageError(storageErrorMessage(e));
    }
  };

  const saveApiKey = () => {
    const k = apiKeyInput.trim();
    if (!k) return;
    try {
      localStorage.setItem(API_KEY_STORAGE, k);
      setApiKey(k);
      setApiKeyInput("");
      setStorageError(null);
    } catch (e) {
      console.error(e);
      setStorageError(storageErrorMessage(e));
    }
  };
  const clearApiKey = () => {
    try { localStorage.removeItem(API_KEY_STORAGE); } catch {}
    setApiKey("");
    setApiKeyInput("");
  };

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.deep, color: C.mist }}>
      <style>{FONT}</style>
      <div className="text-sm tracking-widest" style={{ fontFamily: "Inter" }}>LOADING…</div>
    </div>
  );

  // ----- derived -----
  const t = todayKey();
  const doneToday = state.completed.find((c) => c.date === t);
  const nextDayKey = CYCLE[state.completed.length % 3];
  const day = DAYS[doneToday ? doneToday.day : nextDayKey];
  const foodToday = state.food[t] || [];
  const kcal = foodToday.reduce((s, f) => s + (f.kcal || 0), 0);
  const protein = foodToday.reduce((s, f) => s + (f.protein || 0), 0);
  const roadToday = state.roadWorkout && state.roadWorkout.date === t ? state.roadWorkout : null;

  const streak = (() => {
    const dates = new Set(state.completed.map((c) => c.date));
    let n = 0; const d = new Date();
    if (!dates.has(todayKey())) d.setDate(d.getDate() - 1);
    while (dates.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();

  // ----- actions -----
  const completeWorkout = () => {
    if (doneToday) return;
    save({ ...state, completed: [...state.completed, { date: t, day: nextDayKey }] });
  };
  const undoWorkout = () => save({ ...state, completed: state.completed.filter((c) => c.date !== t) });

  const analyzePhoto = async (file) => {
    setError(null); setAnalyzing(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
      const media = file.type === "image/png" ? "image/png" : "image/jpeg";
      const text = await callClaude([{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: media, data: base64 } },
          { type: "text", text: `Estimate this meal for a food log. The user is a ~80kg ex-CrossFit dad cutting body fat toward a lean athletic beach physique.${profileContext()} So far today (before this meal): ${kcal} of ${state.targets.kcal} kcal, ${protein} of ${state.targets.protein}g protein.${healthContext()}${bloodContext()}\n\n${EURO_GROUNDING}\n\nRespond with ONLY valid JSON, no markdown: {"desc": "short meal name, max 5 words", "items": ["item (portion)"], "kcal": number, "protein": number, "comment": "2-3 sentences in a warm coach voice. Observe what is on the plate relative to the goal, the day so far, the user's age and any flagged blood markers. When you give a health reason, name the European reference it comes from. Never shame or forbid; notice and nudge. Max 55 words."}` },
        ],
      }]);
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const entry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        desc: parsed.desc, items: parsed.items || [],
        kcal: Math.round(parsed.kcal || 0), protein: Math.round(parsed.protein || 0),
        comment: parsed.comment || "",
      };
      save({ ...state, food: { ...state.food, [t]: [...foodToday, entry] } });
    } catch (e) {
      console.error(e);
      setError(aiErrorMessage(e, "Couldn't analyze that photo. Try again with better lighting or closer up."));
    } finally {
      setAnalyzing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeFood = (id) => save({ ...state, food: { ...state.food, [t]: foodToday.filter((f) => f.id !== id) } });

  const addWaist = () => {
    const cm = parseFloat(waistInput);
    if (!cm || cm < 50 || cm > 200) return;
    save({ ...state, waist: [...state.waist.filter((w) => w.date !== t), { date: t, cm }] });
    setWaistInput("");
  };

  const exportBackup = () => {
    const backup = { version: 2, exported: new Date().toISOString(), state, targetPhoto, progressPhotos };
    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `craig-protocol-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file) => {
    try {
      const text = await file.text();
      const b = JSON.parse(text);
      if (!b.state) throw new Error("Not a valid backup file");
      const merged = { ...DEFAULT_STATE, ...b.state };
      setState(merged);
      await storage.set("beach-protocol-v1", JSON.stringify(merged));
      if (b.targetPhoto) { setTargetPhoto(b.targetPhoto); await storage.set("craig-photo-target", b.targetPhoto); }
      if (b.progressPhotos) { setProgressPhotos(b.progressPhotos); await storage.set("craig-photos-progress", JSON.stringify(b.progressPhotos)); }
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Couldn't read that backup file.");
    }
    if (backupRef.current) backupRef.current.value = "";
  };

  // Parse Health Auto Export JSON -> daily summaries (last 14 days)
  const importHealth = async (file) => {
    setHealthMsg(null);
    try {
      if (file.name.endsWith(".xml") || file.name.endsWith(".zip")) {
        setHealthMsg("That's Apple's raw export — too big for the browser. Use the 'Health Auto Export' app to create a JSON instead.");
        return;
      }
      const json = JSON.parse(await file.text());
      const metrics = json?.data?.metrics || json?.metrics || [];
      const byDate = {};
      const dayOf = (s) => (s || "").slice(0, 10).replace(/\//g, "-");
      const add = (date, key, val) => {
        if (!date || val == null || isNaN(val)) return;
        byDate[date] = byDate[date] || {};
        byDate[date][key] = (byDate[date][key] || 0) + Number(val);
      };
      const set = (date, key, val) => {
        if (!date || val == null || isNaN(val)) return;
        byDate[date] = byDate[date] || {};
        byDate[date][key] = Number(val);
      };
      for (const m of metrics) {
        const name = (m.name || "").toLowerCase();
        for (const d of m.data || []) {
          const date = dayOf(d.date);
          if (name.includes("step")) add(date, "steps", d.qty);
          else if (name.includes("resting_heart") || name === "resting_heart_rate") set(date, "rhr", d.qty);
          else if (name.includes("body_mass") || name.includes("weight")) set(date, "weightKg", d.qty);
          else if (name.includes("active_energy")) add(date, "activeKcal", d.qty);
          else if (name.includes("sleep")) set(date, "sleepHrs", d.asleep ?? d.totalSleep ?? d.qty);
        }
      }
      const days = Object.entries(byDate)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);
      if (days.length === 0) {
        setHealthMsg("Couldn't find health metrics in that file. Export as JSON from Health Auto Export.");
        return;
      }
      await save({ ...state, health: { updated: t, days } });
      setHealthMsg(`Imported ${days.length} days of health data ✓`);
    } catch (e) {
      console.error(e);
      setHealthMsg("Couldn't read that file — expected JSON from Health Auto Export.");
    }
    if (healthRef.current) healthRef.current.value = "";
  };

  const draftPageCount = (txt) => ((txt || "").match(/^--- Page /gm) || []).length;

  // Step 1 — transcribe each photographed page into plain text the user can
  // read and correct. Deliberately transcription only: no interpretation yet.
  const scanBloodPages = async (fileList) => {
    const files = Array.from(fileList).slice(0, 8);
    if (!files.length) return;
    setBloodScanning(true); setHealthMsg(null);
    let draft = state.bloodDraft || "";
    let added = 0;
    try {
      for (const f of files) {
        // ~1568px: within the API's per-image limits, still sharp enough to
        // read a results table.
        const dataUrl = await compressImage(f, 1568, 0.85);
        const text = await callClaude([{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: dataUrl.split(",")[1] } },
            { type: "text", text: `Transcribe this blood test / lab result page as plain text. One marker per line, exactly as printed: name, value, unit, and the reference range if shown — e.g. "Hemoglobin: 9.2 mmol/L (ref 8.3-10.5)". Include the sample date if it is visible. Transcribe only: do not interpret, summarise, or add any commentary. If this image contains no lab results, reply with exactly: NO_RESULTS_FOUND` },
          ],
        }]);
        const clean = (text || "").trim();
        if (!clean || clean === "NO_RESULTS_FOUND") continue;
        draft += `${draft ? "\n\n" : ""}--- Page ${draftPageCount(draft) + 1} ---\n${clean}`;
        added++;
      }
      if (!added) {
        setHealthMsg("No lab results found in that image — try a sharper, straighter photo of the results table.");
      } else {
        await save({ ...state, bloodDraft: draft });
        setHealthMsg(`Read ${added} page${added > 1 ? "s" : ""} — check the text below, then save ✓`);
      }
    } catch (e) {
      console.error(e);
      // Keep whatever pages did scan before the failure.
      if (added) await save({ ...state, bloodDraft: draft });
      setHealthMsg(aiErrorMessage(e, "Couldn't read that page — try a sharper photo."));
    } finally {
      setBloodScanning(false);
      if (bloodRef.current) bloodRef.current.value = "";
    }
  };

  // Step 2 — turn the reviewed text into structured markers. Text-only call,
  // so it's cheap and works off exactly what the user approved on screen.
  const saveBloodReport = async () => {
    const draft = (state.bloodDraft || "").trim();
    if (!draft || bloodSaving) return;
    setBloodSaving(true); setHealthMsg(null);
    try {
      const text = await callClaude([{
        role: "user",
        content: `Here is the transcribed text of a blood test / lab report, possibly spanning several pages:\n\n${draft}\n\nRespond ONLY valid JSON, no markdown: {"date": "YYYY-MM-DD or null if not visible", "markers": [{"name": "marker name", "value": "number as shown", "unit": "unit", "flag": "low"|"normal"|"high"|"unknown"}], "summary": "2-3 plain-language sentences about what stands out and anything relevant for training or nutrition. No diagnosis. End with a note to discuss with their doctor if anything is flagged."} Use the reference ranges in the text to set each flag. Merge duplicates across pages. Include every marker, up to 40.`,
      }]);
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const report = {
        id: Date.now(),
        date: parsed.date || t,
        markers: parsed.markers || [],
        summary: parsed.summary || "",
        pages: draftPageCount(draft) || 1,
      };
      await save({ ...state, blood: [...state.blood, report].slice(-5), bloodDraft: "" });
      setBloodIdx(null); // snap the viewer back to the newest report
      setShowAllMarkers(false);
      setHealthMsg(`Blood work saved — ${report.markers.length} markers ✓`);
    } catch (e) {
      console.error(e);
      setHealthMsg(aiErrorMessage(e, "Couldn't turn that text into a report — check the text and try again."));
    } finally {
      setBloodSaving(false);
    }
  };

  const uploadTarget = async (file) => {
    try {
      const data = await compressImage(file);
      setTargetPhoto(data);
      await storage.set("craig-photo-target", data);
      setStorageError(null);
    } catch (e) { console.error(e); setStorageError(storageErrorMessage(e)); }
    if (targetRef.current) targetRef.current.value = "";
  };

  const uploadProgress = async (file) => {
    try {
      const data = await compressImage(file);
      const next = [...progressPhotos, { date: t, data }].slice(-10); // keep last 10
      setProgressPhotos(next);
      await storage.set("craig-photos-progress", JSON.stringify(next));
      setStorageError(null);
    } catch (e) { console.error(e); setStorageError(storageErrorMessage(e)); }
    if (progressRef.current) progressRef.current.value = "";
  };

  const removeProgress = async (i) => {
    const next = progressPhotos.filter((_, idx) => idx !== i);
    setProgressPhotos(next);
    try { await storage.set("craig-photos-progress", JSON.stringify(next)); } catch {}
  };

  const healthContext = () => {
    if (!state.health?.days?.length) return "";
    const d7 = state.health.days.slice(-7);
    const avg = (k) => { const v = d7.filter((x) => x[k] != null); return v.length ? v.reduce((s, x) => s + x[k], 0) / v.length : null; };
    const parts = [];
    const steps = avg("steps"); if (steps) parts.push(`avg steps ${Math.round(steps)}`);
    const sleep = avg("sleepHrs"); if (sleep) parts.push(`avg sleep ${sleep.toFixed(1)}h`);
    const rhr = avg("rhr"); if (rhr) parts.push(`resting HR ${Math.round(rhr)}`);
    const active = avg("activeKcal"); if (active) parts.push(`avg active energy ${Math.round(active)} kcal/day`);
    const wt = d7.filter((x) => x.weightKg != null).slice(-1)[0]; if (wt) parts.push(`weight ${wt.weightKg.toFixed(1)}kg`);
    return parts.length ? ` Apple Health last 7d: ${parts.join(", ")} (updated ${state.health.updated}).` : "";
  };

  const bloodContext = () => {
    if (!state.blood.length) return "";
    const b = state.blood[state.blood.length - 1];
    const flagged = b.markers.filter((m) => m.flag === "low" || m.flag === "high").map((m) => `${m.name} ${m.value}${m.unit} (${m.flag})`).join(", ");
    return ` Latest blood work (${b.date}): ${flagged || "all markers in normal range"}.`;
  };

  const profileContext = () => (state.targets.age ? ` User age: ${state.targets.age}.` : "");

  // Lab values arrive as strings ("5,4", "<0.1", "12.3") — pull out a number if we can.
  const numOf = (v) => {
    const n = parseFloat(String(v ?? "").replace(",", ".").replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? null : n;
  };

  // Markers measured in 2+ reports, oldest -> newest, so we can trend them.
  const bloodTrends = () => {
    const byName = {};
    [...state.blood]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((rep) => {
        (rep.markers || []).forEach((m) => {
          const key = (m.name || "").trim().toLowerCase();
          const val = numOf(m.value);
          if (!key || val == null) return;
          byName[key] = byName[key] || { name: m.name, unit: m.unit || "", points: [] };
          byName[key].points.push({ date: rep.date, value: val, flag: m.flag });
        });
      });
    return Object.values(byName).filter((x) => x.points.length >= 2);
  };

  const EURO_GROUNDING = `When giving a health or nutrition reason, ground it in established European reference data - primarily the Nordic Nutrition Recommendations 2023 (NNR2023), EFSA dietary reference values, or ESC/EAS guidelines for blood lipids - and briefly name the source when you make such a claim (e.g. "NNR2023 recommends keeping added sugar under 10% of energy"). Only make claims consistent with these references. If blood markers are flagged, connect food or training choices to them where genuinely relevant. Never diagnose.`;

  const stateSummary = () => {
    const w = state.waist.slice(-3).map((x) => `${x.date}: ${x.cm}cm`).join(", ") || "none logged";
    return `App data — streak: ${streak} days, total workouts: ${state.completed.length}, today's plan: Day ${day.key} (${day.name})${doneToday ? " DONE" : " not done yet"}, food today: ${kcal}/${state.targets.kcal} kcal, ${protein}/${state.targets.protein}g protein (${foodToday.map((f) => f.desc).join(", ") || "nothing logged"}), recent waist: ${w}.${profileContext()}${healthContext()}${bloodContext()}`;
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || coachTyping) return;
    setChatInput("");
    const chat = [...state.chat, { role: "user", text: msg }];
    await save({ ...state, chat });
    setCoachTyping(true);
    try {
      const history = chat.slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      history[history.length - 1] = {
        role: "user",
        content: `You are the coach inside "The Craig Protocol", a home fitness app for a busy dad (ex-CrossFitter, 15-20 min/day, 20kg kettlebell + wall bars with adjustable pull-up/dip bar + TRX + jump rope). Goal: lean athletic beach shape. Be direct, warm, concise (max 120 words), practical. No medical claims; if the user reports sharp, radiating or persistent pain, advise seeing a physio.\n\n${EURO_GROUNDING}\n\nRECOVERY: Use the Apple Health data. If recent sleep is short (<6h) or resting HR is elevated vs. the 7d trend, proactively recommend reducing today's intensity - and if the user asks about training, adjust the workout accordingly (lighter doses, fewer rounds, more mobility).\n\n${stateSummary()}\n\nToday's scheduled workout (Day ${nextDayKey} - ${DAYS[nextDayKey].name}): ${DAYS[nextDayKey].exercises.map((e) => `${e.name} ${e.dose}`).join(", ")}.\n\nIMPORTANT: If the user mentions pain, stiffness, soreness or an injury that affects today's training, OR if recovery data warrants it, ADJUST the workout: remove or swap aggravating movements, keep what's safe, and add 1-2 mobility/rehab-style exercises for the affected area. Respond with ONLY valid JSON, no markdown:\n{"reply": "your message to the user", "workout": null}\nor, when adjusting:\n{"reply": "your message", "workout": {"reason": "short label e.g. Adjusted for sore shoulder / Recovery day - short sleep", "name": "workout name", "format": "structure in one line", "exercises": [{"name": "...", "dose": "...", "cue": "short cue"}]}}\n\nUser says: ${msg}`,
      };
      const raw = await callClaude(history);
      let replyText = raw;
      let adjusted = null;
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        replyText = parsed.reply || raw;
        if (parsed.workout && parsed.workout.exercises) adjusted = parsed.workout;
      } catch {}
      const nextState = { ...state, chat: [...chat, { role: "coach", text: replyText }] };
      if (adjusted) nextState.roadWorkout = { date: t, ...adjusted };
      await save(nextState);
    } catch (e) {
      console.error(e);
      await save({ ...state, chat: [...chat, { role: "coach", text: aiErrorMessage(e, "Connection hiccup — try that again.") }] });
    } finally {
      setCoachTyping(false);
    }
  };

  const buildRoadWorkout = async () => {
    const desc = roadInput.trim();
    if (!desc || roadLoading) return;
    setRoadLoading(true); setError(null);
    try {
      const text = await callClaude([{
        role: "user",
        content: `Build a 15-20 min substitute workout. The user was scheduled for Day ${nextDayKey} (${DAYS[nextDayKey].name}: ${DAYS[nextDayKey].sub}) but is away from home. Available: ${desc}. User is an ex-CrossFitter, ~80kg, cutting fat.${profileContext()}${healthContext()} If recent sleep or resting HR suggests poor recovery, scale intensity down. Match the intent of the scheduled day with what's available. Respond ONLY valid JSON, no markdown: {"name": "short workout name", "format": "structure in one line", "exercises": [{"name": "...", "dose": "...", "cue": "one short coaching cue"}]} with 3-5 exercises.`,
      }]);
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      await save({ ...state, roadWorkout: { date: t, reason: "Substitute workout (away from home)", ...parsed } });
      setRoadOpen(false); setRoadInput("");
    } catch (e) {
      console.error(e);
      setError(aiErrorMessage(e, "Couldn't build the workout — try describing your equipment again."));
    } finally {
      setRoadLoading(false);
    }
  };

  // ----- UI bits -----
  const Bar = ({ value, max, color }) => (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  );

  // Tiny trend line for a marker's history. Needs 2+ points (callers filter).
  const Spark = ({ points, color, w = 62, h = 20 }) => {
    const vals = points.map((p) => p.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = max - min || 1; // flat series -> draw a centred line
    const y = (v) => (max === min ? h / 2 : h - ((v - min) / span) * h);
    const pts = points.map((p, i) => `${(i / (points.length - 1)) * w},${y(p.value)}`).join(" ");
    return (
      <svg width={w} height={h} style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={w} cy={y(vals[vals.length - 1])} r="2.5" fill={color} />
      </svg>
    );
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      className="flex-1 py-2.5 text-[13px] tracking-[0.12em] transition-colors"
      style={{
        fontFamily: "'Barlow Condensed'", fontWeight: 600,
        color: tab === id ? C.deep : C.mist,
        background: tab === id ? C.sea : "transparent",
        borderRadius: 10,
      }}>{label}</button>
  );

  const latest = progressPhotos[progressPhotos.length - 1];

  return (
    <div className="min-h-screen pb-10" style={{ background: C.deep, color: C.foam, fontFamily: "Inter, sans-serif" }}
         onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <style>{FONT}</style>

      <header className="px-5 pt-6 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[0.3em]" style={{ color: C.mist }}>THE</div>
            <h1 className="text-4xl leading-none" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, letterSpacing: "0.02em" }}>
              CRAIG <span style={{ color: C.sea }}>PROTOCOL</span>
            </h1>
          </div>
          <div className="text-right">
            <div className="text-3xl leading-none" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sea }}>{streak}</div>
            <div className="text-[10px] tracking-[0.25em]" style={{ color: C.mist }}>DAY STREAK</div>
          </div>
        </div>
      </header>

      <nav className="flex gap-1 px-3 py-3">
        <TabBtn id="today" label="TODAY" />
        <TabBtn id="fuel" label="FUEL" />
        <TabBtn id="coach" label="COACH" />
        <TabBtn id="me" label="ME" />
        <TabBtn id="plan" label="PLAN" />
      </nav>

      {storageError && (
        <div className="mx-4 mb-3 px-4 py-3 rounded-xl text-sm leading-relaxed"
             style={{ background: C.panel, border: `1px solid ${C.alert}` }}>
          <span className="text-[10px] tracking-[0.2em] block mb-1" style={{ color: C.alert }}>NOT SAVED</span>
          {storageError}
        </div>
      )}

      {/* ---------- TODAY ---------- */}
      {tab === "today" && (
        <main className="px-4 space-y-4">
          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs tracking-[0.25em]" style={{ color: C.mist }}>{fmtDay(t).toUpperCase()} · DAY {day.key}</div>
              {doneToday && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.sea, color: C.deep, fontWeight: 600 }}>DONE ✓</span>}
            </div>
            <h2 className="text-3xl" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: day.color }}>
              {roadToday ? roadToday.name.toUpperCase() : day.name.toUpperCase()}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: C.mist }}>{roadToday ? (roadToday.reason || "Substitute workout") : day.sub}</p>
            <p className="text-xs mt-2 px-3 py-2 rounded-lg inline-block" style={{ background: C.deep, color: C.sand }}>
              {roadToday ? roadToday.format : day.format}
            </p>
          </section>

          {(roadToday ? roadToday.exercises : day.exercises).map((ex, i) => (
            <section key={i} className="rounded-2xl overflow-hidden" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <button className="w-full flex items-center justify-between px-5 py-4 text-left" onClick={() => setOpenEx(openEx === i ? null : i)}>
                <div>
                  <div className="text-base font-semibold">{ex.name}</div>
                  <div className="text-sm" style={{ color: C.sea }}>{ex.dose}</div>
                </div>
                <span className="text-xl" style={{ color: C.mist }}>{openEx === i ? "−" : "+"}</span>
              </button>
              {openEx === i && (
                <div className="px-5 pb-5">
                  {!roadToday && ILLUS[ex.id] && (
                    <div className="rounded-xl p-3 mb-3" style={{ background: C.deep, border: `1px solid ${C.line}` }}>{ILLUS[ex.id]}</div>
                  )}
                  <p className="text-sm leading-relaxed">{ex.cue}</p>
                  <a href={ex.video || yt(ex.name + " exercise technique")} target="_blank" rel="noreferrer"
                     className="inline-block mt-3 text-xs tracking-[0.15em] px-3 py-2 rounded-lg"
                     style={{ border: `1px solid ${C.sea}`, color: C.sea, fontWeight: 600 }}>▶ WATCH DEMO</a>
                </div>
              )}
            </section>
          ))}

          {!doneToday ? (
            <button onClick={completeWorkout} className="w-full py-4 rounded-2xl text-lg tracking-[0.2em]"
              style={{ background: C.sea, color: C.deep, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>
              MARK COMPLETE
            </button>
          ) : (
            <button onClick={undoWorkout} className="w-full py-3 rounded-2xl text-sm" style={{ color: C.mist, border: `1px solid ${C.line}` }}>
              Undo today's workout
            </button>
          )}

          {/* Road workout */}
          {!doneToday && (
            <section className="rounded-2xl p-4" style={{ background: C.panel, border: `1px dashed ${C.line}` }}>
              {!roadOpen ? (
                <button onClick={() => setRoadOpen(true)} className="w-full text-sm py-1" style={{ color: C.sand }}>
                  ✈ Not home today? Build me a substitute workout
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: C.mist }}>What do you have? (e.g. "hotel room, nothing" or "a park with a bench, 15 min")</p>
                  <textarea value={roadInput} onChange={(e) => setRoadInput(e.target.value)} rows={2}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ background: C.deep, border: `1px solid ${C.line}`, color: C.foam }} />
                  <div className="flex gap-2">
                    <button onClick={buildRoadWorkout} disabled={roadLoading}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: roadLoading ? C.line : C.sand, color: roadLoading ? C.mist : C.deep }}>
                      {roadLoading ? "Building…" : "Build workout"}
                    </button>
                    <button onClick={() => setRoadOpen(false)} className="px-4 rounded-xl text-sm" style={{ color: C.mist, border: `1px solid ${C.line}` }}>Cancel</button>
                  </div>
                  {error && <p className="text-xs" style={{ color: C.alert }}>{error}</p>}
                </div>
              )}
              {roadToday && !roadOpen && (
                <button onClick={() => save({ ...state, roadWorkout: null })} className="w-full text-xs mt-2" style={{ color: C.mist }}>
                  Back to the regular Day {nextDayKey} workout
                </button>
              )}
            </section>
          )}
        </main>
      )}

      {/* ---------- FUEL ---------- */}
      {tab === "fuel" && (
        <main className="px-4 space-y-4">
          <section className="rounded-2xl p-5 space-y-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: C.mist }}>Calories</span>
                <span style={{ fontWeight: 600 }}>{kcal} <span style={{ color: C.mist }}>/ {state.targets.kcal}</span></span>
              </div>
              <Bar value={kcal} max={state.targets.kcal} color={kcal > state.targets.kcal ? C.alert : C.sea} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span style={{ color: C.mist }}>Protein</span>
                <span style={{ fontWeight: 600 }}>{protein}g <span style={{ color: C.mist }}>/ {state.targets.protein}g</span></span>
              </div>
              <Bar value={protein} max={state.targets.protein} color={C.sand} />
            </div>
            {(() => {
              if (!state.health?.days?.length) return null;
              const d7 = state.health.days.slice(-7);
              const avg = (k) => { const v = d7.filter((x) => x[k] != null); return v.length ? v.reduce((s, x) => s + x[k], 0) / v.length : null; };
              const wt = d7.filter((x) => x.weightKg != null).slice(-1)[0]?.weightKg;
              const active = avg("activeKcal");
              if (!wt || !active) return null;
              const burn = Math.round(22 * wt + active);
              const deficit = burn - state.targets.kcal;
              return (
                <div className="text-xs pt-1" style={{ color: C.mist, borderTop: `1px solid ${C.line}` }}>
                  Watch estimate: you burn ~<span style={{ color: C.foam, fontWeight: 600 }}>{burn} kcal/day</span> → your {state.targets.kcal} target is a <span style={{ color: deficit > 0 ? C.sea : C.alert, fontWeight: 600 }}>{Math.abs(deficit)} kcal {deficit > 0 ? "deficit" : "surplus"}</span>. Rough estimate (resting + watch activity).
                </div>
              );
            })()}
          </section>

          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
                 onChange={(e) => e.target.files?.[0] && analyzePhoto(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={analyzing}
            className="w-full py-5 rounded-2xl text-lg tracking-[0.2em]"
            style={{ background: analyzing ? C.line : C.sea, color: analyzing ? C.mist : C.deep, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>
            {analyzing ? "ANALYZING PLATE…" : "📷 SNAP YOUR MEAL"}
          </button>
          {error && tab === "fuel" && <p className="text-sm px-2" style={{ color: C.alert }}>{error}</p>}

          <div className="space-y-3">
            {foodToday.length === 0 && !analyzing && (
              <p className="text-sm text-center py-6" style={{ color: C.mist }}>Nothing logged today. Photograph your next meal and I'll estimate it.</p>
            )}
            {[...foodToday].reverse().map((f) => (
              <section key={f.id} className="rounded-2xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{f.desc}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.mist }}>{f.time} · {f.items.join(" · ")}</div>
                  </div>
                  <button onClick={() => removeFood(f.id)} className="text-xs px-2 py-1 rounded" style={{ color: C.mist }}>✕</button>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span style={{ color: C.sea, fontWeight: 600 }}>{f.kcal} kcal</span>
                  <span style={{ color: C.sand, fontWeight: 600 }}>{f.protein}g protein</span>
                </div>
                {(f.comment || f.tip) && (
                  <div className="mt-3 px-3 py-2.5 rounded-xl text-sm leading-relaxed"
                       style={{ background: C.deep, borderLeft: `3px solid ${C.sea}`, color: C.foam }}>
                    <span className="text-[10px] tracking-[0.2em] block mb-1" style={{ color: C.sea }}>COACH</span>
                    {f.comment || f.tip}
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Multi-day overview — kcal + protein per day against target */}
          {(() => {
            const logged = Object.keys(state.food)
              .filter((d) => (state.food[d] || []).length > 0)
              .sort()
              .slice(-14);
            if (logged.length === 0) return null;
            const rows = logged.map((d) => {
              const items = state.food[d];
              return {
                date: d,
                kcal: items.reduce((s, f) => s + (f.kcal || 0), 0),
                protein: items.reduce((s, f) => s + (f.protein || 0), 0),
              };
            });
            const avg = (k) => Math.round(rows.reduce((s, r) => s + r[k], 0) / rows.length);
            const underKcal = rows.filter((r) => r.kcal <= state.targets.kcal).length;
            const hitProtein = rows.filter((r) => r.protein >= state.targets.protein).length;
            return (
              <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
                <h3 className="text-xl mb-1" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>
                  LAST {rows.length} LOGGED DAY{rows.length > 1 ? "S" : ""}
                </h3>
                <p className="text-xs mb-4" style={{ color: C.mist }}>
                  <span style={{ color: C.sea, fontWeight: 600 }}>{underKcal}/{rows.length}</span> under kcal target ·{" "}
                  <span style={{ color: C.sand, fontWeight: 600 }}>{hitProtein}/{rows.length}</span> hit protein
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl px-3 py-3" style={{ background: C.deep, border: `1px solid ${C.line}` }}>
                    <div className="text-lg" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sea }}>{avg("kcal")}</div>
                    <div className="text-[10px] tracking-[0.2em]" style={{ color: C.mist }}>AVG KCAL / DAY</div>
                  </div>
                  <div className="rounded-xl px-3 py-3" style={{ background: C.deep, border: `1px solid ${C.line}` }}>
                    <div className="text-lg" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sand }}>{avg("protein")}g</div>
                    <div className="text-[10px] tracking-[0.2em]" style={{ color: C.mist }}>AVG PROTEIN / DAY</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...rows].reverse().map((r) => (
                    <div key={r.date}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: r.date === t ? C.foam : C.mist, fontWeight: r.date === t ? 600 : 400 }}>
                          {r.date === t ? "Today" : fmtDay(r.date)}
                        </span>
                        <span style={{ color: C.mist }}>
                          <span style={{ color: r.kcal > state.targets.kcal ? C.alert : C.sea, fontWeight: 600 }}>{r.kcal}</span> kcal ·{" "}
                          <span style={{ color: r.protein >= state.targets.protein ? C.sand : C.mist, fontWeight: 600 }}>{r.protein}g</span> protein
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1"><Bar value={r.kcal} max={state.targets.kcal} color={r.kcal > state.targets.kcal ? C.alert : C.sea} /></div>
                        <div className="flex-1"><Bar value={r.protein} max={state.targets.protein} color={C.sand} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] mt-4 leading-relaxed" style={{ color: C.mist }}>
                  Left bar = calories (turns orange over target). Right bar = protein. Only days with a logged meal appear.
                </p>
              </section>
            );
          })()}
        </main>
      )}

      {/* ---------- COACH ---------- */}
      {tab === "coach" && (
        <main className="px-4 flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
          <div className="flex-1 overflow-y-auto space-y-3 pb-3">
            {state.chat.length === 0 && (
              <div className="text-sm text-center py-8 px-6 leading-relaxed" style={{ color: C.mist }}>
                Your coach sees your streak, food log and waist trend.<br /><br />
                Try: "How is my week going?" · "I only slept 5 hours, adjust today" · "Dinner was pizza, what now?"
              </div>
            )}
            {state.chat.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={m.role === "user"
                    ? { background: C.sea, color: C.deep, borderBottomRightRadius: 4 }
                    : { background: C.panel, border: `1px solid ${C.line}`, borderBottomLeftRadius: 4 }}>
                  {m.text}
                </div>
              </div>
            ))}
            {coachTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.mist }}>Coach is thinking…</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${C.line}` }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Talk to your coach…"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.foam }} />
            <button onClick={sendChat} disabled={coachTyping}
              className="px-5 rounded-xl text-sm font-semibold"
              style={{ background: coachTyping ? C.line : C.sea, color: coachTyping ? C.mist : C.deep }}>Send</button>
          </div>
        </main>
      )}

      {/* ---------- ME ---------- */}
      {tab === "me" && (
        <main className="px-4 space-y-4">
          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-3" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>CURRENT vs TARGET</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: C.deep, border: `1px solid ${C.line}`, aspectRatio: "3/4" }}>
                  {latest ? <img src={latest.data} alt="Current" className="w-full h-full object-cover" />
                    : <span className="text-xs text-center px-3" style={{ color: C.mist }}>No progress photo yet</span>}
                </div>
                <div className="text-[11px] text-center mt-1.5 tracking-[0.2em]" style={{ color: C.mist }}>
                  {latest ? fmtDay(latest.date).toUpperCase() : "CURRENT"}
                </div>
              </div>
              <div>
                <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: C.deep, border: `1px solid ${C.sand}`, aspectRatio: "3/4" }}>
                  {targetPhoto ? <img src={targetPhoto} alt="Target" className="w-full h-full object-cover" />
                    : <button onClick={() => targetRef.current?.click()} className="text-xs px-3 text-center" style={{ color: C.sand }}>Tap to upload your target photo</button>}
                </div>
                <div className="text-[11px] text-center mt-1.5 tracking-[0.2em]" style={{ color: C.sand }}>TARGET</div>
              </div>
            </div>
            <input ref={targetRef} type="file" accept="image/*" className="hidden"
                   onChange={(e) => e.target.files?.[0] && uploadTarget(e.target.files[0])} />
            {targetPhoto && (
              <button onClick={() => targetRef.current?.click()} className="w-full text-xs mt-3" style={{ color: C.mist }}>Change target photo</button>
            )}
          </section>

          <input ref={progressRef} type="file" accept="image/*" capture="user" className="hidden"
                 onChange={(e) => e.target.files?.[0] && uploadProgress(e.target.files[0])} />
          <button onClick={() => progressRef.current?.click()}
            className="w-full py-4 rounded-2xl text-lg tracking-[0.2em]"
            style={{ background: C.sea, color: C.deep, fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>
            📷 ADD PROGRESS PHOTO
          </button>
          <p className="text-xs text-center" style={{ color: C.mist }}>Same spot, same light, once a week. The mirror lies day to day — photos don't.</p>

          {progressPhotos.length > 0 && (
            <section className="rounded-2xl p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
              <h3 className="text-lg mb-3" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>TIMELINE <span className="text-xs" style={{ color: C.mist, fontFamily: "Inter", fontWeight: 400 }}>(last 10 kept)</span></h3>
              <div className="grid grid-cols-3 gap-2">
                {[...progressPhotos].reverse().map((p, ri) => {
                  const i = progressPhotos.length - 1 - ri;
                  return (
                    <div key={i} className="relative">
                      <img src={p.data} alt={p.date} className="w-full rounded-lg object-cover" style={{ aspectRatio: "3/4" }} />
                      <div className="text-[10px] text-center mt-1" style={{ color: C.mist }}>{fmtDay(p.date)}</div>
                      <button onClick={() => removeProgress(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                        style={{ background: "rgba(10,24,38,0.8)", color: C.foam }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>HEALTH SYNC</h3>
            {state.health?.days?.length ? (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(() => {
                  const d7 = state.health.days.slice(-7);
                  const avg = (k) => { const v = d7.filter((x) => x[k] != null); return v.length ? v.reduce((s, x) => s + x[k], 0) / v.length : null; };
                  const cells = [
                    { label: "AVG STEPS", val: avg("steps") ? Math.round(avg("steps")).toLocaleString() : "—" },
                    { label: "AVG SLEEP", val: avg("sleepHrs") ? avg("sleepHrs").toFixed(1) + "h" : "—" },
                    { label: "RESTING HR", val: avg("rhr") ? Math.round(avg("rhr")) + " bpm" : "—" },
                    { label: "WEIGHT", val: (() => { const w = d7.filter((x) => x.weightKg != null).slice(-1)[0]; return w ? w.weightKg.toFixed(1) + " kg" : "—"; })() },
                  ];
                  return cells.map((c) => (
                    <div key={c.label} className="rounded-xl px-3 py-3" style={{ background: C.deep, border: `1px solid ${C.line}` }}>
                      <div className="text-lg" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sea }}>{c.val}</div>
                      <div className="text-[10px] tracking-[0.2em]" style={{ color: C.mist }}>{c.label}</div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-xs mb-3" style={{ color: C.mist }}>Export from the free "Health Auto Export" app on your iPhone (format: JSON), then import here. The coach will use your sleep, steps and heart rate.</p>
            )}
            <input ref={healthRef} type="file" accept="application/json,.json,.xml,.zip" className="hidden"
                   onChange={(e) => e.target.files?.[0] && importHealth(e.target.files[0])} />
            <button onClick={() => healthRef.current?.click()} className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${C.sea}`, color: C.sea }}>
              {state.health ? "↻ Update health data" : "⬆ Import Apple Health data"}
            </button>
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>BLOOD WORK</h3>
            {state.blood.length > 0 && (() => {
              const idx = Math.min(bloodIdx ?? state.blood.length - 1, state.blood.length - 1);
              const b = state.blood[idx];
              const flagged = b.markers.filter((m) => m.flag === "low" || m.flag === "high");
              const isLatest = idx === state.blood.length - 1;
              return (
                <div className="mb-3">
                  {/* Pick which report to view (newest first) */}
                  {state.blood.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
                      {state.blood.map((r, i) => (
                        <button key={r.id} onClick={() => { setBloodIdx(i); setShowAllMarkers(false); }}
                          className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
                          style={{
                            background: i === idx ? C.sand : "transparent",
                            color: i === idx ? C.deep : C.mist,
                            border: `1px solid ${i === idx ? C.sand : C.line}`,
                            fontWeight: 600,
                          }}>
                          {fmtDay(r.date)}{i === state.blood.length - 1 ? " ·  latest" : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs mb-2" style={{ color: C.mist }}>
                    {isLatest ? "Latest" : "Viewing"}: {b.date} · {b.markers.length} markers{b.pages > 1 ? ` · ${b.pages} pages` : ""}
                  </div>

                  {flagged.length > 0 ? flagged.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderTop: `1px solid ${C.line}` }}>
                      <span>{m.name}</span>
                      <span style={{ color: m.flag === "high" ? C.alert : C.sand, fontWeight: 600 }}>{m.value} {m.unit} · {m.flag.toUpperCase()}</span>
                    </div>
                  )) : <p className="text-sm" style={{ color: C.sea }}>All markers in normal range ✓</p>}

                  {b.markers.length > flagged.length && (
                    <button onClick={() => setShowAllMarkers(!showAllMarkers)} className="w-full text-xs mt-2 py-1" style={{ color: C.mist }}>
                      {showAllMarkers ? "− Hide full results" : `+ Show all ${b.markers.length} markers`}
                    </button>
                  )}
                  {showAllMarkers && b.markers.map((m, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderTop: `1px solid ${C.line}` }}>
                      <span style={{ color: C.mist }}>{m.name}</span>
                      <span style={{ color: m.flag === "high" ? C.alert : m.flag === "low" ? C.sand : C.foam }}>{m.value} {m.unit}</span>
                    </div>
                  ))}

                  {b.summary && (
                    <div className="mt-3 px-3 py-2.5 rounded-xl text-sm leading-relaxed"
                         style={{ background: C.deep, borderLeft: `3px solid ${C.sand}`, color: C.foam }}>
                      <span className="text-[10px] tracking-[0.2em] block mb-1" style={{ color: C.sand }}>NOTES</span>
                      {b.summary}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Markers measured more than once — trend over time */}
            {(() => {
              const trends = bloodTrends();
              if (!trends.length) return null;
              return (
                <div className="mb-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                  <div className="text-[10px] tracking-[0.2em] mb-2" style={{ color: C.sea }}>OVER TIME</div>
                  {trends.map((tr, i) => {
                    const first = tr.points[0], last = tr.points[tr.points.length - 1];
                    const delta = last.value - first.value;
                    const color = last.flag === "high" ? C.alert : last.flag === "low" ? C.sand : C.sea;
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 py-2" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{tr.name}</div>
                          <div className="text-[11px]" style={{ color: C.mist }}>
                            {first.value} → <span style={{ color, fontWeight: 600 }}>{last.value}</span> {tr.unit}
                            {delta !== 0 && (
                              <span style={{ color: C.mist }}> · {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 100) / 100)}</span>
                            )}
                          </div>
                        </div>
                        <Spark points={tr.points} color={color} />
                      </div>
                    );
                  })}
                  <p className="text-[11px] mt-2 leading-relaxed" style={{ color: C.mist }}>
                    Shows any marker measured in two or more reports. Up or down isn't automatically good or bad — ask your doctor.
                  </p>
                </div>
              );
            })()}
            {/* Scan pages one at a time into reviewable text, then save as a report */}
            <div className="pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
              {(() => {
                const pages = draftPageCount(state.bloodDraft);
                return (
                  <>
                    <div className="text-[10px] tracking-[0.2em] mb-2" style={{ color: C.sand }}>
                      SCANNED TEXT{pages ? ` · ${pages} PAGE${pages > 1 ? "S" : ""}` : ""}
                    </div>
                    {state.bloodDraft ? (
                      <>
                        <textarea value={state.bloodDraft} rows={9}
                          onChange={(e) => save({ ...state, bloodDraft: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-y"
                          style={{ background: C.deep, border: `1px solid ${C.line}`, color: C.foam, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: 1.6 }} />
                        <p className="text-[11px] mt-1.5 mb-2 leading-relaxed" style={{ color: C.mist }}>
                          Check the numbers against your printout — you can edit them here. Add more pages, then save.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: C.mist }}>
                        Photograph your results one page at a time. Each page's text appears here so you can check it before anything is saved.
                      </p>
                    )}
                  </>
                );
              })()}

              <input ref={bloodRef} type="file" accept="image/*" multiple className="hidden"
                     onChange={(e) => e.target.files?.length && scanBloodPages(e.target.files)} />
              <div className="flex gap-2">
                <button onClick={() => bloodRef.current?.click()} disabled={bloodScanning || bloodSaving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ border: `1px solid ${C.sand}`, color: bloodScanning ? C.mist : C.sand }}>
                  {bloodScanning ? "Reading page…" : state.bloodDraft ? "📷 Add another page" : "📷 Scan first page"}
                </button>
                {state.bloodDraft && (
                  <button onClick={() => save({ ...state, bloodDraft: "" })} disabled={bloodScanning || bloodSaving}
                    className="px-4 rounded-xl text-sm" style={{ color: C.mist, border: `1px solid ${C.line}` }}>Clear</button>
                )}
              </div>

              {state.bloodDraft && (
                <button onClick={saveBloodReport} disabled={bloodSaving || bloodScanning}
                  className="w-full mt-2 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: bloodSaving ? C.line : C.sand, color: bloodSaving ? C.mist : C.deep }}>
                  {bloodSaving ? "Saving…" : "✓ Save as report"}
                </button>
              )}
            </div>

            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: C.mist }}>Informational only — not medical advice. Always discuss results with your doctor.</p>
          </section>

          {healthMsg && <p className="text-sm text-center" style={{ color: healthMsg.includes("✓") ? C.sea : C.alert }}>{healthMsg}</p>}
        </main>
      )}

      {/* ---------- PLAN ---------- */}
      {tab === "plan" && (
        <main className="px-4 space-y-4">
          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-3" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>THE ROTATION</h3>
            {CYCLE.map((k) => (
              <div key={k} className="flex items-center gap-3 py-2" style={{ borderTop: `1px solid ${C.line}` }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: DAYS[k].color, color: C.deep }}>{k}</span>
                <div>
                  <div className="text-sm font-semibold">{DAYS[k].name}</div>
                  <div className="text-xs" style={{ color: C.mist }}>{DAYS[k].sub}</div>
                </div>
              </div>
            ))}
            <p className="text-xs mt-3" style={{ color: C.mist }}>A → B → C → repeat. Rest days whenever family life demands — the cycle just continues.</p>
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>AI CONNECTION</h3>
            <p className="text-xs mb-3" style={{ color: C.mist }}>
              The coach, meal-photo analysis and blood-work reading use Claude. Paste your Anthropic API key — it is stored only on this device and sent straight to Anthropic from your phone. It never touches any other server.
            </p>
            <div className="flex gap-2">
              <input type="password" inputMode="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                placeholder={apiKey ? "•••••••• saved ••••••••" : "sk-ant-..."}
                value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: C.deep, border: `1px solid ${C.line}`, color: C.foam }} />
              <button onClick={saveApiKey} className="px-5 rounded-xl text-sm font-semibold" style={{ background: C.sea, color: C.deep }}>Save</button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: apiKey ? C.sea : C.mist }}>{apiKey ? "Key saved ✓" : "No key set"}</span>
              {apiKey && <button onClick={clearApiKey} className="text-xs" style={{ color: C.mist }}>Remove key</button>}
            </div>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
               className="inline-block mt-3 text-xs tracking-[0.15em] px-3 py-2 rounded-lg"
               style={{ border: `1px solid ${C.sea}`, color: C.sea, fontWeight: 600 }}>GET AN API KEY ↗</a>
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>PROFILE &amp; TARGETS</h3>
            <p className="text-xs mb-3" style={{ color: C.mist }}>Age sharpens the nutrition advice (recommendations shift with age in NNR2023/EFSA). Targets feed every coach comment.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "age", label: "AGE", ph: "e.g. 38" },
                { key: "kcal", label: "KCAL TARGET", ph: "1900" },
                { key: "protein", label: "PROTEIN G", ph: "150" },
              ].map((f) => (
                <div key={f.key}>
                  <input type="number" inputMode="numeric" placeholder={f.ph}
                    value={targetsDraft[f.key] ?? (state.targets[f.key] ?? "")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTargetsDraft((d) => ({ ...d, [f.key]: raw }));
                      if (raw === "") {
                        // Only age is optional; blank kcal/protein keeps the last value.
                        if (f.key === "age") save({ ...state, targets: { ...state.targets, age: null } });
                        return;
                      }
                      const v = parseInt(raw);
                      if (!isNaN(v)) save({ ...state, targets: { ...state.targets, [f.key]: v } });
                    }}
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none text-center"
                    style={{ background: C.deep, border: `1px solid ${C.line}`, color: C.foam }} />
                  <div className="text-[10px] text-center mt-1 tracking-[0.2em]" style={{ color: C.mist }}>{f.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>FUEL RULES</h3>
            <ul className="text-sm space-y-2">
              <li><span style={{ color: C.sea }}>①</span> Protein anchor at every meal — eggs, skyr, chicken, fish.</li>
              <li><span style={{ color: C.sea }}>②</span> Eat what the family eats: half the carbs, double the veg.</li>
              <li><span style={{ color: C.sea }}>③</span> Kitchen closes after the kids' bedtime. Non-negotiable.</li>
              <li><span style={{ color: C.sea }}>④</span> Slightly hungry is the target feeling. Miserable means eat more.</li>
            </ul>
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>WAIST CHECK <span className="text-sm" style={{ color: C.mist, fontFamily: "Inter", fontWeight: 400 }}>(weekly)</span></h3>
            <div className="flex gap-2">
              <input type="number" inputMode="decimal" placeholder="cm at navel" value={waistInput}
                     onChange={(e) => setWaistInput(e.target.value)}
                     className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                     style={{ background: C.deep, border: `1px solid ${C.line}`, color: C.foam }} />
              <button onClick={addWaist} className="px-5 rounded-xl text-sm font-semibold" style={{ background: C.sand, color: C.deep }}>Log</button>
            </div>
            {state.waist.length > 0 && (
              <div className="mt-3 space-y-1">
                {[...state.waist].slice(-6).reverse().map((w) => (
                  <div key={w.date} className="flex justify-between text-sm py-1" style={{ borderTop: `1px solid ${C.line}` }}>
                    <span style={{ color: C.mist }}>{fmtDay(w.date)}</span>
                    <span style={{ fontWeight: 600 }}>{w.cm} cm</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-2" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>BACKUP &amp; RESTORE</h3>
            <p className="text-xs mb-3" style={{ color: C.mist }}>Export before updating to a new version of the app, then import here to bring everything back — workouts, food, photos, chat.</p>
            <div className="flex gap-2">
              <button onClick={exportBackup} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: C.sea, color: C.deep }}>⬇ Export data</button>
              <button onClick={() => backupRef.current?.click()} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: `1px solid ${C.sea}`, color: C.sea }}>⬆ Import backup</button>
            </div>
            <input ref={backupRef} type="file" accept="application/json,.json" className="hidden"
                   onChange={(e) => e.target.files?.[0] && importBackup(e.target.files[0])} />
            {error && tab === "plan" && <p className="text-xs mt-2" style={{ color: C.alert }}>{error}</p>}
          </section>

          <section className="rounded-2xl p-5" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
            <h3 className="text-xl mb-1" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700 }}>TOTALS</h3>
            <div className="flex gap-6 text-sm">
              <div><span className="text-2xl" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sea }}>{state.completed.length}</span> <span style={{ color: C.mist }}>workouts</span></div>
              <div><span className="text-2xl" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, color: C.sand }}>{Object.keys(state.food).length}</span> <span style={{ color: C.mist }}>days logged</span></div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
