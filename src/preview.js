/* ───────────────────────────────────────────────────────────────
   Preview mode — a fake Supabase that lives in the browser tab.

   Turn it on by adding ?preview to the URL:
       https://ist-opendoors.vercel.app/?preview

   Everything behaves like the real thing — you can open classes,
   sign up to visit, cancel — but nothing leaves the tab and nothing
   touches the database. Reload the page and it resets.

   Delete this file (and the two lines in supabase.js that import it)
   once Microsoft sign-in is live and you no longer need it.
   ─────────────────────────────────────────────────────────────── */

export const PREVIEW =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("preview");

const USER = {
  id: "preview-user",
  email: "preview@istianjin.org.cn",
  user_metadata: { full_name: "Joe Schaaf" }
};

const SESSION = { user: USER, access_token: "preview" };

/* ── seed data ─────────────────────────────────────────────────
   A few classes already on the board so the calendar isn't empty.
   Two of them are "yours", so you can see the host's view too. */

let n = 0;
const uid = () => `preview-${++n}`;

function entry(o) {
  return {
    id: uid(),
    created_at: new Date().toISOString(),
    grade: "", room: "", strategies: [], standards: [], note: null, attachment: null,
    ...o
  };
}

const ENTRIES = [
  entry({
    division: "Secondary", date_str: "2026-10-20", period_key: "B12",
    host_email: "k.haines@istianjin.org.cn", host_name: "Kit Haines",
    subject: "History", grade: "Grade 10", room: "S204",
    strategies: ["Discussion (whole class / pair-share)", "Questioning Techniques"],
    standards: ["C4 High expectations for thinking and ethical reasoning",
                "A3 Structures for agency, voice and ownership"],
    note: "Sources lesson — students argue over two accounts of the same event. The back half of the lesson is all them."
  }),
  entry({
    division: "Secondary", date_str: "2026-10-20", period_key: "B34",
    host_email: "t.craig@istianjin.org.cn", host_name: "Trey Craig",
    subject: "Math", grade: "Grade 8", room: "S112",
    strategies: ["Small Group Instruction", "Formative Assessment"],
    note: "Mid-unit check. I pull a group while the rest work through problem stations."
  }),
  entry({
    division: "Secondary", date_str: "2026-10-22", period_key: "B56",
    host_email: "preview@istianjin.org.cn", host_name: "Joe Schaaf",
    subject: "English Language and Literature", grade: "Grade 11", room: "S301",
    strategies: ["Modeling", "Feedback / Conferencing"],
    standards: ["D3 Feedback: specific, constructive and actionable"],
    note: "Paper 1 practice. I model an opening, then confer while they draft."
  }),
  entry({
    division: "Secondary", date_str: "2026-10-27", period_key: "B78",
    host_email: "h.zhai@istianjin.org.cn", host_name: "Hao Zhai",
    subject: "Design", grade: "Grade 9", room: "D102",
    strategies: ["Student Agency / Choice", "Use of Technology"],
    standards: ["G1 Purposeful use of digital tools and AI",
                "G3 Students use technology critically and creatively"],
    note: "Prototyping day — noisy, and that's the point."
  }),
  entry({
    division: "Secondary", date_str: "2026-11-03", period_key: "B12",
    host_email: "preview@istianjin.org.cn", host_name: "Joe Schaaf",
    subject: "Theory of Knowledge (TOK)", grade: "Grade 12", room: "S301",
    strategies: ["Discussion (whole class / pair-share)"],
    note: "Knowledge question seminar. Students run it; I mostly stay out of the way."
  }),
  entry({
    division: "Elementary", date_str: "2026-10-19", period_key: "P2",
    host_email: "a.rivera@istianjin.org.cn", host_name: "Ana Rivera",
    subject: "Reading", grade: "Grade 2", room: "E07",
    strategies: ["Read Aloud", "Workshop & Conferring Strategies"],
    note: "Read aloud then straight into independent reading with conferring."
  }),
  entry({
    division: "Elementary", date_str: "2026-10-21", period_key: "P5",
    host_email: "m.okafor@istianjin.org.cn", host_name: "Michael Okafor",
    subject: "UOI (Unit of Inquiry)", grade: "Grade 4", room: "E14",
    strategies: ["Inquiry-Based Learning", "Student Collaboration / Group Work"],
    standards: ["B3 Inquiry/Creative Process in unit design",
                "C1 Inquiry/Creative Process and student independence"],
    note: "Provocation for the new unit. Lots of questions on chart paper by the end."
  }),
  entry({
    division: "Elementary", date_str: "2026-10-28", period_key: "P3",
    host_email: "s.bradley@istianjin.org.cn", host_name: "Stefanie Ruth Bradley",
    subject: "Maths", grade: "Kindergarten", room: "E02",
    strategies: ["Play-Based Learning", "Station / Centre Rotation"],
    note: "Number stations. Four groups, rotating every eight minutes."
  })
];

const VISITS = [
  {
    id: uid(), entry_id: ENTRIES[0].id,
    visitor_email: "t.craig@istianjin.org.cn", visitor_name: "Trey Craig",
    status: "going", cancel_reason: null, cancel_note: null,
    cancelled_at: null, created_at: new Date().toISOString()
  },
  {
    id: uid(), entry_id: ENTRIES[5].id,
    visitor_email: "m.okafor@istianjin.org.cn", visitor_name: "Michael Okafor",
    status: "going", cancel_reason: null, cancel_note: null,
    cancelled_at: null, created_at: new Date().toISOString()
  }
];

const DB = { opendoors_entries: ENTRIES, opendoors_visits: VISITS };

/* ── a query builder shaped like Supabase's ───────────────────── */

class Query {
  constructor(table) {
    this.table = table;
    this.op = "select";
    this.payload = null;
    this.conflict = null;
    this.filters = [];
    this.one = false;
  }
  select() { return this; }                       // no-op; chains after insert/upsert too
  eq(col, val) { this.filters.push([col, val]); return this; }
  single() { this.one = true; return this; }
  insert(rows) { this.op = "insert"; this.payload = rows; return this; }
  upsert(row, opts) {
    this.op = "upsert"; this.payload = row;
    this.conflict = (opts?.onConflict || "").split(",").map(s => s.trim()).filter(Boolean);
    return this;
  }
  update(patch) { this.op = "update"; this.payload = patch; return this; }
  delete() { this.op = "delete"; return this; }

  matches(row) { return this.filters.every(([c, v]) => row[c] === v); }

  run() {
    const rows = DB[this.table];
    let out;

    if (this.op === "select") {
      out = rows.filter(r => this.matches(r));
    } else if (this.op === "insert") {
      const added = (Array.isArray(this.payload) ? this.payload : [this.payload])
        .map(r => ({ id: uid(), created_at: new Date().toISOString(), ...r }));
      rows.push(...added);
      out = added;
    } else if (this.op === "upsert") {
      const keys = this.conflict.length ? this.conflict : ["id"];
      const i = rows.findIndex(r => keys.every(k => r[k] === this.payload[k]));
      if (i >= 0) {
        rows[i] = { ...rows[i], ...this.payload };
        out = [rows[i]];
      } else {
        const added = { id: uid(), created_at: new Date().toISOString(), ...this.payload };
        rows.push(added);
        out = [added];
      }
    } else if (this.op === "update") {
      out = [];
      rows.forEach((r, i) => {
        if (this.matches(r)) { rows[i] = { ...r, ...this.payload }; out.push(rows[i]); }
      });
    } else if (this.op === "delete") {
      out = rows.filter(r => this.matches(r));
      DB[this.table] = rows.filter(r => !this.matches(r));
    }

    // deep-copy so callers can't mutate the store by accident
    const data = JSON.parse(JSON.stringify(out));
    return { data: this.one ? (data[0] ?? null) : data, error: null };
  }

  then(resolve, reject) {
    return new Promise(r => setTimeout(() => r(this.run()), 120)).then(resolve, reject);
  }
}

/* ── the fake client ──────────────────────────────────────────── */

export const previewClient = {
  auth: {
    getSession: async () => ({ data: { session: SESSION }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => {
      window.location.href = window.location.pathname;   // drop ?preview
      return { error: null };
    }
  },
  from: (table) => new Query(table)
};

/* Email is logged, not sent. */
export async function previewNotify(payload) {
  console.log("[preview] email that would have gone out:", payload);
}
