/* Guard against the regression where only Joe's hard-coded timetable was
   connected to "Open my classroom". This runs on every main build. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { EXTRA_SECONDARY_TIMETABLE } from "../src/secondary-timetable-extras.js";
import { matchedSecondaryTeacher, hasSecondaryLessons, scheduledClassFor } from "../src/config.js";

const code = readFileSync("src/timetable-data.js", "utf8");
const encoded = code.match(/const ENCODED = "([^"]+)"/)?.[1];
assert.ok(encoded, "Secondary timetable import not found");
const original = JSON.parse(inflateSync(Buffer.from(encoded, "base64")).toString("utf8"));
const data = { sec: { ...EXTRA_SECONDARY_TIMETABLE, ...original.sec } };

const expectedSecondary = [
  "Marium Ahmad", "Ambika Balakrishna", "Kate Bark", "Wendy Bekkenk",
  "Ellie Chuah", "Michael Conway", "Trey Craig", "Samuel Dejohn",
  "Geoff Diegel", "Li Dong", "Christo du Plooy", "Jeff Errington",
  "Casey Grove", "Ted Guggenheim", "Kit Haines", "Maddy Haines",
  "Rebecca Jiang", "Sheila Kim", "Muriel King", "Lawrence Kok",
  "Wenjun Lv", "Ryan Nel", "Valeria Rocha", "Joe Schaaf",
  "Aileena Song", "Birgit Stolte", "Gareth Williams", "Lily Yang",
  "Hao Zhai", "Islen Craig", "Isha Joshi", "Victoria Lee",
  "Jennifer Liu", "Esther Luppino", "Fu Ping", "Gerben Silvis",
  "Linnea Simon"
];
const dateOfDay = day => day <= 5
  ? ["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"][day-1]
  : ["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23"][day-6];
const periodOf = { a:"B12", b:"B34", c:"B56", d:"B78" };
for (const name of expectedSecondary) {
  assert.ok(Object.hasOwn(data.sec,name), `Missing secondary teacher: ${name}`);
  const email = `${name.replace(/\s+/g,"_")}@istianjin.org.cn`;
  assert.equal(matchedSecondaryTeacher(name,email,data), name);
  const reversed = name.split(/\s+/).reverse().join(" ");
  assert.equal(matchedSecondaryTeacher(reversed,email,data),name,
    `Microsoft identity did not match ${name}`);
  for (const [slot,record] of Object.entries(data.sec[name])) {
    const match = slot.match(/^(10|[1-9])([a-d])$/);
    assert.ok(match, `Invalid slot ${name}/${slot}`);
    const found = scheduledClassFor(reversed, dateOfDay(Number(match[1])), periodOf[match[2]], data, email);
    assert.deepEqual(found,
      {subject:String(record[0]), grade:String(record[1]||""), room:String(record[2]||"")},
      `Wrong class for ${name}/${slot}`);
  }
}
assert.equal(scheduledClassFor("Zhai Hao","2026-10-21","B12",data,"Hao_Zhai@istianjin.org.cn")?.subject,
  "MYP Design", "Hao Zhai's B-week class did not load");
assert.equal(hasSecondaryLessons("Hao Zhai","Hao_Zhai@istianjin.org.cn",data),true);
assert.equal(hasSecondaryLessons("Tara Nguyen","Tara_Nguyen@istianjin.org.cn",data),false);
// School-directory identities with Microsoft profile/email aliases must resolve
// to the same imported teaching records as their timetable names.
for (const [profileName, verifiedEmail, timetableName] of [
  ["Ben Silvis", "ben_silvis@istianjin.org.cn", "Gerben Silvis"],
  ["Ambika Balakrishna", "ambika_gb@istianjin.org.cn", "Ambika Balakrishna"],
  ["Eva Fu", "eva_fu@istianjin.org.cn", "Fu Ping"],
  ["Geoffrey Diegel", "geoffrey_diegel@istianjin.org.cn", "Geoff Diegel"],
  ["Hyun Ae Kim", "hyun_ae_kim@istianjin.org.cn", "Sheila Kim"],
  ["Jeffrey Errington", "jeffrey_errington@istianjin.org.cn", "Jeff Errington"],
  ["Madeleine Haines", "madeleine_haines@istianjin.org.cn", "Maddy Haines"],
  ["Muriel Charpentier", "muriel_charpentier@istianjin.org.cn", "Muriel King"]
]) {
  assert.equal(matchedSecondaryTeacher(profileName, verifiedEmail, data), timetableName,
    `The verified login ${verifiedEmail} could not access ${timetableName}'s timetable`);
}
const empty = expectedSecondary.filter(name=>!hasSecondaryLessons(name,"",data));
console.log(`Verified ${expectedSecondary.length} secondary timetable identities, ${expectedSecondary.length-empty.length} with selectable classes. No-class records: ${empty.join(", ")||"none"}.`);
