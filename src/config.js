/* ───────────────────────────────────────────────────────────────
   Open Doors — shared configuration
   Everything that changes year to year lives here.
   ─────────────────────────────────────────────────────────────── */

export const WINDOW_LABEL = "10/19/2026 – 11/06/2026";

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const WEEKS = [
  { label: "B Week", sublabel: "10/19/2026 – 10/23/2026",
    dates: ["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23"] },
  { label: "A Week", sublabel: "10/26/2026 – 10/30/2026",
    dates: ["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"] },
  { label: "B Week", sublabel: "11/02/2026 – 11/06/2026",
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
  "Play-Based Learning","Use of Technology","AI"
];

FOCUS_PEDAGOGY.sort((a, b) => a.localeCompare(b));
FOCUS_GENERAL.sort((a, b) => a.localeCompare(b));

export const ALL_FOCUS = [...FOCUS_PEDAGOGY, ...FOCUS_GENERAL];

/* ───────────────────────────────────────────────────────────────
   IST Teaching Standards Framework, v2 (strands refined after the
   September PD). Entirely separate from the focus list above — a
   teacher may use either, both, or neither.
   ─────────────────────────────────────────────────────────────── */

export const STANDARDS = [
  { code: "A", title: "Learning Environment", strands: [
    "A1 Social tone, safety and wellbeing",
    "A2 Relationships and routines",
    "A3 Structures for agency, voice and ownership",
    "A4 Learning made visible",
    "A5 Arrangement, materials and readiness"
  ]},
  { code: "B", title: "Planning for High-Quality Learning", strands: [
    "B1 Coherence, purpose and conceptual progression",
    "B2 HQL framework and IB Programme integration",
    "B3 Inquiry/Creative Process in unit design",
    "B4 Differentiation by design",
    "B5 Alignment: goals, learning and assessment"
  ]},
  { code: "C", title: "Approaches to Teaching", strands: [
    "C1 Inquiry/Creative Process and student independence",
    "C2 Instructional toolbox and responsive adaptation",
    "C3 Curiosity, resilience and love of learning",
    "C4 High expectations for thinking and ethical reasoning",
    "C5 Refining teaching through evidence and dialogue"
  ]},
  { code: "D", title: "Assessment and Feedback", strands: [
    "D1 Formative and summative assessment practice",
    "D2 Moderation and shared judgment",
    "D3 Feedback: specific, constructive and actionable",
    "D4 Reporting and communicating learning",
    "D5 Task design for voice, ownership and authenticity"
  ]},
  { code: "E", title: "Learner Profile in Practice", strands: [
    "E1 Modeled by the teacher",
    "E2 Embedded in learning",
    "E3 International mindedness",
    "E4 Action beyond the classroom",
    "E5 Celebrating growth meaningfully"
  ]},
  /* Not offered in Open Doors: these describe how you work across a
     year, not what a colleague can see in one 40-minute lesson.
     Flip to observable: true to put it back in the pickers. */
  { code: "F", title: "Professional Responsibilities", observable: false, strands: [
    "F1 Integrity and advocacy for IST's mission",
    "F2 Collaboration",
    "F3 Communication",
    "F4 Work habits",
    "F5 Adaptability and resilience",
    "F6 Professional learning and growth"
  ]},
  { code: "G", title: "AI and Digital Literacy", strands: [
    "G1 Purposeful use of digital tools and AI",
    "G2 Digital citizenship: responsible use and privacy",
    "G3 Students use technology critically and creatively",
    "G4 AI literacy",
    "G5 Academic integrity"
  ]}
];

/* What the pickers and filters actually offer. */
export const OBSERVABLE_STANDARDS = STANDARDS.filter(s => s.observable !== false);

export const ALL_STRANDS = OBSERVABLE_STANDARDS.flatMap(s => s.strands);

/* "C3 Curiosity…" → the standard it belongs to */
export function standardOf(strand) {
  return STANDARDS.find(s => s.code === strand[0]) || null;
}

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

/* Same palette as the Cover Board (cover.commonpractices.org), so the
   two tools read as one system. Token names here are kept as they were
   so nothing else in the app had to change. */

export const T = {
  ink:     "#2b2929",
  red:     "#cd2129",   // --accent
  redDark: "#a81a21",   // --accent hover
  redBg:   "#fbe9e9",   // --accent-soft
  redMid:  "#eccbc3",
  stripe:  "#f89c26",   // the orange bar under the header
  page:    "#f7f7f7",   // --paper
  card:    "#ffffff",
  text:    "#2b2929",   // --ink
  text2:   "#5c6474",   // --ink-soft
  muted:   "#8a90a0",
  line:    "#e6e3dd",
  lineStrong: "#d3cec5",
  today:   "#fbe9e9",

  /* school orange, for the standards picker and the visit side */
  amber:     "#8a5a00",
  amberBg:   "#faf0dc",
  amberLine: "#f0dfb8",

  /* class states, matching the Cover Board's slot colors */
  open:    "#b0524a", openBg: "#f7ece9", openLine: "#eccbc3", openInk: "#6e241c",
  full:    "#4a7c5c", fullBg: "#e9f2ea", fullLine: "#c9e0cd", fullInk: "#144e31",

  radius:  12,
  shadow:  "0 1px 2px rgba(38,47,61,.05), 0 6px 20px rgba(38,47,61,.05)"
};

export const FONT =
  "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/* Per-teacher accents, drawn from the Cover Board's category colors
   (sick / personal / PD / business / other / late) so nothing clashes. */
const CHIP_COLORS = [
  "#cd2129","#3a86c8","#4a7c5c","#7c6a9e","#b0524a","#1A5276",
  "#117A65","#6E2F8A","#a81a21","#5c6474","#2f7a48","#8a5a00"
];

export function colorFor(name) {
  if (!name) return "#8a8580";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length];
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

export function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "2-digit", day: "2-digit", year: "numeric"
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


/* Timetable-aware Open Doors selection.
   A week = Days 1–5; B week = Days 6–10. */
/* Read every teacher's classes from the imported 2026–27 dataset.
   The previous one-person table here blocked everyone except Joe Schaaf. */
const SEC_SLOTS = { B12: "a", B34: "b", B56: "c", B78: "d" };

export function timetableDayForDate(iso) {
  const { week, dayIndex } = locate(iso);
  if (!week) return null;
  return (week.label.startsWith("A") ? 1 : 6) + dayIndex;
}

function normTeacherName(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* Microsoft may use surname-first display names; the verified school email
   also provides a stable candidate, e.g. Hao_Zhai@istianjin.org.cn. */
/* Identity aliases verified against the current Open Doors faculty directory.
   Microsoft profile names can differ from names in the imported school timetable.
   Do not guess email addresses from teacher names. */
const VERIFIED_SECONDARY_EMAIL_ALIASES = {
  "ambika_gb@istianjin.org.cn": "Ambika Balakrishna",
  "ben_silvis@istianjin.org.cn": "Gerben Silvis",
  "eva_fu@istianjin.org.cn": "Fu Ping",
  "geoffrey_diegel@istianjin.org.cn": "Geoff Diegel",
  "hyun_ae_kim@istianjin.org.cn": "Sheila Kim",
  "jeffrey_errington@istianjin.org.cn": "Jeff Errington",
  "madeleine_haines@istianjin.org.cn": "Maddy Haines",
  "muriel_charpentier@istianjin.org.cn": "Muriel King"
};

export function matchedSecondaryTeacher(name, email = "", timetables = {}) {
  const verifiedEmail = String(email).trim().toLowerCase();
  const namedAlias = VERIFIED_SECONDARY_EMAIL_ALIASES[verifiedEmail];
  if (namedAlias && Object.hasOwn(timetables.sec || {}, namedAlias)) return namedAlias;
  const fromEmail = String(email).split("@")[0].replace(/[._-]/g, " ");
  const wanted = [name, fromEmail].map(normTeacherName).filter(Boolean);
  if (!wanted.length) return null;
  return Object.keys(timetables.sec || {}).find(teacher => {
    const reversed = teacher.trim().split(/\s+/).reverse().join(" ");
    return wanted.includes(normTeacherName(teacher)) || wanted.includes(normTeacherName(reversed));
  }) || null;
}

export function hasSecondaryLessons(name, email = "", timetables = {}) {
  const teacher = matchedSecondaryTeacher(name, email, timetables);
  return !!teacher && Object.values(timetables.sec[teacher] || {})
    .some(record => Array.isArray(record) && !!record[0]);
}

export function scheduledClassFor(name, iso, periodKey, timetables = {}, email = "") {
  const day = timetableDayForDate(iso);
  const slot = SEC_SLOTS[periodKey];
  if (day === null || !slot) return null;
  const teacher = matchedSecondaryTeacher(name, email, timetables);
  if (!teacher) return null;
  const record = timetables.sec[teacher][`${day}${slot}`];
  if (!Array.isArray(record) || !record[0]) return null;
  const [subject, grade, room] = record;
  return { subject: String(subject), grade: String(grade || ""), room: String(room || "") };
}


/* Elementary P1–P8 timetable integration. Data is imported from IST's
   2026–27 teacher workbook via src/elementary-timetable.js.
   A/B weeks, cross-division specialists, and teacher names that differ
   from their Microsoft profiles are handled explicitly.
   A combined source sheet is never assumed to identify the instructor. */
export const ELEMENTARY_SCHEDULE_IDENTITIES = [
  { name: "Tara Nguyen", email: "tara_nguyen@istianjin.org.cn", sheets: ["Tara & Monique-ELC"] },
  { name: "Monique Barthakur", email: "monique_barthakur@istianjin.org.cn", sheets: ["Tara & Monique-ELC"] },
  { name: "Clare Murphy", email: "clare_craig@istianjin.org.cn", sheets: ["Clare-K"] },
  { name: "Jo Reston", email: "jo_reston@istianjin.org.cn", sheets: ["Jo-G1"] },
  { name: "Nadia Nel", email: "nadia_nel@istianjin.org.cn", sheets: ["Nadia-G1"] },
  { name: "Christopher Lowrey", email: "chris_lowrey@istianjin.org.cn", sheets: ["Chris-G2A", "Chris-G2B"] },
  { name: "Billy Brown", email: "billy_brown@istianjin.org.cn", sheets: ["Billy-G3"] },
  { name: "Michael Crisp", email: "michael_crisp@istianjin.org.cn", sheets: ["Michael-G4"] },
  { name: "Celeste Staal", email: "celeste_staal@istianjin.org.cn", sheets: ["Celeste-G4"] },
  { name: "Nicole Barry", email: "nicole_barry@istianjin.org.cn", sheets: ["Nicole-G5"] },
  { name: "Gemma Lowrey", email: "gemma_lowrey@istianjin.org.cn", sheets: ["Gemma-G5"] },
  { name: "Sara Derwish", email: "sara_derwish@istianjin.org.cn", sheets: ["Sara-ELA"] },
  { name: "Stefanie Bradley", email: "stefanie_bradley@istianjin.org.cn", sheets: ["Stef-ELA"] },
  { name: "Toni Jarratt", email: "toni_jarratt@istianjin.org.cn", sheets: ["Toni-IN"] },
  { name: "Isha Joshi", email: "isha_joshi@istianjin.org.cn", sheets: ["Isha-Art"] },
  { name: "Victoria Lee", email: "victoria_lee@istianjin.org.cn", sheets: ["Victoria-MUSIC"] },
  { name: "Islen Craig", email: "islen_craig@istianjin.org.cn", sheets: ["Islen-STEM"] },
  { name: "Linnea Simon", email: "linnea_simon@istianjin.org.cn", sheets: ["Linnea-Library"] },
  { name: "Ben Silvis", email: "ben_silvis@istianjin.org.cn", sheets: ["Ben-PSPE"] },
  { name: "Wendy Bekkenk", email: "wendy_bekkenk@istianjin.org.cn", sheets: ["Wendy-PE"] },
  { name: "Dorian", email: "", sheets: ["Durian-PE"] },
  { name: "Michael Tschoepel", email: "michael_tschoepel@istianjin.org.cn", sheets: ["Michael-German"] },
  { name: "Esther Luppino", email: "esther_luppino@istianjin.org.cn", sheets: ["Esther-French"] },
  { name: "Helen Wang", email: "helen_wang@istianjin.org.cn", sheets: ["Helen-Fu Ping-Jennifer-Chinese"], shared: true },
  { name: "Fu Ping", email: "eva_fu@istianjin.org.cn", sheets: ["Helen-Fu Ping-Jennifer-Chinese"], shared: true },
  { name: "Jennifer Liu", email: "jennifer_liu@istianjin.org.cn", sheets: ["Helen-Fu Ping-Jennifer-Chinese"], shared: true },
  { name: "Mariana Suarez", email: "mariana_suarez@istianjin.org.cn", sheets: ["Mariana-PYPC"] }
];

export function matchedElementarySources(name, email = "", timetables = {}) {
  const emailNorm = String(email || "").trim().toLowerCase();
  const nameNorm = normTeacherName(name);
  // The PE master labels this teacher DW. The old imported source calls the
  // sheet "Durian-PE", while the supplied master identifies DW as Dorian.
  const PE_DW_NAMES = new Set(["dorian", "dorianwang", "durian", "durianwang"]);
  const registered = ELEMENTARY_SCHEDULE_IDENTITIES.find(p =>
    (emailNorm && p.email === emailNorm) || (nameNorm &&
      (normTeacherName(p.name) === nameNorm ||
        (p.name === "Dorian" && PE_DW_NAMES.has(nameNorm)))));
  const available = Object.keys(timetables.es || {});
  const requested = registered?.sheets || [String(name || "")];
  return requested.flatMap(key => {
    const exact = available.find(existing => normTeacherName(existing) === normTeacherName(key));
    return exact ? [exact] : [];
  });
}

export function elementaryLabelsFor(name, email, iso, periodKey, timetables = {}) {
  const { week, dayIndex } = locate(iso);
  const period = Number(String(periodKey).slice(1));
  if (!week || !/^P[1-8]$/.test(periodKey)) return [];
  const letter = week.label.startsWith("A") ? "A" : "B";
  const sources = matchedElementarySources(name, email, timetables);
  const labels = [];
  for (const source of sources) {
    // The classroom teacher has two distinct sources, one for each week.
    if (source === "Chris-G2A" && letter !== "A") continue;
    if (source === "Chris-G2B" && letter !== "B") continue;
    const t = timetables.es[source] || {};
    const d = dayIndex + 1;
    for (const key of [`${letter}${d}${period}`, `AB${d}${period}`]) {
      for (const label of t[key] || []) {
        const entry = String(label || "").trim();
        if (!entry || /^(recess|lunch|prep|planning|free|duty|assembly|school finishes|check.?out only|meeting|home.?room)\b/i.test(entry)) continue;
        if (/\b(meeting|duty|recess|lunch|school finishes)\b/i.test(entry)) continue;
        if (!labels.includes(entry)) labels.push(entry);
      }
    }
  }
  return labels;
}

export function hasElementaryLessons(name, email = "", timetables = {}) {
  const sources = matchedElementarySources(name, email, timetables);
  if (!sources.length) return false;
  // Shared sheets list lessons but cannot assign a given class to one of
  // the named instructors. These staff must verify/enter their own class.
  const registered = ELEMENTARY_SCHEDULE_IDENTITIES.find(p => p.email &&
    String(email).toLowerCase() === p.email);
  if (registered?.shared) return false;
  for (const week of WEEKS) for (const day of week.dates) for (let p=1;p<=8;p++)
    if (elementaryLabelsFor(name, email, day, `P${p}`, timetables).length) return true;
  return false;
}

export function scheduledElementaryClassFor(name, iso, periodKey, timetables = {}, email = "") {
  const registered = ELEMENTARY_SCHEDULE_IDENTITIES.find(p => p.email &&
    String(email).toLowerCase() === p.email);
  if (registered?.shared) return null;
  const labels = elementaryLabelsFor(name, email, iso, periodKey, timetables);
  if (!labels.length) return null;
  const sources = matchedElementarySources(name, email, timetables);
  const sourceName = sources[0] || "";
  const gradeMatch = sourceName.match(/-G([1-5])\b/i) ||
    labels.join(" ").match(/(?:Grade\s*|\bG)([1-5])\b/i);
  const grade = gradeMatch ? gradeMatch[1] :
    /-K\b|kinder|\bK[MDR]?\b/i.test(sourceName) ? "Kindergarten" :
    /ELC/i.test(sourceName) ? "Nursery" : "Mixed";
  const specialization = /-PSPE|-PE\b/i.test(sourceName) ? "PE" :
    /-MUSIC/i.test(sourceName) ? "Music" :
    /-Art/i.test(sourceName) ? "Art" :
    /-Library/i.test(sourceName) ? "Library" :
    /-STEM/i.test(sourceName) ? "STEM" :
    /-French/i.test(sourceName) ? "French" :
    /-German/i.test(sourceName) ? "German" : "";
  const subject = specialization ? `${specialization}: ${labels.join(" / ")}` : labels.join(" / ");
  return { subject, grade, room: "" };
}
