/* Verify the shared email template tracks IST's red/orange branding.
   This check is intentionally side-effect-free: no email messages are sent. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { T } from "../src/config.js";
const source = readFileSync("api/notify.js", "utf8");
for (const [label,color] of [["header",T.red],["stripe",T.stripe],
  ["background",T.page],["ink",T.ink],["muted",T.text2],["border",T.line]]) {
  assert.ok(source.includes(color), `Email ${label} doesn't use app color ${color}`);
}
assert.ok(source.includes('background-color:${EMAIL.red}') &&
  source.includes('background-color:${EMAIL.orange}'),
  "Every notification must use the common red masthead and orange stripe");
assert.ok(!source.includes("#d9736c") && !source.includes("#1a1a1a"),
  "Old black/coral email branding must not remain");
for (const kind of ["class_invitation","visit_joined","class_cancelled","visit_cancelled"]) {
  assert.ok(source.includes(`kind === "${kind}"`),`Lost notification type: ${kind}`);
}
assert.ok(!/kind === "walkin|kind === "record_visit/.test(source),
  "Walk-in recording must not send notification emails");
console.log("PASS: All Open Doors notification emails use IST red/orange branding.");
