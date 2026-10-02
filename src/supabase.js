import { createClient } from "@supabase/supabase-js";
import { PREVIEW, previewClient, previewNotify } from "./preview";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!PREVIEW && (!url || !key)) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — " +
    "set them in Vercel → Settings → Environment Variables."
  );
}

/* ?preview in the URL swaps in a browser-only stand-in. See preview.js. */
export const supabase = PREVIEW
  ? previewClient
  : createClient(url, key);

/* Fire-and-forget notification. The app never blocks on email:
   if the route isn't live yet, the sign-up still succeeds. */
export async function notify(payload) {
  if (PREVIEW) return previewNotify(payload);
  try {
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) console.warn("notify failed", r.status, await r.text());
  } catch (e) {
    console.warn("notify unreachable", e);
  }
}
