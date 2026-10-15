/* End-to-end timetable regression audit for Elementary.
   The source-of-truth is the 2026–27 TEACHER Timetables.xlsx workbook,
   including A/B week differences and specialists teaching both divisions.
   This check runs before production builds, alongside Secondary audit. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import {
  ELEMENTARY_SCHEDULE_IDENTITIES, matchedElementarySources, elementaryLabelsFor,
  hasElementaryLessons, scheduledElementaryClassFor
} from "../src/config.js";

function readEmbedded(path, variable) {
  const text = readFileSync(path, "utf8");
  const re = new RegExp(`const ${variable}\\s*=\\s*"([^"]+)"`);
  const encoded = text.match(re)?.[1];
  assert.ok(encoded, `Missing ${variable} timetable payload: ${path}`);
  return JSON.parse(inflateSync(Buffer.from(encoded, "base64")).toString("utf8"));
}
const base = readEmbedded("src/timetable-data.js", "ENCODED");
const refined = readEmbedded("src/elementary-timetable.js", "DATA");
const timetables = { es: { ...(base.es || {}), ...refined } };
const sourceSheets = [
  "Tara & Monique-ELC", "Clare-K", "Jo-G1", "Nadia-G1",
  "Chris-G2A", "Chris-G2B", "Billy-G3", "Michael-G4", "Celeste-G4",
  "Nicole-G5", "Gemma-G5", "Sara-ELA", "Stef-ELA", "Toni-IN",
  "Isha-Art", "Victoria-MUSIC", "Islen-STEM", "Linnea-Library",
  "Ben-PSPE", "Wendy-PE", "Durian-PE", "Michael-German",
  "Esther-French", "Helen-Fu Ping-Jennifer-Chinese", "Mariana-PYPC"
];
const compact = n => n.toLowerCase().replace(/[^a-z0-9]/g, "");
const importedKeys = Object.keys(timetables.es);
// The ELC template has no classes in the supplied workbook, so it is not
// an imported teaching schedule and must be reported as an explicit exception.
const emptyWorkbookTemplates = new Set(["Tara & Monique-ELC"]);
const missingSheets = sourceSheets.filter(name => !emptyWorkbookTemplates.has(name) &&
  !importedKeys.some(k => compact(k) === compact(name)));
const unmatched = ELEMENTARY_SCHEDULE_IDENTITIES.filter(person =>
  !["Tara Nguyen","Monique Barthakur"].includes(person.name) &&
  !matchedElementarySources(person.name,person.email,timetables).length)
  .map(person => person.name);
const reports = ELEMENTARY_SCHEDULE_IDENTITIES.map(p => {
  const sources = matchedElementarySources(p.name,p.email,timetables);
  const lessons = [
    ...Array.from({length:5},(_,i)=>`2026-10-${26+i}`),
    ...Array.from({length:5},(_,i)=>`2026-10-${19+i}`)
  ].flatMap(date => Array.from({length:8},(_,pnum)=>
    scheduledElementaryClassFor(p.name,date,`P${pnum+1}`,timetables,p.email) ? 1 : 0))
    .reduce((a,b)=>a+b,0);
  return {name:p.name,source:sources.join("+") || "NOT FOUND", selectableLessons:lessons};
});
console.log("Source Elementary workbook sheets:", sourceSheets.length);
console.log("Imported Elementary source keys:", importedKeys.length);
console.log("Missing sheets:", missingSheets.join("; ") || "none");
console.log("Unmatched faculty identities:", unmatched.join("; ") || "none");
console.log("Elementary mapped identity coverage:",JSON.stringify(reports));
assert.equal(missingSheets.length,0,"Some uploaded Elementary workbook timetables were not imported");
assert.equal(unmatched.length,0,"Some Elementary teachers cannot retrieve their uploaded timetable");
// This is deliberately a separate exception, not silently labeled complete.
// The uploaded ELC sheet contains no classes and the Chinese source is shared.
const empty = reports.filter(p=>p.selectableLessons===0);
console.log("Exceptions needing individual schedule verification or entry:", empty.map(p=>p.name).join("; ") || "none");
// Specific weekly regression: Clare teaches reading on the Monday morning.
// Record the subject without needing to guess a room or instructor.
assert.ok(
  elementaryLabelsFor("Clare Murphy","clare_craig@istianjin.org.cn","2026-10-26","P1",timetables)
  .some(label=>/read/i.test(label)),
  "Clare's known Elementary P1 lesson does not appear in Open Doors"
);
console.log("PASS: Elementary workbook names, email matches and dated class lookup validated");
