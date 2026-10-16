/* PE timetable source-of-truth regression tests: 16 October 2026 screenshot.
   Prevent old imports from making the wrong classes appear to be verified. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import {
  WEEKS, matchedElementarySources, hasElementaryLessons,
  scheduledElementaryClassFor, scheduledClassFor
} from "../src/config.js";
import { PE_ELEMENTARY_TIMETABLE, LILY_SECONDARY_PE_TIMETABLE } from "../src/pe-teacher-timetable.js";

const extract = (path,key) => {
  const code=readFileSync(path,"utf8");
  const match=code.match(new RegExp('const '+key+'\\s*=\\s*"([^"]+)"'));
  assert.ok(match, "Missing timetable payload "+path);
  return JSON.parse(inflateSync(Buffer.from(match[1],"base64")).toString("utf8"));
};
const base=extract("src/timetable-data.js","ENCODED");
const refined=extract("src/elementary-timetable.js","DATA");
const lilyBase=base.sec["Lily Yang"] || {};
const otherLily=Object.fromEntries(Object.entries(lilyBase).filter(
  ([,record])=>!/\\b(phys(?:ical)?\\s*ed|pe)\\b/i.test(String(record?.[0]||""))
));
const data={
  es:{...base.es,...refined,...PE_ELEMENTARY_TIMETABLE},
  sec:{...base.sec,"Lily Yang":{...otherLily,...LILY_SECONDARY_PE_TIMETABLE}}
};
const ben="Ben Silvis",benEmail="ben_silvis@istianjin.org.cn";
assert.deepEqual(matchedElementarySources(ben,benEmail,data),["Ben-PSPE"]);
assert.ok(hasElementaryLessons(ben,benEmail,data));
const pe=(name,email,day,period)=>
  scheduledElementaryClassFor(name,day,period,data,email)?.subject;
const checks=[
 [ben,benEmail,"2026-10-26","P3","PE: G1:SMAC"], // Day 1, NOT 2L
 [ben,benEmail,"2026-10-26","P4","PE: 3B"],
 [ben,benEmail,"2026-10-26","P5","PE: 2L:SMAC"],
 [ben,benEmail,"2026-10-26","P6","PE: KM:SMAC"],
 [ben,benEmail,"2026-10-26","P8","PE: 5L"],
 [ben,benEmail,"2026-10-27","P1","PE: 3B FIT"],
 [ben,benEmail,"2026-10-27","P6","PE: 4C SMAC"],
 [ben,benEmail,"2026-10-28","P3","PE: 5L"],
 [ben,benEmail,"2026-10-28","P5","PE: 2L:QIN"],
 [ben,benEmail,"2026-10-28","P7","PE: 11/12"],
 [ben,benEmail,"2026-10-29","P3","PE: G1:SMAC"],
 [ben,benEmail,"2026-10-29","P5","PE: KM:SMAC"],
 [ben,benEmail,"2026-10-19","P3","PE: G1:SMAC"], // Day 6
 ["Durian","", "2026-10-26","P3","PE: G1:SMAC"], // Shared DW+GS
 ["Durian","", "2026-10-26","P4","PE: ELC"],
 ["Durian","", "2026-10-27","P1","PE: 3B FIT"],
 ["Wendy Bekkenk","wendy_bekkenk@istianjin.org.cn",
   "2026-10-26","P7","PE: 5B"],
 ["Wendy Bekkenk","wendy_bekkenk@istianjin.org.cn",
   "2026-10-28","P3","PE: 5B"]
];
for(const [name,email,day,p,label] of checks)
  assert.equal(pe(name,email,day,p),label,`Wrong class: ${name} ${day} ${p}`);
const count=WEEKS.flatMap(w=>w.dates.flatMap(day=>
  Array.from({length:8},(_,i)=>pe(ben,benEmail,day,"P"+(i+1))).filter(Boolean)
)).length;
assert.equal(count,54,"Ben should have exactly 54 selectable PE period cells over three weeks");
assert.equal(pe(ben,benEmail,"2026-10-30","P3"),undefined,
  "Ben has no Friday lessons on Day 5");
// Lily's Grade 6-10 lessons are Secondary and must use their actual PE venues.
const lily=scheduledClassFor("Lily Yang","2026-10-26","B34",data,
  "lily_yang@istianjin.org.cn");
assert.deepEqual(lily,{subject:"MYP Phys Ed",grade:"7C",room:"QIN"});
const lilyB=scheduledClassFor("Lily Yang","2026-10-19","B34",data,
  "lily_yang@istianjin.org.cn");
assert.deepEqual(lilyB,{subject:"MYP Phys Ed",grade:"8B",room:"QIN"});
assert.ok(Object.values(data.sec["Wendy Bekkenk"]||{}).some(r=>
  /humanities/i.test(String(r?.[0]))),
  "Wendy's Secondary Humanities classes must be preserved");
console.log("PASS: PE master timetable matches screenshot; Ben has "+count+
  " visible periods, DW+GS joint lessons align, Wendy Humanities retained and Lily Secondary PE checked.");
