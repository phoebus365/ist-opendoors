/* Open Doors regression test: Ben Silvis must see his Elementary PE lessons. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { WEEKS, matchedElementarySources, hasElementaryLessons, scheduledElementaryClassFor } from "../src/config.js";
const load = (path, key) => {
  const content = readFileSync(path,"utf8");
  const match = content.match(new RegExp('const '+key+'\\s*=\\s*"([^"]+)"'));
  assert.ok(match,key+" timetable data missing");
  return JSON.parse(inflateSync(Buffer.from(match[1],"base64")).toString("utf8"));
};
const base = load("src/timetable-data.js","ENCODED");
const refined = load("src/elementary-timetable.js","DATA");
const data = {es:{...(base.es||{}),...refined}};
const name="Ben Silvis", email="ben_silvis@istianjin.org.cn";
assert.deepEqual(matchedElementarySources(name,email,data),["Ben-PSPE"]);
assert.ok(hasElementaryLessons(name,email,data),"Ben's timetable must be selectable");
for (const date of ["2026-10-19","2026-10-26","2026-11-02"]) {
  const lesson = scheduledElementaryClassFor(name,date,"P3",data,email);
  assert.ok(lesson && lesson.subject.includes("2L"),"Missing Monday P3 PE for "+date);
}
const count = WEEKS.flatMap(w=>w.dates.flatMap(date=>
  Array.from({length:8},(_,i)=>scheduledElementaryClassFor(name,date,"P"+(i+1),data,email)).filter(Boolean)
)).length;
assert.ok(count>=20,"Ben's calendar contains too few PE lessons: "+count);
console.log("PASS: Ben Silvis (ben_silvis@istianjin.org.cn) has "+count+" visible Elementary PE class cells across all three weeks.");
