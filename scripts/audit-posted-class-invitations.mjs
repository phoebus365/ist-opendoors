/* Regression: invite colleagues after posting without emailing on ordinary edits. */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {addClassInvitee,MAX_CLASS_INVITEES} from "../src/class-invite-selection.js";
const host="host@istianjin.org.cn";
let recipients=[];
for(const email of ["JOE_SCHAAF@istianjin.org.cn","joe_schaaf@istianjin.org.cn","abc@example.com",host]){
  const result=addClassInvitee(recipients,email,host);
  if(!result.error)recipients=result.recipients;
}
assert.deepEqual(recipients,["joe_schaaf@istianjin.org.cn"],
  "Email normalization, duplicate rejection or domain validation failed");
assert.equal(MAX_CLASS_INVITEES,12);
for(let i=0;i<11;i++) recipients=addClassInvitee(recipients,
  `teacher${i}@istianjin.org.cn`,host).recipients;
assert.equal(recipients.length,12);
assert.ok(addClassInvitee(recipients,"over@istianjin.org.cn",host).error,
  "Invitations must respect the API's 12-person limit");
const app=readFileSync("src/App.jsx","utf8");
const save=app.slice(app.indexOf("async function saveOpenClass()"),app.indexOf("async function cancelOpenClass(entry)"));
const send=app.slice(app.indexOf("async function sendEditedClassInvitations()"),app.indexOf("const ready = keys.length",app.indexOf("async function sendEditedClassInvitations()")));
const editor=app.slice(app.indexOf("const editModal ="),app.indexOf('if (step === "detail")',app.indexOf("const editModal =")));
assert.ok(save.includes('.update(') && !save.includes('notify('),
  "Saving edits must not send invitations");
assert.ok(send.includes('kind:"class_invitation"') && send.includes("editing.id") &&
  send.includes("supabase.auth.getSession"), "Posted-class invitations must use the authenticated existing-class API");
assert.ok(editor.includes('onClick={sendEditedClassInvitations}') &&
  editor.includes("Invite colleagues") && editor.includes("Send invitations"),
  "Edit modal must expose explicit send controls");
assert.ok(app.includes("onManage={startEditClass}"),"Opening editor must reset recipients");
console.log("PASS: Already-posted class editor can explicitly invite colleagues without emailing on Save changes.");
