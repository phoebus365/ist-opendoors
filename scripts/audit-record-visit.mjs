/* Regression checks for Record a visit identity, selection, and posting choices. */
import assert from "node:assert/strict";
import { recordVisitHosts, recordVisitClassOptions } from "../src/record-visit-helpers.js";
const directory=[
  {name:"Ben Silvis",email:"ben_silvis@istianjin.org.cn",division:"Elementary"},
  {name:"Gemma Lowrey",email:"gemma_lowrey@istianjin.org.cn",division:"Elementary"},
  {name:"Wendy Bekkenk",email:"wendy_bekkenk@istianjin.org.cn",division:"Secondary"},
  {name:"Tara Nguyen",email:"tara_nguyen@istianjin.org.cn",division:"Elementary"},
  {name:"Monique Barthakur",email:"monique_barthakur@istianjin.org.cn",division:"Elementary"},
  {name:"Sara Derwish",email:"sara_derwish@istianjin.org.cn",division:"Elementary"}
];
const timetables={sec:{
  "Wendy Bekkenk":{"6a":["MYP Humanities","7C","101"]}
},es:{
  "Ben-PSPE":{B13:["Grade 1 PE"]},
  "Gemma-G5":{B12:["Writing"]},
  "Wendy-PE":{B17:["5B"]},
  "Tara & Monique-ELC":{AB11:["Circle Time"]},
  "Sara-ELA":{B12:["Grade 1 Reading"]}
}};
const entries=[
  {id:"open-1",date_str:"2026-10-19",period_key:"P2",division:"Elementary",host_email:"gemma_lowrey@istianjin.org.cn",host_name:"Gemma Lowrey",subject:"Writing"},
  {id:"open-2",date_str:"2026-10-19",period_key:"B12",division:"Secondary",host_email:"wendy_bekkenk@istianjin.org.cn",host_name:"Wendy Bekkenk",subject:"MYP Humanities"}
];
const hosts=recordVisitHosts(directory,entries,timetables,"sara_derwish@istianjin.org.cn","Sara Derwish");
assert.equal(hosts.filter(h=>h.name==="Gemma Lowrey").length,1,"No duplicate workbook-name hosts");
assert.ok(hosts.some(h=>h.name==="Wendy Bekkenk"&&h.division==="Secondary"));
assert.ok(hosts.some(h=>h.name==="Wendy Bekkenk"&&h.division==="Elementary"),"Cross-division host should be selectable");
assert.ok(hosts.some(h=>h.name==="Ben Silvis"&&h.email==="ben_silvis@istianjin.org.cn"));
assert.ok(hosts.some(h=>h.name==="Tara Nguyen"));
assert.ok(hosts.some(h=>h.name==="Monique Barthakur"));
assert.ok(!hosts.some(h=>h.name==="Sara Derwish"),"Don't record a visit to yourself");
const gemma=hosts.find(h=>h.name==="Gemma Lowrey");
const gemmaClasses=recordVisitClassOptions(gemma,"2026-10-19",entries,timetables);
assert.equal(gemmaClasses.options.length,1,"An opened lesson should not duplicate its timetable option");
assert.equal(gemmaClasses.options[0].entryId,"open-1");
const ben=hosts.find(h=>h.name==="Ben Silvis");
assert.ok(recordVisitClassOptions(ben,"2026-10-19",entries,timetables).options.some(x=>/PE/.test(x.label)));
const wendySecondary=hosts.find(h=>h.name==="Wendy Bekkenk"&&h.division==="Secondary");
assert.equal(recordVisitClassOptions(wendySecondary,"2026-10-19",entries,timetables).options[0].entryId,"open-2");
const wendyElementary=hosts.find(h=>h.name==="Wendy Bekkenk"&&h.division==="Elementary");
assert.ok(recordVisitClassOptions(wendyElementary,"2026-10-19",entries,timetables).options.some(x=>x.label.includes("5B")));
assert.ok(recordVisitClassOptions(hosts.find(h=>h.name==="Monique Barthakur"),"2026-10-19",entries,timetables).options.length);
console.log("PASS: Record a visit identifies actual teachers and classes, including cross-division and shared ELC schedules.");
