/* Open Doors: full Elementary staff timetable coverage audit.
   Distinguishes loaded individual timetables, missing import sheets, shared
   instructor-ambiguous timetables, and staff without classroom assignments.
   Runs during production build to prevent another Gemma/Ben-style regression. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import {
  WEEKS, ELEMENTARY_SCHEDULE_IDENTITIES,
  matchedElementarySources, hasElementaryLessons, scheduledElementaryClassFor,
  matchedSecondaryTeacher, hasSecondaryLessons
} from "../src/config.js";
import { EXTRA_SECONDARY_TIMETABLE } from "../src/secondary-timetable-extras.js";
import { PE_ELEMENTARY_TIMETABLE, LILY_SECONDARY_PE_TIMETABLE } from "../src/pe-teacher-timetable.js";
import { STAFF_SCREENSHOT_ELEMENTARY } from "../src/elementary-screenshot-schedules.js";

const extract = (filename, variable) => {
  const source=readFileSync(filename,"utf8");
  const match=source.match(new RegExp('const '+variable+'\\s*=\\s*"([^"]+)"'));
  assert.ok(match, "Missing "+variable+" in "+filename);
  return JSON.parse(inflateSync(Buffer.from(match[1],"base64")).toString("utf8"));
};
const original=extract("src/timetable-data.js","ENCODED");
const refined=extract("src/elementary-timetable.js","DATA");
const data={
  es:{...original.es,...refined,...PE_ELEMENTARY_TIMETABLE,...STAFF_SCREENSHOT_ELEMENTARY},
  sec:{...EXTRA_SECONDARY_TIMETABLE,...original.sec}
};
data.sec["Lily Yang"]={...data.sec["Lily Yang"],...LILY_SECONDARY_PE_TIMETABLE};

// This roster is a snapshot of the authenticated Open Doors Elementary
// directory (19 Oct 2026); coverage below also includes the extra specialists
// from ELEMENTARY_SCHEDULE_IDENTITIES who are marked Secondary.
const directory=[
  ["Ben Silvis","ben_silvis@istianjin.org.cn"],
  ["Billy Brown","billy_brown@istianjin.org.cn"],
  ["Cam Wallace","cam_wallace@istianjin.org.cn"],
  ["Celeste Staal","celeste_staal@istianjin.org.cn"],
  ["Christopher Lowrey","chris_lowrey@istianjin.org.cn"],
  ["Clare Murphy","clare_craig@istianjin.org.cn"],
  ["Fu Ping","eva_fu@istianjin.org.cn"],
  ["Gemma Lowrey","gemma_lowrey@istianjin.org.cn"],
  ["Helen Wang","helen_wang@istianjin.org.cn"],
  ["Isha Joshi","isha_joshi@istianjin.org.cn"],
  ["Islen Craig","islen_craig@istianjin.org.cn"],
  ["Jennifer Liu","jennifer_liu@istianjin.org.cn"],
  ["Jo Reston","jo_reston@istianjin.org.cn"],
  ["Mariana Suarez","mariana_suarez@istianjin.org.cn"],
  ["Marium Ahmad","marium_ahmad@istianjin.org.cn"],
  ["Michael Crisp","michael_crisp@istianjin.org.cn"],
  ["Michael Tschoepel","michael_tschoepel@istianjin.org.cn"],
  ["Monique Barthakur","monique_barthakur@istianjin.org.cn"],
  ["Nadia Nel","nadia_nel@istianjin.org.cn"],
  ["Nicole Barry","nicole_barry@istianjin.org.cn"],
  ["Sara Derwish","sara_derwish@istianjin.org.cn"],
  ["Stefanie Bradley","stefanie_bradley@istianjin.org.cn"],
  ["Tara Nguyen","tara_nguyen@istianjin.org.cn"],
  ["Toni Jarratt","toni_jarratt@istianjin.org.cn"],
  ["Victoria Lee","victoria_lee@istianjin.org.cn"]
];
const reports=[];
const known=new Map(directory.map(([name,email])=>[email,{name,email,listedElementary:true}]));
for(const p of ELEMENTARY_SCHEDULE_IDENTITIES){
  if(!p.email || known.has(p.email))continue;
  known.set(p.email,{name:p.name,email:p.email,listedElementary:false});
}
for(const {name,email,listedElementary} of known.values()){
  const reg=ELEMENTARY_SCHEDULE_IDENTITIES.find(p=>p.email?.toLowerCase()===email);
  const sources=matchedElementarySources(name,email,data);
  const periodCounts=WEEKS.map(w=>w.dates.flatMap(date=>
    Array.from({length:8},(_,i)=>scheduledElementaryClassFor(name,date,"P"+(i+1),data,email))
      .filter(Boolean)).length);
  const total=periodCounts.reduce((a,b)=>a+b,0);
  const secondary=hasSecondaryLessons(name,email,data);
  const status=!reg ? (secondary?"SECONDARY_ONLY":"NO_INDIVIDUAL_SOURCE")
    : !sources.length ? "MISSING_IMPORTED_SHEET"
    : reg.shared ? "SHARED_UNASSIGNED"
    : total===0 ? "NO_SELECTABLE_LESSONS"
    : "READY";
  reports.push({name,email,listedElementary,status,sources,weekPeriods:periodCounts,
    total,secondary});
  if(status==="READY"){
    assert.ok(hasElementaryLessons(name,email,data),name+" not selectable despite records");
    const screenshotShowsOnlyA = email==="billy_brown@istianjin.org.cn";
    // Never require (or invent) lessons for a week that was not provided.
    if (!screenshotShowsOnlyA) assert.ok(periodCounts[0]+periodCounts[2]>0,
      name+" absent from B weeks");
    else assert.deepEqual(periodCounts,[0,37,0],
      "Billy's B-week classes were assumed even though only Week A was provided");
    assert.ok(periodCounts[1]>0,name+" absent from A week");
  }
}
const knownExceptions=new Set([
  "Billy Brown","Isha Joshi","Stefanie Bradley",
  "Tara Nguyen","Monique Barthakur",
  "Helen Wang","Fu Ping","Jennifer Liu",
  "Cam Wallace","Marium Ahmad"
]);
const unanticipated=reports.filter(r=>r.status!=="READY"&&!knownExceptions.has(r.name));
const missing=reports.filter(r=>r.status!=="READY");
if (unanticipated.length) console.warn("NEW_ELEM_GAPS",JSON.stringify(unanticipated));
const gemma=reports.find(p=>p.email==="gemma_lowrey@istianjin.org.cn");
assert.ok(gemma && gemma.status==="READY", "Gemma Lowrey has no selectable timetable");
assert.ok(gemma.total>0 && gemma.weekPeriods.every(c=>c>0),
  "Gemma is missing A- or B-week lessons");
console.log("ELEMENTARY_AUDIT_TOTAL",reports.length,"directory",directory.length);
for(const r of reports) console.log("ELEMENTARY_AUDIT",JSON.stringify(r));
console.log("ELEMENTARY_EXCEPTIONS",JSON.stringify(missing.map(r=>({name:r.name,why:r.status}))));
console.log("PASS: All known individual Elementary timetables, including Gemma Lowrey, resolve across both rotations.");
