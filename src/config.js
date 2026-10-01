/* ───────────────────────────────────────────────────────────────
   Open Doors — shared configuration
   Everything that changes year to year lives here.
   ─────────────────────────────────────────────────────────────── */

export const WINDOW_LABEL = "19 October – 6 November 2026";

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const WEEKS = [
  { label: "B Week", sublabel: "19–23 October",
    dates: ["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23"] },
  { label: "A Week", sublabel: "26–30 October",
    dates: ["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"] },
  { label: "B Week", sublabel: "2–6 November",
    dates: ["2026-11-02","2026-11-03","2026-11-04","2026-11-05","2026-11-06"] }
];

export const ES_PERIODS = [
  { key: "P1", label: "P1", time: "8:25 – 9:05" },
  { key: "P2", label: "P2", time: "9:05 – 9:45" },
  { key: "P3", label: "P3", time: "10:05 – 10:45" },
  { key: "P4", label: "P4", time: "10:45 – 11:25" },
  { key: "P5", label: "P5", time: "11:25 – 12:05" },
  { key: "P6", label: "P6", time: "1:10 – 1:50" },
  { key: "P7", label: "P7", time: "1:50 – 2:30" },
  { key: "P8", label: "P8", time: "2:30 – 3:10" }
];

export const SEC_BLOCKS = [
  { key: "B12", label: "1 – 2", time: "8:25 – 9:45" },
  { key: "B34", label: "3 – 4", time: "10:05 – 11:25" },
  { key: "B56", label: "5 – 6", time: "11:25 – 1:50" },
  { key: "B78", label: "7 – 8", time: "1:50 – 3:10" }
];

export const SUBJECTS_ES = [
  "Art","Choral","Chinese","Class Text","Community Engagement","Design","ELA",
  "Fitness","French","German","Handwriting","Home Room","Homework",
  "Individual Needs","Instrumental","Languages","Library","Maths","Music","PE",
  "Portfolio","Quick Write","Reading","Second Step","Spelling","ST","STEM",
  "UOI (Unit of Inquiry)","Vocabulary","World Languages","Writing"
];

export const SUBJECTS_SEC = [
  "Art","Biology","Chemistry","Chinese Ab Initio",
  "Chinese Language and Literature","Chinese Language Arts","Chinese Studies",
  "Community Project","Design","Drama","Economics","English",
  "English Language and Literature","English Language Arts","Extended Essay",
  "French","Geography","German","History","Humanities","Individual Needs",
  "Korean","Library","Math","Music","Personal Project",
  "Physical Education (PE)","Physics","Science","Study Hall",
  "Theory of Knowledge (TOK)"
];

export const GRADES_ES = [
  "Nursery","Pre-K","Kindergarten","Grade 1","Grade 2","Grade 3","Grade 4",
  "Grade 5","Mixed","Staff"
];

export const GRADES_SEC = [
  "Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12",
  "Mixed","Staff"
];

/* What a host says they'll be highlighting — the door-card vocabulary,
   plus a broader general list. */
export const FOCUS_PEDAGOGY = [
  "Modeling","SRSD Strategy Instruction","Cornell Notetaking","Creative Process",
  "Workshop & Conferring Strategies","Discussion (whole class / pair-share)",
  "Feedback / Conferencing","Active Learning / Teacher Circulating"
];

export const FOCUS_GENERAL = [
  "Classroom Management","Routines & Transitions","Small Group Instruction",
  "Student Collaboration / Group Work","Differentiation","Questioning Techniques",
  "Formative Assessment","Inquiry-Based Learning","Student Agency / Choice",
  "Read Aloud","Vocabulary Instruction","Station / Centre Rotation",
  "Play-Based Learning","Use of Technology"
];

export const ALL_FOCUS = [...FOCUS_PEDAGOGY, ...FOCUS_GENERAL];

export const CANCEL_REASONS = [
  "Schedule conflict came up",
  "Asked to cover another class",
  "Out sick",
  "Meeting I can't move",
  "Visiting a different class instead",
  "Other"
];

/* ───────────────────────────────────────────────────────────────
   Look
   ─────────────────────────────────────────────────────────────── */

export const T = {
  ink:    "#1a1a1a",
  red:    "#a32a24",
  redBg:  "#fdf2f1",
  redMid: "#e0a9a5",
  page:   "#f4f3f1",
  card:   "#ffffff",
  text:   "#1a1a1a",
  text2:  "#55524e",
  muted:  "#96918b",
  line:   "#e3e0dc",
  today:  "#fdf2f1"
};

export const FONT =
  "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const CHIP_COLORS = [
  "#a32a24","#2471A3","#1E8449","#7D3C98","#A04000","#1A5276",
  "#117A65","#6E2F8A","#922B21","#1F618D","#196F3D","#6C3483"
];

export function colorFor(name) {
  if (!name) return "#8a8580";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length];
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long"
  });
}

export function isToday(iso) {
  const t = new Date();
  const pad = n => String(n).padStart(2, "0");
  return iso === `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/* Which week an ISO date belongs to, and which weekday column. */
export function locate(iso) {
  for (const w of WEEKS) {
    const i = w.dates.indexOf(iso);
    if (i !== -1) return { week: w, dayIndex: i };
  }
  return { week: null, dayIndex: 0 };
}

export function periodsFor(division) {
  return division === "Elementary" ? ES_PERIODS : SEC_BLOCKS;
}

export function periodLabel(division, key) {
  const p = periodsFor(division).find(x => x.key === key);
  if (!p) return key;
  return division === "Elementary" ? p.label : `Periods ${p.label}`;
}
