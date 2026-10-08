import { useState, useEffect, useCallback } from "react";
import { supabase, notify } from "./supabase";
import { PREVIEW } from "./preview";
import {
  WINDOW_LABEL, DAY_NAMES, SHORT_DAYS, WEEKS,
  SUBJECTS_ES, SUBJECTS_SEC, GRADES_ES, GRADES_SEC,
  FOCUS_PEDAGOGY, FOCUS_GENERAL, ALL_FOCUS, CANCEL_REASONS,
  OBSERVABLE_STANDARDS,
  T, FONT, colorFor, fmtDate, fmtLong, isToday, locate,
  periodsFor, periodLabel, scheduledClassFor
} from "./config";

/* ═══════════════════════════════════════════════ shared bits */

const input = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.line}`,
  borderRadius: 5, padding: "9px 11px", fontSize: 14, fontFamily: FONT,
  outline: "none", background: "#fcfbfa", color: T.text
};

const lbl = {
  fontSize: 10, fontWeight: 700, color: T.muted, display: "block",
  marginBottom: 5, letterSpacing: ".1em", textTransform: "uppercase"
};

const btn = (kind) => ({
  padding: kind === "big" ? "12px 26px" : "9px 18px",
  borderRadius: 5, border: "none", cursor: "pointer",
  fontSize: kind === "big" ? 14 : 13, fontWeight: 700, fontFamily: FONT,
  background: T.red, color: "#fff"
});

const btnGhost = {
  padding: "9px 18px", borderRadius: 5, border: `1.5px solid ${T.line}`,
  background: "transparent", cursor: "pointer", fontSize: 13,
  color: T.text2, fontFamily: FONT
};

function Splash({ text }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", fontFamily: FONT, color: T.red, background: T.page
    }}>{text}</div>
  );
}

function Modal({ children, onClose, width = 560 }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(26,26,26,.5)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      zIndex: 100, padding: "40px 20px", overflowY: "auto"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: T.radius, padding: 30, width: "100%",
        maxWidth: width, boxShadow: "0 16px 56px rgba(0,0,0,.22)",
        fontFamily: FONT, color: T.text
      }}>{children}</div>
    </div>
  );
}

const ADMIN_EMAILS = new Set(["cam_wallace@istianjin.org.cn","michael_conway@istianjin.org.cn","steve_moody@istianjin.org.cn","joe_schaaf@istianjin.org.cn","mariana_suarez@istianjin.org.cn","gemma_lowrey@istianjin.org.cn","ellie_chuah@istianjin.org.cn","kit_haines@istianjin.org.cn"]);

/* ═══════════════════════════════════════════════ app */

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [mode, setMode] = useState(null);          // null | "open" | "visit"
  const [division, setDivision] = useState("Secondary");
  const [entries, setEntries] = useState([]);
  const [visits, setVisits] = useState([]);
  const [walkins, setWalkins] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(null);
  const [flash, setFlash] = useState(null);

  const me = session?.user;
  const myEmail = (me?.email ?? "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.has(myEmail);
  const myName =
    me?.user_metadata?.full_name ||
    me?.user_metadata?.name ||
    (myEmail ? myEmail.split("@")[0].replace(/[._]/g, " ") : "");

  /* ── auth */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { scopes: "openid profile email", redirectTo: window.location.origin }
    });
    if (error) setErr("Sign-in failed. " + error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEntries([]); setVisits([]); setWalkins([]); setLoaded(false); setMode(null);
  }

  /* ── data */
  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [e, v, w] = await Promise.all([
        supabase.from("opendoors_entries").select("*"),
        supabase.from("opendoors_visits").select("*").eq("status", "going"),
        PREVIEW ? Promise.resolve({data:[],error:null}) : supabase.from("opendoors_walkins").select("*")
      ]);
      if (e.error) throw e.error;
      if (v.error) throw v.error;
      if (w.error) throw w.error;
      setEntries(e.data || []);
      setVisits(v.data || []);
      setWalkins(w.data || []);
      setErr(null);
    } catch (e) {
      setErr("Could not load the board. " + (e.message || ""));
    }
    setLoaded(true);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  function say(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  }

  /* ── gates */
  if (!authReady) return <Splash text="Loading…" />;
  if (!session) return <SignIn onSignIn={signIn} err={err} />;
  if (!loaded) return <Splash text="Loading the board…" />;

  const shell = (body) => (
    <div style={{ fontFamily: FONT, background: T.page, minHeight: "100vh", paddingBottom: 70 }}>
      {PREVIEW && (
        <div style={{
          background: "#1a1a1a", color: "#fff", fontSize: 12, textAlign: "center",
          padding: "7px 14px", letterSpacing: ".02em"
        }}>
          Preview — sample data, nothing is saved. Reload to start over.
        </div>
      )}
      {err && <Banner tone="bad" onClose={() => setErr(null)}>{err}</Banner>}
      {flash && <Banner tone="good" onClose={() => setFlash(null)}>{flash}</Banner>}
      <Header
        myName={myName} onSignOut={signOut}
        mode={mode} setMode={setMode} isAdmin={isAdmin}
      />
      {body}
    </div>
  );

  if (mode === null) return shell(
    <Chooser
      setMode={setMode}
      myName={myName}
      mine={entries.filter(e => e.host_email === myEmail)}
      myVisits={visits.filter(v => v.visitor_email === myEmail)}
      entries={entries}
    />
  );

  if (mode === "record") return shell(<RecordVisit entries={entries} visits={visits} walkins={walkins} setWalkins={setWalkins} myEmail={myEmail} myName={myName} setErr={setErr} say={say} />);

  if (mode === "admin" && isAdmin) return shell(<AdminDashboard entries={entries} visits={visits} walkins={walkins} />);

  if (mode === "open") return shell(
    <OpenFlow
      division={division} setDivision={setDivision}
      entries={entries} setEntries={setEntries} visits={visits} setVisits={setVisits}
      myEmail={myEmail} myName={myName}
      setErr={setErr} say={say} setMode={setMode}
    />
  );

  return shell(
    <VisitFlow
      division={division} setDivision={setDivision}
      entries={entries} visits={visits} setVisits={setVisits} walkins={walkins} setWalkins={setWalkins}
      myEmail={myEmail} myName={myName}
      setErr={setErr} say={say}
    />
  );
}


function RecordVisit({ entries, visits, walkins, setWalkins, myEmail, myName, setErr, say }) {
  const [date,setDate] = useState(() => { const today = new Date(); const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`; return WEEKS.some(w=>w.dates.includes(iso)) ? iso : WEEKS[0].dates[0]; });
  const [host,setHost] = useState("");
  const [classLabel,setClassLabel] = useState("");
  const [busy,setBusy] = useState(false);
  const [manualClass,setManualClass] = useState("");
  const dates = WEEKS.flatMap(w=>w.dates);
  const facultyNames = ["Marium Ahmad","Ambika Balakrishna","Kate Bark","Wendy Bekkenk","Ellie Chuah","Michael Conway","Trey Craig","Samuel Dejohn","Geoff Diegel","Li Dong","Christo du Plooy","Jeff Errington","Casey Grove","Ted Guggenheim","Kit Haines","Maddy Haines","Rebecca Jiang","Sheila Kim","Muriel King","Lawrence Kok","Wenjun Lv","Ryan Nel","Valeria Rocha","Joe Schaaf","Aileena Song","Birgit Stolte","Gareth Williams","Lily Yang","Hao Zhai","Islen Craig","Victoria Lee","Jennifer Liu","Esther Luppino","Fu Ping","Gerben Silvis","Linnea Simon","Isha Joshi","Michael Tschoepel","Durian Wang","Helen Wang","Tara (ELC)","Monique (ELC)","Clare (K)","Jo (G1)","Nadia (G1)","Chris (G2)","Billy (G3)","Michael (G4)","Celeste (G4)","Nicole (G5)","Gemma (G5)","Sara (ELA)","Stef (ELA)","Toni (IN)","Ben (PSPE)","Mariana Suarez"];
  const hosts = [...new Map([...facultyNames.map(name=>({email:"",name})), ...entries.map(e=>({email:e.host_email,name:e.host_name}))].filter(h=>h.name.toLowerCase()!==myName.toLowerCase()).map(h=>[h.name.toLowerCase(),h])).values()].sort((a,b)=>a.name.localeCompare(b.name));
  const classes = entries.filter(e=>e.date_str===date && e.host_name.toLowerCase()===host.toLowerCase());
  async function record() {
    if (!date || !host || !classLabel || (classLabel === "Other classroom visit" && !manualClass.trim()) || busy) return;
    const chosen = classes.find(e=>e.id===classLabel);
    if (chosen && (visits.some(v=>v.entry_id===chosen.id && v.visitor_email.toLowerCase()===myEmail) || walkins.some(v=>v.entry_id===chosen.id && v.visitor_email.toLowerCase()===myEmail))) {
      setErr("This visit already counts toward your total.");return;
    }
    const hostObj = hosts.find(h=>h.name.toLowerCase()===host.toLowerCase());
    setBusy(true);
    if (walkins.some(v=>v.visitor_email.toLowerCase()===myEmail && v.visit_date===date && v.host_name?.toLowerCase()===host.toLowerCase() && v.class_label===(chosen?`${chosen.subject} · ${periodLabel(chosen.division,chosen.period_key)}`:classLabel))) {setBusy(false);setErr("This visit has already been recorded.");return;}
    const row = {visitor_email:myEmail,visitor_name:myName,visit_date:date,host_email:hostObj?.email||null,host_name:hostObj?.name||host,
      class_label:chosen?`${chosen.subject} · ${periodLabel(chosen.division,chosen.period_key)}`:classLabel === "Other classroom visit" ? manualClass.trim() : classLabel,
      entry_id:chosen?.id||null};
    const {data,error}=await supabase.from("opendoors_walkins").insert(row).select().single();
    setBusy(false);
    if(error){setErr("Could not record visit. "+error.message);return;}
    setWalkins(p=>[...p,data]);setDate("");setHost("");setClassLabel("");setManualClass("");say("Walk-in visit recorded.");
  }
  return <main style={{maxWidth:760,margin:"0 auto",padding:"36px 24px"}}>
    <h2 style={{fontSize:23,margin:"0 0 8px"}}>Record a visit</h2>
    <p style={{color:T.text2,fontSize:14}}>For classroom visits without advance bookings. Booked visits count automatically.</p>
    <div style={{background:"#fff",border:`1px solid ${T.line}`,borderRadius:9,padding:22,marginTop:24}}>
      <label style={lbl}>Date visited</label>
      <select style={input} value={date} onChange={e=>{setDate(e.target.value);setClassLabel("");}}>
        <option value="">Choose a date…</option>
        {dates.map(d=><option key={d} value={d}>{fmtLong(d)}</option>)}
      </select>
      <div style={{height:14}}/>
      <label style={lbl}>Teacher visited</label>
      <select style={input} value={host} onChange={e=>{setHost(e.target.value);setClassLabel("");}}>
        <option value="">Choose a teacher…</option>
        {hosts.map(h=><option key={h.email} value={h.name}>{h.name}</option>)}
      </select>
      <div style={{height:14}}/>
      <label style={lbl}>Class visited</label>
      <select style={input} value={classLabel} onChange={e=>setClassLabel(e.target.value)} disabled={!date||!host}>
        <option value="">Choose a class…</option>
        {classes.map(e=><option key={e.id} value={e.id}>{e.subject} · {periodLabel(e.division,e.period_key)}</option>)}
        <option value="Other classroom visit">Class not listed — enter manually</option>
      </select>
      {classLabel==="Other classroom visit" && <div style={{marginTop:12}}><label style={lbl}>Class or subject visited</label><input style={input} value={manualClass} onChange={e=>setManualClass(e.target.value)} placeholder="e.g. Grade 4 Maths" /></div>}
      <button style={{...btn("big"),marginTop:16}} disabled={!date||!host||!classLabel||(classLabel==="Other classroom visit"&&!manualClass.trim())||busy} onClick={record}>{busy?"Recording…":"Record visit"}</button>

    </div>
  </main>;
}

function AdminDashboard({ entries, visits, walkins }) {
  const [division, setDivision] = useState("All School");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState("");
  const scoped = entries.filter(e => division === "All School" || e.division === division);
  const ids = new Set(scoped.map(e => e.id));
  const booked = visits.filter(v => v.status === "going" && ids.has(v.entry_id));
  const walkinVisits = walkins.filter(v => (v.entry_id ? ids.has(v.entry_id) : division === "All School" || entries.find(e=>e.host_email.toLowerCase()===v.host_email?.toLowerCase())?.division===division) && !booked.some(b => b.entry_id === v.entry_id && v.entry_id && b.visitor_email.toLowerCase() === v.visitor_email.toLowerCase()));
  const hosts = new Set(scoped.map(e => e.host_email.toLowerCase()));
  const visitors = new Set([...booked,...walkinVisits].map(v => v.visitor_email.toLowerCase()));
  const completed = [...visitors].filter(email => [...booked,...walkinVisits].filter(v => v.visitor_email.toLowerCase() === email).length >= 2).length;
  const people = new Map();
  for (const e of scoped) {
    const email = e.host_email.toLowerCase();
    if (!people.has(email)) people.set(email, { name: e.host_name, email, opened: 0, booked: 0, walkin: 0, received: 0 });
    people.get(email).opened++;
  }
  for (const v of booked) {
    const email = v.visitor_email.toLowerCase();
    if (!people.has(email)) people.set(email, { name: v.visitor_name, email, opened: 0, booked: 0, walkin: 0, received: 0 });
    people.get(email).booked++;
    const host = scoped.find(e => e.id === v.entry_id);
    if (host) people.get(host.host_email.toLowerCase()).received++;
  }
  for (const v of walkinVisits) {
    const email = v.visitor_email.toLowerCase();
    if (!people.has(email)) people.set(email, { name:v.visitor_name,email,opened:0,booked:0,walkin:0,received:0 });
    people.get(email).walkin++;
    const host = scoped.find(e => e.id === v.entry_id);
    if (host) people.get(host.host_email.toLowerCase()).received++;
  }
  const rows = [...people.values()].filter(p => (p.name + p.email).toLowerCase().includes(search.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px" }}>
    <h2 style={{ fontSize: 24, marginBottom: 8 }}>Open Doors · Admin dashboard</h2>
    <p style={{ color: T.muted, fontSize: 13 }}>Bookings count toward the two-visit target; attendance is not verified.</p>
    <div style={{ display: "flex", gap: 8, margin: "20px 0" }}>
      {["All School","Elementary","Secondary"].map(d => <button key={d} onClick={() => setDivision(d)} style={{ ...btnGhost, background: division === d ? T.red : "#fff", color: division === d ? "#fff" : T.text }}>{d}</button>)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 25 }}>
      {[["Classes open",scoped.length],["Visits credited",booked.length+walkinVisits.length],["Teachers hosting",hosts.size],["2 visits credited",completed]].map(([label,value]) =>
        <div key={label} style={{ background:"#fff",border:`1px solid ${T.line}`,borderRadius:10,padding:20,textAlign:"center" }}>
          <div style={{ fontSize:36,fontWeight:800,color:T.red }}>{value}</div><div style={{ color:T.text2,fontSize:13 }}>{label}</div>
        </div>)}
    </div>
    <input aria-label="Search teachers" placeholder="Find a teacher…" value={search} onChange={e=>setSearch(e.target.value)} style={{...input,maxWidth:340,marginBottom:16}} />
    <div style={{ overflowX:"auto",background:"#fff",border:`1px solid ${T.line}`,borderRadius:10 }}>
      <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
        <thead><tr>{["Teacher","Classes opened","Booked","Walk-in","Total","Complete","Visitors received"].map(h=><th key={h} style={{padding:14,textAlign:"left",borderBottom:`1px solid ${T.line}`}}>{h}</th>)}</tr></thead>
        <tbody>{rows.map(p=><tr key={p.email} onClick={()=>setExpanded(expanded===p.email?"":p.email)} style={{cursor:"pointer",background:expanded===p.email?T.redBg:"#fff"}}>
          <td style={{padding:13}}><strong>{p.name}</strong>{expanded===p.email && <div style={{fontSize:11,color:T.text2,marginTop:5}}>{p.email}</div>}</td>
          <td style={{padding:13}}>{p.opened}</td><td style={{padding:13}}>{p.booked}</td><td style={{padding:13}}>{p.walkin}</td><td style={{padding:13}}>{p.booked+p.walkin}</td>
          <td style={{padding:13,color:p.booked+p.walkin>=2?"#2d6b2d":T.text2,fontWeight:700}}>{p.booked+p.walkin>=2?"✓":"—"}</td>
          <td style={{padding:13}}>{p.received}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p style={{fontSize:12,color:T.muted}}>Only teachers with an open class or an active booking appear until a full staff roster is loaded.</p>
  </main>;
}

/* ═══════════════════════════════════════════════ sign-in */

function SignIn({ onSignIn, err }) {
  return (
    <div style={{
      fontFamily: FONT, background: T.page, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.line}`, borderRadius: T.radius,
        boxShadow: T.shadow, maxWidth: 380, width: "100%",
        overflow: "hidden", textAlign: "center"
      }}>
        <div style={{ padding: "22px 0 6px" }}>
          <img src="/ist-logo.png" alt="International School of Tianjin"
            style={{ width: 88, height: "auto", display: "block", margin: "0 auto" }} />
        </div>

        <div style={{
          background: T.red, color: "#fff", padding: "26px 24px 22px",
          borderBottom: `4px solid ${T.stripe}`
        }}>
          <div style={{
            fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", opacity: .85
          }}>International School of Tianjin</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: "#fff" }}>
            Open Doors
          </h2>
        </div>

        <div style={{ padding: 24 }}>
          <p style={{
            color: T.text2, fontSize: 15, fontWeight: 600,
            margin: "0 0 18px"
          }}>
            {WINDOW_LABEL}
          </p>
          <button onClick={onSignIn} style={{
            background: T.red, color: "#fff", border: "none", borderRadius: 10,
            padding: "15px 26px", fontSize: 15.5, fontWeight: 700,
            fontFamily: FONT, cursor: "pointer", width: "100%"
          }}>Sign in with Microsoft</button>
          {err && <div style={{ color: T.open, fontSize: 13, marginTop: 10 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ chrome */

function Banner({ children, tone, onClose }) {
  const bad = tone === "bad";
  return (
    <div style={{
      background: bad ? "#fdf2f1" : "#eef7ee",
      borderBottom: `1px solid ${bad ? T.redMid : "#bcd9bc"}`,
      padding: "11px 24px", textAlign: "center", fontSize: 13,
      color: bad ? T.red : "#2d6b2d",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 14
    }}>
      {children}
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "inherit", fontSize: 12, textDecoration: "underline", fontFamily: FONT
      }}>Dismiss</button>
    </div>
  );
}

function Header({ myName, onSignOut, mode, setMode, isAdmin }) {
  const tabs = [
    ["open",  "Open my classroom"],
    ["visit", "Visit a class"],
    ["record", "Record a visit"],
    ...(isAdmin ? [["admin", "Admin dashboard"]] : [])
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 20,
      background: "rgba(255,255,255,.94)", backdropFilter: "blur(8px)",
      borderTop: `10px solid ${T.red}`,
      borderBottom: `1px solid ${T.line}`,
      boxShadow: `inset 0 3px 0 0 ${T.stripe}`
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "14px 22px 0" }}>
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 14,
          justifyContent: "space-between", flexWrap: "wrap"
        }}>
          <nav style={{ display: "flex", flexWrap: "wrap" }}>
            {tabs.map(([key, label]) => {
              const on = mode === key;
              return (
                <button key={key} onClick={() => setMode(key)} style={{
                  border: "none", background: "none", padding: "10px 16px",
                  fontSize: 14, fontWeight: 700, fontFamily: FONT,
                  color: on ? T.red : T.ink, opacity: on ? 1 : .62,
                  borderBottom: `3px solid ${on ? T.red : "transparent"}`,
                  borderRadius: "8px 8px 0 0", cursor: "pointer"
                }}>{label}</button>
              );
            })}
          </nav>

          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            paddingTop: 8, paddingBottom: 8
          }}>
            <img src="/ist-logo.png" alt="" style={{ width: 28, height: "auto" }} />
            <span style={{ fontSize: 11, color: T.text2, whiteSpace: "nowrap" }}>
              Signed in as {myName}
            </span>
            <button onClick={onSignOut} style={{
              background: "none", border: "none", color: T.text2, fontSize: 11,
              cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: FONT
            }}>Log out</button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════ chooser */

function Chooser({ setMode, myName, mine, myVisits, entries }) {
  const first = myName.split(" ")[0] || myName;
  const Card = ({ title, body, cta, onClick, accent }) => (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", background: "#fff",
      border: `1px solid ${T.line}`, borderTop: `4px solid ${accent}`,
      borderRadius: T.radius, padding: "28px 26px 24px", cursor: "pointer",
      fontFamily: FONT, transition: "box-shadow .15s, transform .15s"
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,.09)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 9 }}>{title}</div>
      <div style={{ fontSize: 14, color: T.text2, lineHeight: 1.55, marginBottom: 20 }}>{body}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{cta} →</span>
    </button>
  );

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "46px 24px 0" }}>
      <div style={{ fontSize: 25, color: T.ink, marginBottom: 6 }}>
        Hello, {first}.
      </div>
      <div style={{ fontSize: 15, color: T.text2, marginBottom: 34 }}>
        Open Doors runs {WINDOW_LABEL}. What brings you here today?
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 14,
        maxWidth: 660, marginBottom: 40
      }}>
        <Card
          accent={T.red}
          title="Open my classroom"
          body="Pick the days and periods you're happy to have visitors, and say what they'll see."
          cta="Choose my slots"
          onClick={() => setMode("open")}
        />
        <Card
          accent={T.red}
          title="Visit a class"
          body="Browse what colleagues have offered, filter by subject or focus, and sign up to drop in."
          cta="Browse the board"
          onClick={() => setMode("visit")}
        />
        <Card
          accent={T.red}
          title="Record a visit"
          body="Visited a classroom without booking? Record your walk-in visit here."
          cta="Record my visit"
          onClick={() => setMode("record")}
        />
      </div>

      <div style={{ display: "flex", gap: 30, flexWrap: "wrap", fontSize: 13, color: T.muted }}>
        <span><strong style={{ color: T.ink }}>{entries.length}</strong> classes open across the school</span>
        <span><strong style={{ color: T.ink }}>{mine.length}</strong> of them yours</span>
        <span>You're signed up to visit <strong style={{ color: T.ink }}>{myVisits.length}</strong></span>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════ open flow */

const BLANK_SLOT = { subject: "", grade: "", room: "", focus: [], standards: [], note: "", manualSubject: false };

function OpenFlow({ division, setDivision, entries, setEntries, visits, setVisits, myEmail, myName, setErr, say, setMode }) {
  const [picked, setPicked] = useState({});   // "date|periodKey" -> slot data
  const [step, setStep] = useState("pick");   // pick | detail
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  const PERIODS = periodsFor(division);
  const SUBJECTS = division === "Elementary" ? SUBJECTS_ES : SUBJECTS_SEC;
  const GRADES = division === "Elementary" ? GRADES_ES : GRADES_SEC;
  const keys = Object.keys(picked);

  function normalizeScheduledGrade(raw = "") {
    const s = String(raw).trim();
    if (/^Grade\s+\d+/i.test(s)) return s.match(/^Grade\s+\d+/i)[0].replace(/^grade/i, "Grade");
    const m = s.match(/\d+/);
    return m ? `Grade ${m[0]}` : GRADES[0];
  }

  function toggle(date, pk) {
    const k = `${date}|${pk}`;
    const scheduled = division === "Secondary" ? scheduledClassFor(myName, date, pk) : null;
    if (division === "Secondary" && !scheduled) return;
    setPicked(p => {
      const n = { ...p };
      if (n[k]) delete n[k];
      else n[k] = scheduled
        ? {
            ...BLANK_SLOT,
            ...scheduled,
            grade: normalizeScheduledGrade(scheduled.grade),
            manualSubject: true,
            scheduled: true
          }
        : { ...BLANK_SLOT, grade: GRADES[0] };
      return n;
    });
  }

  function setSlot(k, patch) {
    setPicked(p => ({ ...p, [k]: { ...p[k], ...patch } }));
  }

  function switchDivision(d) {
    if (keys.length && !window.confirm("Switching divisions clears the slots you've picked. Continue?")) return;
    setPicked({}); setStep("pick"); setDivision(d);
  }

  const ready = keys.length > 0 && keys.every(k => picked[k].subject);

  async function submit() {
    setBusy(true);
    const rows = keys.map(k => {
      const [date_str, period_key] = k.split("|");
      const s = picked[k];
      return {
        division, date_str, period_key,
        host_email: myEmail, host_name: myName,
        subject: s.subject, grade: s.grade || GRADES[0],
        room: s.room.trim(),
        strategies: s.focus, standards: s.standards,
        note: s.note.trim() || null,
        attachment: null
      };
    });
    const { data, error } = await supabase.from("opendoors_entries").insert(rows).select();
    if (error) {
      setErr("Could not save. " + error.message);
    } else {
      setEntries(p => [...p, ...data]);
      say(`${rows.length} ${rows.length === 1 ? "class" : "classes"} added to the board.`);
      setPicked({}); setStep("pick"); setMode(null);
    }
    setBusy(false);
  }

  async function saveOpenClass() {
    if (!editing?.subject?.trim()) return;
    const { data, error } = await supabase.from("opendoors_entries")
      .update({ subject: editing.subject.trim(), grade: editing.grade, room: editing.room,
        strategies: editing.strategies, standards: editing.standards, note: editing.note || null })
      .eq("id", editing.id).eq("host_email", myEmail).select().single();
    if (error) { setErr("Could not update class. " + error.message); return; }
    setEntries(p => p.map(e => e.id === data.id ? data : e));
    setEditing(null);
    say("Open class updated.");
  }

  async function cancelOpenClass(entry) {
    const registered = visits.filter(v => v.entry_id === entry.id && v.status === "going");
    const msg = registered.length
      ? `Cancel this open class? ${registered.length} colleague(s) are signed up and will be notified.`
      : "Remove this open class from the board?";
    if (!window.confirm(msg)) return;
    const { error } = await supabase.from("opendoors_entries").delete()
      .eq("id", entry.id).eq("host_email", myEmail);
    if (error) { setErr("Could not remove class. " + error.message); return; }
    setEntries(p => p.filter(e => e.id !== entry.id));
    setVisits(p => p.filter(v => v.entry_id !== entry.id));
    say("Class removed from the board.");
    for (const v of registered) {
      notify({
        kind: "class_cancelled",
        host: { name: entry.host_name, email: entry.host_email },
        visitor: { name: v.visitor_name, email: v.visitor_email },
        entry: { subject: entry.subject, grade: entry.grade, room: entry.room,
          date: entry.date_str, period: periodLabel(entry.division, entry.period_key) }
      });
    }
  }

  /* already-offered slots, so the grid can show them */
  const minePerSlot = {};
  entries.forEach(e => {
    if (e.division !== division) return;
    const k = `${e.date_str}|${e.period_key}`;
    minePerSlot[k] = (minePerSlot[k] || 0) + 1;
  });
  const mineOwn = new Set(
    entries.filter(e => e.division === division && e.host_email === myEmail)
      .map(e => `${e.date_str}|${e.period_key}`)
  );

  const editModal = editing && <Modal onClose={() => setEditing(null)} width={620}>
    <h2 style={{fontSize:21,margin:"0 0 8px"}}>Edit open class</h2>
    <p style={{color:T.text2,fontSize:13}}>{fmtLong(editing.date_str)} · {periodLabel(editing.division,editing.period_key)}</p>
    {[["Subject","subject"],["Grade","grade"],["Room","room"]].map(([label,key])=><div key={key} style={{marginBottom:12}}>
      <label style={lbl}>{label}</label>
      <input style={input} value={editing[key] || ""} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}/>
    </div>)}
    <label style={lbl}>What will you be highlighting? (optional)</label>
    <FocusPicker value={editing.strategies || []} onChange={v=>setEditing(p=>({...p,strategies:v}))}/>
    <div style={{height:12}}/>
    <label style={lbl}>Standards (optional)</label>
    <StandardsPicker value={editing.standards || []} onChange={v=>setEditing(p=>({...p,standards:v}))}/>
    <div style={{height:12}}/>
    <label style={lbl}>Lesson note (optional)</label>
    <textarea style={input} rows={3} value={editing.note || ""} onChange={e=>setEditing(p=>({...p,note:e.target.value}))}/>
    <div style={{display:"flex",gap:10,justifyContent:"space-between",marginTop:20}}>
      <button style={{...btnGhost,color:T.red}} onClick={()=>{const e=editing;setEditing(null);cancelOpenClass(e);}}>Cancel opening</button>
      <div style={{display:"flex",gap:10}}><button style={btnGhost} onClick={()=>setEditing(null)}>Close</button><button style={btn("big")} onClick={saveOpenClass}>Save changes</button></div>
    </div>
  </Modal>;

  if (step === "detail") return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px 0" }}>
      <button onClick={() => setStep("pick")} style={{
        ...btnGhost, marginBottom: 22
      }}>← Back to the calendar</button>

      <h2 style={{ fontSize: 22, color: T.ink, margin: "0 0 6px", fontWeight: 700 }}>
        Tell us about {keys.length === 1 ? "this class" : `these ${keys.length} classes`}
      </h2>
      <p style={{ fontSize: 14, color: T.text2, margin: "0 0 28px", lineHeight: 1.55 }}>
        Your timetable details are filled in automatically. Check them, then add any optional focus, standards or lesson note you'd like visitors to see.
      </p>

      {keys.sort().map(k => {
        const [date, pk] = k.split("|");
        const s = picked[k];
        const { week } = locate(date);
        return (
          <div key={k} style={{
            background: "#fff", border: `1px solid ${T.line}`,
            borderLeft: `4px solid ${T.red}`, borderRadius: T.radius,
            padding: "20px 22px", marginBottom: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{fmtLong(date)}</div>
                <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>
                  {periodLabel(division, pk)} · {week?.label}
                </div>
              </div>
              <button onClick={() => toggle(date, pk)} style={{
                background: "none", border: "none", color: T.red, fontSize: 12,
                cursor: "pointer", fontFamily: FONT, textDecoration: "underline"
              }}>remove</button>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ flex: "2 1 220px" }}>
                <label style={lbl}>Subject <span style={{ color: T.red }}>*</span></label>
                {s.manualSubject ? (
                  <input
                    value={s.subject}
                    onChange={e => setSlot(k, { subject: e.target.value })}
                    placeholder="Type the class name"
                    style={input}
                    autoFocus
                  />
                ) : (
                  <select value={s.subject} onChange={e => setSlot(k, { subject: e.target.value })} style={input}>
                    <option value="">Select…</option>
                    {SUBJECTS.map(x => <option key={x}>{x}</option>)}
                  </select>
                )}
                <button
                  onClick={() => setSlot(k, { manualSubject: !s.manualSubject, subject: "" })}
                  style={{
                    background: "none", border: "none", padding: "5px 0 0", cursor: "pointer",
                    fontFamily: FONT, fontSize: 11.5, color: T.red, textDecoration: "underline"
                  }}>
                  {s.manualSubject
                    ? "Back to the list"
                    : "Don't see your class? Add it manually"}
                </button>
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={lbl}>Grade</label>
                <select value={s.grade} onChange={e => setSlot(k, { grade: e.target.value })} style={input}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div style={{ flex: "1 1 110px" }}>
                <label style={lbl}>Room</label>
                <input value={s.room} onChange={e => setSlot(k, { room: e.target.value })}
                  placeholder="D204" style={input} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>
                What will you be highlighting?
                <span style={{ color: T.muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  {"  "}(any that apply)
                </span>
              </label>
              <FocusPicker
                value={s.focus}
                onChange={f => setSlot(k, { focus: f })}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>
                Standards you're working on
                <span style={{ color: T.muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  {"  "}(optional — IST Teaching Standards)
                </span>
              </label>
              <StandardsPicker
                value={s.standards}
                onChange={v => setSlot(k, { standards: v })}
              />
            </div>

            <div>
              <label style={lbl}>
                What's happening in this particular lesson?
                <span style={{ color: T.muted, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  {"  "}(optional)
                </span>
              </label>
              <textarea
                value={s.note}
                onChange={e => setSlot(k, { note: e.target.value })}
                rows={2}
                placeholder="e.g. Students are drafting their personal narratives and conferring in pairs."
                style={{ ...input, resize: "vertical", lineHeight: 1.5 }}
              />
            </div>
          </div>
        );
      })}

      <div style={{
        display: "flex", gap: 12, justifyContent: "flex-end",
        padding: "10px 0 40px", alignItems: "center", flexWrap: "wrap"
      }}>
        {!ready && (
          <span style={{ fontSize: 12.5, color: T.muted, marginRight: "auto" }}>
            Every class needs a subject before you can post.
          </span>
        )}
        <button onClick={() => setStep("pick")} style={btnGhost}>Back</button>
        <button onClick={submit} disabled={!ready || busy}
          style={{ ...btn("big"), background: ready ? T.red : "#c8c4bf", cursor: ready ? "pointer" : "not-allowed" }}>
          {busy ? "Posting…" : `Post ${keys.length} ${keys.length === 1 ? "class" : "classes"}`}
        </button>
      </div>
    </main>
  );

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 0" }}>
      <h2 style={{ fontSize: 22, color: T.ink, margin: "0 0 6px", fontWeight: 700 }}>
        Which classes are you opening?
      </h2>
      <p style={{ fontSize: 14, color: T.text2, margin: "0 0 22px", lineHeight: 1.55 }}>
        Your scheduled classes are shown below. Click the classes you're happy to open — free periods stay out of the way.
      </p>

      {editModal}
      <DivisionTabs division={division} onChange={switchDivision} />

      {WEEKS.map((w, i) => (
        <PickGrid
          key={i} week={w} division={division} periods={PERIODS}
          picked={picked} toggle={toggle}
          counts={minePerSlot} mineOwn={mineOwn}
          myName={myName} onManage={setEditing}
          ownEntries={entries.filter(e => e.host_email.toLowerCase() === myEmail && e.division === division)}
        />
      ))}

      <StickyBar visible={keys.length > 0}>
        <span style={{ fontSize: 14, color: T.text }}>
          <strong>{keys.length}</strong> {keys.length === 1 ? "slot" : "slots"} selected
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setPicked({})} style={btnGhost}>Clear</button>
          <button onClick={() => setStep("detail")} style={btn("big")}>Continue →</button>
        </div>
      </StickyBar>
    </main>
  );
}

function StickyBar({ visible, children }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "sticky", bottom: 0, background: "#fff",
      borderTop: `1px solid ${T.line}`, boxShadow: "0 -6px 20px rgba(0,0,0,.07)",
      padding: "14px 22px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      marginTop: 10, borderRadius: "7px 7px 0 0"
    }}>{children}</div>
  );
}

function DivisionTabs({ division, onChange }) {
  const tab = (d) => ({
    padding: "9px 22px", border: "none", cursor: "pointer", fontSize: 13.5,
    fontWeight: 700, fontFamily: FONT, borderRadius: 5,
    background: division === d ? T.ink : "transparent",
    color: division === d ? "#fff" : T.muted
  });
  return (
    <div style={{
      display: "inline-flex", gap: 4, marginBottom: 26,
      background: "#eae7e3", padding: 4, borderRadius: 7
    }}>
      <button onClick={() => onChange("Elementary")} style={tab("Elementary")}>Elementary</button>
      <button onClick={() => onChange("Secondary")} style={tab("Secondary")}>Secondary</button>
    </div>
  );
}

function PickGrid({ week, division, periods, picked, toggle, counts, mineOwn, myName, onManage, ownEntries }) {
  return (
    <div style={{ marginBottom: 38 }}>
      <WeekHeading week={week} />
      <div style={{ overflowX: "auto", borderRadius: T.radius, border: `1px solid ${T.line}`, background: "#fff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: week.dates.length * 150 }}>
          <GridHead week={week} division={division} />
          <tbody>
            {periods.map((p, pi) => (
              <tr key={p.key}>
                <PeriodCell p={p} last={pi === periods.length - 1} />
                {week.dates.map((d, i) => {
                  const k = `${d}|${p.key}`;
                  const on = !!picked[k];
                  const already = mineOwn.has(k);
                  const ownEntry = ownEntries.find(e => e.date_str === d && e.period_key === p.key);
                  const n = counts[k] || 0;
                  const scheduled = division === "Secondary" ? scheduledClassFor(myName, d, p.key) : null;
                  const available = division !== "Secondary" || !!scheduled;
                  return (
                    <td key={d}
                      onClick={() => ownEntry ? onManage({...ownEntry}) : available && !already && toggle(d, p.key)}
                      title={already ? "You've already opened this class" : scheduled ? `${scheduled.subject} · ${scheduled.grade}` : ""}
                      style={{
                        padding: 0, verticalAlign: "middle", height: 66,
                        borderBottom: pi < periods.length - 1 ? `1px solid ${T.line}` : "none",
                        borderRight: i < week.dates.length - 1 ? `1px solid ${T.line}` : "none",
                        background: on ? T.red : already ? "#e4f3e8" : available && isToday(d) ? T.today : available ? "#fff" : "#f0efed",
                        cursor: ownEntry || available && !already ? "pointer" : "default",
                        transition: "background .1s", textAlign: "center"
                      }}
                      onMouseEnter={e => { if (available && !on && !already) e.currentTarget.style.background = T.redBg; }}
                      onMouseLeave={e => {
                        if (available && !on && !already) e.currentTarget.style.background = isToday(d) ? T.today : "#fff";
                      }}>
                      {on && scheduled && (
                        <div style={{ color: "#fff", padding: "6px 8px", lineHeight: 1.25 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 800 }}>{scheduled.subject}</div>
                          <div style={{ fontSize: 10, opacity: .9, marginTop: 2 }}>{/^Grade\s/i.test(scheduled.grade || "") ? scheduled.grade : `Grade ${scheduled.grade}`}{scheduled.room ? ` · Room ${scheduled.room}` : ""} · ✓</div>
                        </div>
                      )}
                      {!on && already && (
                        <span style={{ color: "#267444", fontSize: 11, fontWeight:800 }}>Open · Manage</span>
                      )}
                      {!on && !already && scheduled && (
                        <div style={{ padding: "6px 8px", lineHeight: 1.25 }}>
                          <div style={{ color: T.ink, fontSize: 11.5, fontWeight: 800 }}>{scheduled.subject}</div>
                          <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{/^Grade\s/i.test(scheduled.grade || "") ? scheduled.grade : `Grade ${scheduled.grade}`}{scheduled.room ? ` · Room ${scheduled.room}` : ""}</div>
                        </div>
                      )}
                      {!on && !already && !scheduled && division !== "Secondary" && n > 0 && (
                        <span style={{ color: T.muted, fontSize: 10.5 }}>{n} open</span>
                      )}
                      {!on && !already && !scheduled && division !== "Secondary" && n === 0 && (
                        <span style={{ color: "#dcd8d3", fontSize: 15 }}>+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeekHeading({ week }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 13 }}>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: ".12em",
        textTransform: "uppercase", color: T.red
      }}>{week.label}</span>
      <span style={{ fontSize: 12.5, color: T.muted }}>{week.sublabel}</span>
      <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
  );
}

function GridHead({ week, division }) {
  const isES = division === "Elementary";
  return (
    <thead>
      <tr>
        <th style={{
          width: isES ? 92 : 108, padding: 11, textAlign: "center", fontSize: 10,
          color: T.muted, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
          borderBottom: `2px solid ${T.line}`, background: "#faf9f8"
        }}>{isES ? "Period" : "Block"}</th>
        {week.dates.map((d, i) => (
          <th key={d} style={{
            padding: "11px 13px", textAlign: "left",
            borderBottom: `2px solid ${isToday(d) ? T.red : T.line}`,
            background: isToday(d) ? T.today : "#faf9f8"
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: isToday(d) ? T.red : T.ink }}>
              {DAY_NAMES[i]}
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{fmtDate(d)}</div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function PeriodCell({ p, last }) {
  return (
    <td style={{
      textAlign: "center", padding: "9px 7px", background: "#faf9f8",
      borderRight: `1px solid ${T.line}`,
      borderBottom: last ? "none" : `1px solid ${T.line}`
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: T.red }}>{p.label}</div>
      {p.time && <div style={{ fontSize: 9.5, color: T.muted, marginTop: 2 }}>{p.time}</div>}
    </td>
  );
}

function FocusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (s) =>
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);

  return (
    <div style={{ border: `1.5px solid ${T.line}`, borderRadius: 5, background: "#fcfbfa" }}>
      <div style={{ padding: "9px 11px", display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        {value.length === 0 && (
          <span style={{ fontSize: 13, color: T.muted }}>Nothing selected yet</span>
        )}
        {value.map(s => (
          <span key={s} style={{
            background: T.redBg, color: T.red, border: `1px solid ${T.redMid}`,
            borderRadius: 4, fontSize: 11.5, fontWeight: 600, padding: "2px 8px",
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            {s}
            <button onClick={() => toggle(s)} style={{
              background: "none", border: "none", color: T.red, cursor: "pointer",
              fontSize: 11, padding: 0, lineHeight: 1
            }}>✕</button>
          </span>
        ))}
        <button onClick={() => setOpen(o => !o)} style={{
          marginLeft: "auto", background: "none", border: "none", color: T.red,
          fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline"
        }}>{open ? "done" : "choose"}</button>
      </div>
      {open && (
        <div style={{
          borderTop: `1px solid ${T.line}`, padding: "10px 12px",
          maxHeight: 230, overflowY: "auto"
        }}>
          <FocusGroup title="Pedagogy" items={FOCUS_PEDAGOGY} value={value} toggle={toggle} />
          <FocusGroup title="General" items={FOCUS_GENERAL} value={value} toggle={toggle} divider />
        </div>
      )}
    </div>
  );
}

/* The Teaching Standards strands. Deliberately a second, separate
   picker — a teacher may fill in one, both, or neither. */
function StandardsPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("A");
  const toggle = (s) =>
    onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);

  const current = OBSERVABLE_STANDARDS.find(s => s.code === tab);
  const countIn = (code) => value.filter(v => v[0] === code).length;

  return (
    <div style={{ border: `1.5px solid ${T.line}`, borderRadius: 5, background: "#fcfbfa" }}>
      <div style={{ padding: "9px 11px", display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
        {value.length === 0 && (
          <span style={{ fontSize: 13, color: T.muted }}>Nothing selected yet</span>
        )}
        {value.map(s => (
          <span key={s} style={{
            background: T.amberBg, color: T.amber, border: `1px solid ${T.amberLine}`,
            borderRadius: 4, fontSize: 11.5, fontWeight: 600, padding: "2px 8px",
            display: "inline-flex", alignItems: "center", gap: 6
          }}>
            {s}
            <button onClick={() => toggle(s)} style={{
              background: "none", border: "none", color: T.amber, cursor: "pointer",
              fontSize: 11, padding: 0, lineHeight: 1
            }}>✕</button>
          </span>
        ))}
        <button onClick={() => setOpen(o => !o)} style={{
          marginLeft: "auto", background: "none", border: "none", color: T.amber,
          fontSize: 12, cursor: "pointer", fontFamily: FONT, textDecoration: "underline"
        }}>{open ? "done" : "choose"}</button>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${T.line}` }}>
          <div style={{
            display: "flex", gap: 4, padding: "9px 11px 0", flexWrap: "wrap"
          }}>
            {OBSERVABLE_STANDARDS.map(s => {
              const on = s.code === tab;
              const n = countIn(s.code);
              return (
                <button key={s.code} onClick={() => setTab(s.code)} title={s.title} style={{
                  border: `1.5px solid ${on ? T.amber : T.line}`,
                  background: on ? T.amber : "#fff",
                  color: on ? "#fff" : T.text2,
                  borderRadius: 5, width: 34, height: 30, cursor: "pointer",
                  fontFamily: FONT, fontSize: 13, fontWeight: 700, position: "relative"
                }}>
                  {s.code}
                  {n > 0 && (
                    <span style={{
                      position: "absolute", top: -5, right: -5, background: T.amber,
                      color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 700,
                      minWidth: 15, height: 15, lineHeight: "15px",
                      border: "2px solid #fcfbfa"
                    }}>{n}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "10px 12px 12px", maxHeight: 230, overflowY: "auto" }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: T.amber, letterSpacing: ".1em",
              textTransform: "uppercase", marginBottom: 6
            }}>{current.code} · {current.title}</div>
            {current.strands.map(s => (
              <label key={s} style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                padding: "4px 0", cursor: "pointer"
              }}>
                <input type="checkbox" checked={value.includes(s)} onChange={() => toggle(s)}
                  style={{ accentColor: T.amber, width: 14, height: 14, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FocusGroup({ title, items, value, toggle, divider }) {
  return (
    <>
      <div style={{
        fontSize: 9, fontWeight: 700, color: T.red, letterSpacing: ".1em",
        textTransform: "uppercase", marginBottom: 5,
        ...(divider ? { marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 10 } : {})
      }}>{title}</div>
      {items.map(s => (
        <label key={s} style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "4px 0", cursor: "pointer"
        }}>
          <input type="checkbox" checked={value.includes(s)} onChange={() => toggle(s)}
            style={{ accentColor: T.red, width: 14, height: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.text }}>{s}</span>
        </label>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════ visit flow */

function VisitFlow({ division, setDivision, entries, visits, setVisits, walkins, setWalkins, myEmail, myName, setErr, say }) {
  const [q, setQ] = useState("");
  const [subjectF, setSubjectF] = useState("");
  const [gradeF, setGradeF] = useState("");
  const [focusF, setFocusF] = useState("");
  const [stdF, setStdF] = useState("");
  const [listView, setListView] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordEntry, setRecordEntry] = useState("");

  const PERIODS = periodsFor(division);
  const SUBJECTS = division === "Elementary" ? SUBJECTS_ES : SUBJECTS_SEC;
  const GRADES = division === "Elementary" ? GRADES_ES : GRADES_SEC;
  const filtering = q.trim() || subjectF || gradeF || focusF || stdF;

  useEffect(() => { if (filtering) setListView(true); }, [filtering]);
  useEffect(() => { setQ(""); setSubjectF(""); setGradeF(""); setFocusF(""); }, [division]);

  async function recordWalkin() {
    const entry = entries.find(e => e.id === recordEntry);
    if (!entry) return;
    if (entry.host_email.toLowerCase() === myEmail) { setErr("You cannot record a visit to your own class."); return; }
    if (visits.some(v => v.entry_id === entry.id && v.visitor_email.toLowerCase() === myEmail) ||
        walkins.some(v => v.entry_id === entry.id && v.visitor_email.toLowerCase() === myEmail)) {
      setErr("This class already counts toward your visits."); return;
    }
    const {data,error} = await supabase.from("opendoors_walkins").insert({
      entry_id: entry.id, visitor_email: myEmail, visitor_name: myName
    }).select().single();
    if (error) { setErr("Could not record visit. " + error.message); return; }
    setWalkins(p => [...p,data]);
    setRecording(false); setRecordEntry("");
    say("Walk-in visit recorded.");
  }

  const visitorsOf = id => visits.filter(v => v.entry_id === id);

  function match(e) {
    const s = q.trim().toLowerCase();
    const textOk = !s ||
      e.subject.toLowerCase().includes(s) ||
      e.host_name.toLowerCase().includes(s) ||
      (e.note || "").toLowerCase().includes(s) ||
      (e.strategies || []).some(x => x.toLowerCase().includes(s)) ||
      (e.standards || []).some(x => x.toLowerCase().includes(s));
    return textOk
      && (!subjectF || e.subject === subjectF)
      && (!gradeF || e.grade === gradeF)
      && (!focusF || (e.strategies || []).includes(focusF))
      && (!stdF || (stdF.length === 1
            ? (e.standards || []).some(x => x[0] === stdF)
            : (e.standards || []).includes(stdF)));
  }

  const inDivision = entries.filter(e => e.division === division);
  const hits = [];
  WEEKS.forEach(w => w.dates.forEach((d, di) => PERIODS.forEach(p => {
    inDivision
      .filter(e => e.date_str === d && e.period_key === p.key && match(e))
      .forEach(e => hits.push({ ...e, shortDay: SHORT_DAYS[di], period: p, weekLabel: w.label }));
  })));

  async function join(entry) {
    const { data, error } = await supabase.from("opendoors_visits")
      .upsert({
        entry_id: entry.id, visitor_email: myEmail, visitor_name: myName,
        status: "going", cancel_reason: null, cancel_note: null, cancelled_at: null
      }, { onConflict: "entry_id,visitor_email" })
      .select().single();
    if (error) { setErr("Could not sign up. " + error.message); return; }
    setVisits(p => [...p.filter(v => v.id !== data.id), data]);
    say(`You're signed up to visit ${entry.host_name}. A confirmation is on its way.`);
    notify({
      kind: "visit_joined",
      host: { name: entry.host_name, email: entry.host_email },
      visitor: { name: myName, email: myEmail },
      entry: {
        subject: entry.subject, grade: entry.grade, room: entry.room,
        date: entry.date_str, period: periodLabel(entry.division, entry.period_key),
        division: entry.division
      }
    });
  }

  async function cancel(entry, reason, note) {
    const mine = visits.find(v => v.entry_id === entry.id && v.visitor_email === myEmail);
    if (!mine) return;
    const { error } = await supabase.from("opendoors_visits")
      .update({ status: "cancelled", cancel_reason: reason, cancel_note: note || null, cancelled_at: new Date().toISOString() })
      .eq("id", mine.id);
    if (error) { setErr("Could not cancel. " + error.message); return; }
    setVisits(p => p.filter(v => v.id !== mine.id));
    setCancelling(null);
    say("Your visit is cancelled and the host has been told.");
    notify({
      kind: "visit_cancelled",
      host: { name: entry.host_name, email: entry.host_email },
      visitor: { name: myName, email: myEmail },
      reason, note,
      entry: {
        subject: entry.subject, grade: entry.grade, room: entry.room,
        date: entry.date_str, period: periodLabel(entry.division, entry.period_key),
        division: entry.division
      }
    });
  }

  const sel = a => ({
    border: `1.5px solid ${a ? T.red : T.line}`, borderRadius: 5,
    padding: "8px 11px", fontSize: 13, fontFamily: FONT, outline: "none",
    background: "#fcfbfa", color: a ? T.text : T.muted
  });

  return (
    <>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 24px 0" }}>
        <h2 style={{ fontSize: 22, color: T.ink, margin: "0 0 6px", fontWeight: 700 }}>
          Find a class to visit
        </h2>
        <p style={{ fontSize: 14, color: T.text2, margin: "0 0 22px", lineHeight: 1.55 }}>
          Click any class to see what's planned and sign up. You can withdraw later if something comes up.
        </p>

        <DivisionTabs division={division} onChange={setDivision} />

        <div style={{
          background: "#fff", border: `1px solid ${T.line}`, borderRadius: T.radius,
          padding: "14px 16px", marginBottom: 26
        }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search teacher, subject, notes…"
              style={{ ...input, flex: "1 1 200px", minWidth: 150, fontSize: 13,
                border: `1.5px solid ${q ? T.red : T.line}` }} />
            <select value={subjectF} onChange={e => setSubjectF(e.target.value)} style={{ ...sel(!!subjectF), flex: "0 1 200px" }}>
              <option value="">All subjects</option>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={gradeF} onChange={e => setGradeF(e.target.value)} style={{ ...sel(!!gradeF), flex: "0 1 140px" }}>
              <option value="">All grades</option>
              {GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
            <select value={focusF} onChange={e => setFocusF(e.target.value)} style={{ ...sel(!!focusF), flex: "0 1 220px" }}>
              <option value="">Anything to observe</option>
              {ALL_FOCUS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={stdF} onChange={e => setStdF(e.target.value)} style={{ ...sel(!!stdF), flex: "0 1 240px" }}>
              <option value="">Any standard</option>
              {OBSERVABLE_STANDARDS.map(st => (
                <optgroup key={st.code} label={`${st.code} · ${st.title}`}>
                  <option value={st.code}>{`All of ${st.code}`}</option>
                  {st.strands.map(x => <option key={x} value={x}>{x}</option>)}
                </optgroup>
              ))}
            </select>
            {filtering && (
              <button onClick={() => { setQ(""); setSubjectF(""); setGradeF(""); setFocusF(""); setStdF(""); }}
                style={{ ...btnGhost, borderColor: T.redMid, color: T.red, padding: "8px 14px" }}>Clear</button>
            )}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 11, flexWrap: "wrap", gap: 8
          }}>
            <span style={{ fontSize: 12.5, color: filtering ? T.red : T.muted }}>
              {filtering
                ? `${hits.length} ${hits.length === 1 ? "class" : "classes"} match`
                : `${inDivision.length} ${inDivision.length === 1 ? "class" : "classes"} open in ${division}`}
            </span>
            <div style={{ display: "flex", border: `1px solid ${T.line}`, borderRadius: 5, overflow: "hidden" }}>
              {["Calendar", "List"].map((t, i) => {
                const on = (i === 1) === listView;
                return (
                  <button key={t} onClick={() => setListView(i === 1)} style={{
                    padding: "6px 15px", border: "none", cursor: "pointer", fontSize: 12.5,
                    fontFamily: FONT, background: on ? T.red : "#faf9f8",
                    color: on ? "#fff" : T.muted,
                    borderLeft: i ? `1px solid ${T.line}` : "none"
                  }}>{t}{i === 1 && filtering && hits.length ? ` (${hits.length})` : ""}</button>
                );
              })}
            </div>
          </div>
        </div>

        {listView ? (
          <VisitList hits={hits} visitorsOf={visitorsOf} myEmail={myEmail} onOpen={setDetail} />
        ) : (
          WEEKS.map((w, i) => (
            <VisitGrid key={i} week={w} division={division} periods={PERIODS}
              entries={inDivision} match={match} filtering={!!filtering}
              visitorsOf={visitorsOf} myEmail={myEmail} onOpen={setDetail} />
          ))
        )}
      </main>

      {detail && (
        <DetailModal
          entry={detail} onClose={() => setDetail(null)}
          visitors={visitorsOf(detail.id)} myEmail={myEmail}
          onJoin={() => join(detail)}
          onCancel={() => setCancelling(detail)}
        />
      )}

      {cancelling && (
        <CancelModal
          entry={cancelling}
          onClose={() => setCancelling(null)}
          onConfirm={(reason, note) => cancel(cancelling, reason, note)}
        />
      )}
    </>
  );
}

function VisitGrid({ week, division, periods, entries, match, filtering, visitorsOf, myEmail, onOpen }) {
  return (
    <div style={{ marginBottom: 38 }}>
      <WeekHeading week={week} />
      <div style={{ overflowX: "auto", borderRadius: T.radius, border: `1px solid ${T.line}`, background: "#fff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: week.dates.length * 160 }}>
          <GridHead week={week} division={division} />
          <tbody>
            {periods.map((p, pi) => (
              <tr key={p.key}>
                <PeriodCell p={p} last={pi === periods.length - 1} />
                {week.dates.map((d, i) => {
                  const cell = entries.filter(e => e.date_str === d && e.period_key === p.key);
                  return (
                    <td key={d} style={{
                      verticalAlign: "top", padding: "8px 9px",
                      borderBottom: pi < periods.length - 1 ? `1px solid ${T.line}` : "none",
                      borderRight: i < week.dates.length - 1 ? `1px solid ${T.line}` : "none",
                      background: isToday(d) ? T.today : "#fff"
                    }}>
                      {cell.length === 0 && (
                        <div style={{ fontSize: 11, color: "#e0dcd7", textAlign: "center", paddingTop: 10 }}>—</div>
                      )}
                      {cell.map(e => (
                        <ClassChip key={e.id} e={e} dim={filtering && !match(e)}
                          n={visitorsOf(e.id).length}
                          mine={visitorsOf(e.id).some(v => v.visitor_email === myEmail)}
                          onOpen={onOpen} />
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Same reading as the Cover Board: clay means it still needs people,
   green means someone's coming. */
function ClassChip({ e, dim, n, mine, onOpen }) {
  const taken = n > 0 || mine;
  const bg   = taken ? T.fullBg   : T.openBg;
  const line = taken ? T.fullLine : T.openLine;
  const ink  = taken ? T.fullInk  : T.openInk;
  const pill = taken ? T.full     : T.open;
  const tags = e.strategies || [];
  const strands = e.standards || [];

  return (
    <div onClick={() => onOpen(e)} style={{
      background: bg, color: ink, border: `1px solid ${line}`,
      borderRadius: 9, padding: "7px 9px",
      marginBottom: 5, fontSize: 11.5, cursor: "pointer",
      opacity: dim ? 0.4 : 1, transition: "opacity .15s", lineHeight: 1.4
    }}>
      <strong style={{ display: "block", fontSize: 12.5 }}>{e.host_name}</strong>
      <span style={{ opacity: .85, fontSize: 10.5 }}>{e.subject} · {e.grade}</span>
      {e.room && <span style={{ opacity: .7, fontSize: 10.5, display: "block" }}>Room {e.room}</span>}
      <span style={{
        display: "inline-block", marginTop: 4, background: pill, color: "#fff",
        borderRadius: 999, fontSize: 9.5, padding: "1.5px 7px", fontWeight: 700
      }}>
        {mine ? "you're going" : n > 0 ? `${n} visiting` : "no one yet"}
      </span>
      {tags.length > 0 && (
        <span style={{ display: "block", marginTop: 4 }}>
          {tags.slice(0, 5).map((t, i) => (
            <span key={i} style={{
              display: "inline-block", background: "rgba(255,255,255,.65)",
              border: `1px solid ${line}`,
              borderRadius: 999, fontSize: 9.5, padding: "1px 6px", marginRight: 3, marginBottom: 2
            }}>{t}</span>
          ))}
          {tags.length > 5 && (
            <span style={{ fontSize: 9.5, opacity: .75 }}>+{tags.length - 5}</span>
          )}
        </span>
      )}
      {strands.length > 0 && (
        <span style={{ display: "block", marginTop: 3 }}>
          {strands.map(x => x.split(" ")[0]).map(code => (
            <span key={code} style={{
              display: "inline-block", background: T.amberBg, color: T.amber,
              border: `1px solid ${T.amberLine}`, borderRadius: 3, fontSize: 9,
              fontWeight: 700, padding: "0 4px", marginRight: 3
            }}>{code}</span>
          ))}
        </span>
      )}
    </div>
  );
}

function VisitList({ hits, visitorsOf, myEmail, onOpen }) {
  if (hits.length === 0) return (
    <div style={{
      background: "#fff", border: `1px solid ${T.line}`, borderRadius: T.radius,
      padding: "40px 24px", textAlign: "center", color: T.muted, fontSize: 14.5, marginBottom: 40
    }}>Nothing matches those filters yet.</div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 40 }}>
      {hits.map(it => {
        const vs = visitorsOf(it.id);
        const mine = vs.some(v => v.visitor_email === myEmail);
        const tags = it.strategies || [];
        return (
          <div key={it.id} onClick={() => onOpen(it)} style={{
            background: "#fff", border: `1px solid ${T.line}`,
            borderLeft: `4px solid ${colorFor(it.host_name)}`, borderRadius: 6,
            padding: "14px 18px", display: "flex", gap: 18, cursor: "pointer"
          }}
            onMouseEnter={e => e.currentTarget.style.background = T.redBg}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0, textAlign: "center", minWidth: 88 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.red, textTransform: "uppercase" }}>{it.shortDay}</div>
              <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{fmtDate(it.date_str)}</div>
              <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>
                {periodLabel(it.division, it.period_key)}
              </div>
              <div style={{ fontSize: 10.5, color: T.red, fontWeight: 600 }}>{it.weekLabel}</div>
            </div>
            <div style={{ width: 1, background: T.line, alignSelf: "stretch" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15.5, fontWeight: 700, color: T.ink }}>{it.host_name}</span>
                <span style={{ fontSize: 13.5, color: T.red }}>{it.subject}</span>
                <span style={{ fontSize: 12.5, color: T.muted }}>{it.grade}</span>
                {it.room && <span style={{ fontSize: 12.5, color: T.muted }}>· Room {it.room}</span>}
                {mine ? (
                  <span style={{
                    fontSize: 11, color: "#fff", background: "#2d6b2d",
                    borderRadius: 10, padding: "1px 9px", fontWeight: 700
                  }}>you're going</span>
                ) : vs.length > 0 && (
                  <span style={{
                    fontSize: 11, color: "#fff", background: T.red,
                    borderRadius: 10, padding: "1px 9px", fontWeight: 700
                  }}>{vs.length} visiting</span>
                )}
              </div>
              {it.note && (
                <div style={{ fontSize: 13, color: T.text2, marginTop: 6, lineHeight: 1.5 }}>{it.note}</div>
              )}
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {tags.map(t => (
                    <span key={t} style={{
                      background: T.redBg, color: T.red, border: `1px solid ${T.redMid}`,
                      borderRadius: 4, fontSize: 10.5, fontWeight: 600, padding: "1px 8px"
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailModal({ entry, onClose, visitors, myEmail, onJoin, onCancel }) {
  const mine = visitors.some(v => v.visitor_email === myEmail);
  const isHost = entry.host_email === myEmail;
  const tags = entry.strategies || [];
  const strands = entry.standards || [];
  return (
    <Modal onClose={onClose} width={480}>
      <div style={{ height: 5, borderRadius: 3, background: colorFor(entry.host_name), marginBottom: 20 }} />
      <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 3 }}>{entry.host_name}</div>
      <div style={{ fontSize: 15, color: T.red, marginBottom: 4 }}>{entry.subject}</div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 22 }}>
        {fmtLong(entry.date_str)} · {periodLabel(entry.division, entry.period_key)}
      </div>

      <div style={{ display: "flex", gap: 26, marginBottom: 18, flexWrap: "wrap" }}>
        {[["Grade", entry.grade], ["Room", entry.room || "—"]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 14, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      {entry.note && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
            What's happening
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: T.text2 }}>{entry.note}</div>
        </div>
      )}

      {tags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 7 }}>
            What to watch for
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tags.map(s => (
              <span key={s} style={{
                background: T.redBg, color: T.red, border: `1px solid ${T.redMid}`,
                borderRadius: 4, fontSize: 11.5, fontWeight: 600, padding: "3px 9px"
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {strands.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 7 }}>
            Standards in play
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {strands.map(s => (
              <span key={s} style={{
                background: T.amberBg, color: T.amber, border: `1px solid ${T.amberLine}`,
                borderRadius: 4, fontSize: 11.5, fontWeight: 600, padding: "3px 9px"
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.red, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 9 }}>
          Who's visiting
        </div>
        {visitors.length === 0 && (
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Nobody yet — be the first.</div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {visitors.map(v => (
            <span key={v.id} style={{
              background: v.visitor_email === myEmail ? "#2d6b2d" : T.ink,
              color: "#fff", borderRadius: 12, fontSize: 11.5, padding: "3px 11px"
            }}>{v.visitor_name}{v.visitor_email === myEmail ? " (you)" : ""}</span>
          ))}
        </div>

        {isHost ? (
          <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>This is your class.</div>
        ) : mine ? (
          <button onClick={onCancel} style={{
            width: "100%", padding: "11px", borderRadius: 5,
            border: `1.5px solid ${T.redMid}`, background: "transparent",
            color: T.red, cursor: "pointer", fontSize: 13.5, fontFamily: FONT
          }}>You're signed up — withdraw</button>
        ) : (
          <button onClick={onJoin} style={{ ...btn("big"), width: "100%" }}>
            I'll visit this class
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <button onClick={onClose} style={btnGhost}>Close</button>
      </div>
    </Modal>
  );
}

function CancelModal({ entry, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal onClose={onClose} width={440}>
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Withdraw from this visit</div>
      <div style={{ fontSize: 13.5, color: T.text2, marginBottom: 22, lineHeight: 1.55 }}>
        {entry.host_name} will be told so they're not expecting you. A short reason is kind but not required.
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Reason</label>
        <select value={reason} onChange={e => setReason(e.target.value)} style={input}>
          <option value="">Prefer not to say</option>
          {CANCEL_REASONS.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={lbl}>Anything to add?</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          placeholder="Optional — a line for the host."
          style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={btnGhost}>Never mind</button>
        <button onClick={() => onConfirm(reason, note)} style={btn("big")}>Withdraw</button>
      </div>
    </Modal>
  );
}
