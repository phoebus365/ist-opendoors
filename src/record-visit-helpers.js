/* Shared Record a Visit teacher and class resolution.
   Staff-directory identities take precedence over workbook sheet names.
   Multiple divisions for one teacher remain separate visit options. */
import {
  ELEMENTARY_SCHEDULE_IDENTITIES, matchedSecondaryTeacher,
  matchedElementarySources, periodsFor, periodLabel,
  scheduledClassFor, scheduledElementaryClassFor
} from "./config.js";

const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const lower = value => String(value || "").trim().toLowerCase();

export function recordVisitHosts(directory = [], entries = [], timetables = {}, visitorEmail = "", visitorName = "") {
  const hosts = new Map();
  function add(name, email, division, priority = 1) {
    const n = String(name || "").trim(), mail = lower(email);
    if (!n || !["Elementary","Secondary"].includes(division)) return;
    if ((mail && mail === lower(visitorEmail)) ||
        (!mail && normalize(n) === normalize(visitorName))) return;
    const id = mail ? `email:${mail}:${division}` : `name:${normalize(n)}:${division}`;
    if (!hosts.has(id) || hosts.get(id).priority < priority) {
      hosts.set(id, { id, name:n, email:mail, division, priority });
    }
  }
  for (const staff of directory) add(staff.name, staff.email, staff.division, 4);
  for (const entry of entries) add(entry.host_name, entry.host_email, entry.division, 3);

  for (const source of Object.keys(timetables.sec || {})) {
    const staff = directory.find(person =>
      matchedSecondaryTeacher(person.name,person.email,timetables) === source);
    add(staff?.name || source, staff?.email || "", "Secondary", 2);
  }
  for (const source of Object.keys(timetables.es || {})) {
    // Preserve shared ELC sheets as individual staff choices, never as a
    // fictitious teacher named after the combined workbook sheet.
    const matches = directory.filter(person =>
      matchedElementarySources(person.name,person.email,timetables).includes(source));
    if (matches.length) {
      for (const person of matches) add(person.name,person.email,"Elementary",2);
    } else {
      const mapped = ELEMENTARY_SCHEDULE_IDENTITIES.filter(p =>
        (p.sheets || []).includes(source));
      if (mapped.length) {
        for(const person of mapped) add(person.name,person.email,"Elementary",2);
      } else add(source.replace(/-/g," · "),"","Elementary",1);
    }
  }
  return [...hosts.values()].sort((a,b)=>
    a.name.localeCompare(b.name) || a.division.localeCompare(b.division));
}

export function recordVisitClassOptions(host, isoDate, entries = [], timetables = {}) {
  if(!host || !isoDate) return {options:[],opened:[]};
  const opened = entries.filter(e =>
    String(e.date_str || "") === isoDate &&
    e.division === host.division &&
    ((host.email && lower(e.host_email) === host.email) ||
      normalize(e.host_name) === normalize(host.name)));
  const options = opened.map(e => ({
    id:"o:"+e.id,
    label:`${e.subject} · ${periodLabel(e.division,e.period_key)} (opened)`,
    entryId:e.id,
    periodKey:e.period_key
  }));
  const taken = new Set(opened.map(e=>e.period_key));
  for (const p of periodsFor(host.division)) {
    if (taken.has(p.key)) continue;
    const lesson = host.division === "Elementary"
      ? scheduledElementaryClassFor(host.name,isoDate,p.key,timetables,host.email)
      : scheduledClassFor(host.name,isoDate,p.key,timetables,host.email);
    if(!lesson) continue;
    const grade=lesson.grade ? " · "+lesson.grade : "";
    const room=lesson.room ? " · Room "+lesson.room : "";
    options.push({
      id:"t:"+p.key,
      label:`${lesson.subject}${grade}${room} · ${periodLabel(host.division,p.key)}`,
      entryId:null,
      periodKey:p.key
    });
  }
  return {options,opened};
}
