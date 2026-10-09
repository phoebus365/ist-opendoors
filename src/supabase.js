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

/* Returns delivery-request status so cancellation failures are visible.
   Booking actions may still proceed if email service is unavailable. */
export async function notify(payload) {
  if (PREVIEW) {
    await previewNotify(payload);
    return { ok: true };
  }
  try {
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const detail = await r.text();
      console.warn("notify failed", r.status, detail);
      return { ok: false, status: r.status };
    }
    return { ok: true };
  } catch (e) {
    console.warn("notify unreachable", e);
    return { ok: false, status: "network" };
  }
}
