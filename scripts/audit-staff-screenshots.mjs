/* Every supplied Elementary screenshot must resolve through the same
   teacher-facing lookup used by "Open my classroom".
   Screenshots: Isha Joshi, Stefanie Bradley, Billy Brown, Sara Derwish,
   and the shared Tara/Monique ELC programme (19 October 2026).
   The tests deliberately distinguish unverified weeks from actual classes. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import {
  WEEKS, GRADES_ES, matchedElementarySources, hasElementaryLessons,
  scheduledElementaryClassFor, isUnverifiedElementaryWeek
} from "../src/config.js";
import { STAFF_SCREENSHOT_ELEMENTARY, PARTIAL_ELEMENTARY_SCHEDULES }
  from "../src/elementary-screenshot-schedules.js";
import { PE_ELEMENTARY_TIMETABLE } from "../src/pe-teacher-timetable.js";

const readEmbedded=(filename,key)=>{
  const s=readFileSync(filename,"utf8");
  const m=s.match(new RegExp('const '+key+'\\s*=\\s*"([^"]+)"'));
  assert.ok(m, "Missing source payload "+key);
  return JSON.parse(inflateSync(Buffer.from(m[1],"base64")).toString("utf8"));
};
const primary=readEmbedded("src/timetable-data.js","ENCODED");
const refined=readEmbedded("src/elementary-timetable.js","DATA");
const loader=readFileSync("src/timetable-data.js","utf8");
assert.ok(loader.includes("...PE_ELEMENTARY_TIMETABLE, ...STAFF_SCREENSHOT_ELEMENTARY"),
  "Screenshot schedules must override older incomplete files in the real application.");
const data={es:{...primary.es,...refined,...PE_ELEMENTARY_TIMETABLE,
  ...STAFF_SCREENSHOT_ELEMENTARY}};
const row=(name,email,iso,p)=>{
  return scheduledElementaryClassFor(name,iso,p,data,email);
};
const expected=[
 ["Billy Brown","billy_brown@istianjin.org.cn","Billy-G3"],
 ["Isha Joshi","isha_joshi@istianjin.org.cn","Isha-Art"],
 ["Stefanie Bradley","stefanie_bradley@istianjin.org.cn","Stef-ELA"],
 ["Sara Derwish","sara_derwish@istianjin.org.cn","Sara-ELA"],
 ["Tara Nguyen","tara_nguyen@istianjin.org.cn","Tara & Monique-ELC"],
 ["Monique Barthakur","monique_barthakur@istianjin.org.cn","Tara & Monique-ELC"]
];
for(const [name,email,source] of expected){
  assert.deepEqual(matchedElementarySources(name,email,data),[source],
    "Failed to map "+email+" to "+source);
  assert.ok(hasElementaryLessons(name,email,data),
    name+" cannot see an Elementary timetable despite imported screenshot");
}
assert.ok(GRADES_ES.includes("Grade 6"),
  "Isha's scheduled Grade 6 classes must be assignable in the form");
// Billy supplied A week ONLY
assert.match(row("Billy Brown","billy_brown@istianjin.org.cn",
  "2026-10-26","P1")?.subject||"", /Maths.*Mariana/);
assert.equal(row("Billy Brown","billy_brown@istianjin.org.cn",
  "2026-10-19","P1"),null, "Do not fabricate Billy's B-week timetable");
assert.equal(isUnverifiedElementaryWeek("billy_brown@istianjin.org.cn","2026-10-19"),true);
assert.equal(isUnverifiedElementaryWeek("billy_brown@istianjin.org.cn","2026-10-26"),false);
assert.deepEqual(PARTIAL_ELEMENTARY_SCHEDULES["billy_brown@istianjin.org.cn"],["B"]);
// Isha's Grade 6 classes switch from 6H to 6A on Wednesday and Monday
const isha="isha_joshi@istianjin.org.cn";
assert.match(row("Isha Joshi",isha,"2026-10-26","P3")?.subject||"",/6H/);
assert.equal(row("Isha Joshi",isha,"2026-10-19","P3"),null);
assert.match(row("Isha Joshi",isha,"2026-10-19","P7")?.subject||"",/6A/);
assert.match(row("Isha Joshi",isha,"2026-10-28","P1")?.subject||"",/6H/);
assert.match(row("Isha Joshi",isha,"2026-10-21","P1")?.subject||"",/6A/);
assert.equal(row("Isha Joshi",isha,"2026-10-28","P1")?.grade,"6");
// Stefanie's G4/G5 literacy and vertical block spans
const stef="stefanie_bradley@istianjin.org.cn";
assert.match(row("Stefanie Bradley",stef,"2026-10-19","P2")?.subject||"",/G5 Writing/);
assert.match(row("Stefanie Bradley",stef,"2026-10-26","P8")?.subject||"",/G4 Writing/);
assert.match(row("Stefanie Bradley",stef,"2026-10-30","P7")?.subject||"",/G4 UOI/);
assert.match(row("Stefanie Bradley",stef,"2026-10-30","P8")?.subject||"",/G4 UOI/);
assert.equal(row("Stefanie Bradley",stef,"2026-10-27","P5"),null);
// Sara's A/B exceptions must not be duplicated
const sara="sara_derwish@istianjin.org.cn";
assert.match(row("Sara Derwish",sara,"2026-10-20","P5")?.subject||"",/Grade 3 Reading/);
assert.equal(row("Sara Derwish",sara,"2026-10-27","P5"),null);
assert.match(row("Sara Derwish",sara,"2026-10-30","P2")?.subject||"",/Grade 3 Reading/);
assert.equal(row("Sara Derwish",sara,"2026-10-23","P2"),null);
assert.ok(row("Sara Derwish",sara,"2026-10-29","P7"));
assert.equal(row("Sara Derwish",sara,"2026-10-22","P7"),null);
// Shared ELC program: both teachers see the SAME unposted timetable
for (const [name,email] of [
  ["Tara Nguyen","tara_nguyen@istianjin.org.cn"],
  ["Monique Barthakur","monique_barthakur@istianjin.org.cn"]]) {
  assert.match(row(name,email,"2026-10-19","P1")?.subject||"",/ELC shared: Circle Time/);
  assert.equal(row(name,email,"2026-10-26","P3"),null);
  assert.match(row(name,email,"2026-10-19","P3")?.subject||"",/ELC shared: Music/);
  assert.match(row(name,email,"2026-10-21","P7")?.subject||"",/ELC shared: Big Buddies/);
  assert.equal(row(name,email,"2026-10-20","P3"),null,
    "PYP meeting / specialist PE is not automatically a host lesson");
  assert.equal(row(name,email,"2026-10-19","P1")?.grade,"Mixed");
}
for (const [name,email] of expected) {
 const count=WEEKS.flatMap(w=>w.dates.flatMap(d=>
   Array.from({length:8},(_,i)=>row(name,email,d,"P"+(i+1))).filter(Boolean))).length;
 assert.ok(count>20,"Suspiciously low live timetable coverage for "+name+": "+count);
 console.log("SCREENSHOT_TEACHER",name,email,count);
}
console.log("PASS: Isha, Stefanie, Billy A-week, Sara A/B, and shared ELC screenshot timetables resolve accurately.");
