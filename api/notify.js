/* Open Doors — email notifications via Microsoft Graph.
   Mirrors the Cover Board setup: client-credentials flow, sending from a
   school mailbox. Needs these env vars in Vercel:

     MS_TENANT_ID
     MS_CLIENT_ID
     MS_CLIENT_SECRET
     MS_SENDER          e.g. opendoors@istianjin.org.cn

   Until those are set the route returns 503 and the app carries on —
   sign-ups still work, they just don't send mail. */

const GRAPH = "https://graph.microsoft.com/v1.0";

async function token() {
  const r = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials"
      })
    }
  );
  if (!r.ok) throw new Error("token: " + (await r.text()));
  return (await r.json()).access_token;
}

async function send(tok, to, subject, html) {
  const r = await fetch(`${GRAPH}/users/${process.env.MS_SENDER}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: to } }]
      },
      saveToSentItems: true
    })
  });
  if (!r.ok) throw new Error(`sendMail ${to}: ` + (await r.text()));
}

const SHELL = (body) => `
<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;max-width:540px;color:#1a1a1a">
  <div style="background:#1a1a1a;padding:16px 22px;border-radius:6px 6px 0 0">
    <span style="font-size:18px;color:#fff">Open <em style="color:#d9736c">Doors</em></span>
  </div>
  <div style="border:1px solid #e3e0dc;border-top:none;border-radius:0 0 6px 6px;padding:24px 22px">
    ${body}
    <p style="font-size:12px;color:#96918b;margin:26px 0 0;border-top:1px solid #e3e0dc;padding-top:14px">
      International School of Tianjin · 19 October – 6 November 2026
    </p>
  </div>
</div>`;

const slot = (e) => `
  <table style="font-size:14px;color:#55524e;border-collapse:collapse;margin:14px 0">
    <tr><td style="padding:3px 16px 3px 0;color:#96918b">When</td><td><strong>${e.date}</strong> · ${e.period}</td></tr>
    <tr><td style="padding:3px 16px 3px 0;color:#96918b">Class</td><td>${e.subject} · ${e.grade}</td></tr>
    ${e.room ? `<tr><td style="padding:3px 16px 3px 0;color:#96918b">Room</td><td>${e.room}</td></tr>` : ""}
  </table>`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_SECRET) {
    return res.status(503).json({ error: "email not configured yet" });
  }

  const { kind, host, visitor, entry, reason, note } = req.body || {};
  if (!kind || !host || !visitor || !entry) {
    return res.status(400).json({ error: "missing fields" });
  }

  try {
    const tok = await token();

    if (kind === "visit_joined") {
      await send(tok, visitor.email,
        `You're visiting ${host.name}'s class`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px">You're signed up to visit <strong>${host.name}</strong>.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#55524e;margin:0">
            If something comes up, open the board and withdraw — ${host.name.split(" ")[0]} will be told.
          </p>`)
      );
      await send(tok, host.email,
        `${visitor.name} is coming to your ${entry.subject} class`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px"><strong>${visitor.name}</strong> has signed up to visit.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#55524e;margin:0">Nothing to do — just letting you know.</p>`)
      );
    }

    else if (kind === "visit_cancelled") {
      await send(tok, host.email,
        `${visitor.name} can no longer visit`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px"><strong>${visitor.name}</strong> has withdrawn from your class.</p>
          ${slot(entry)}
          ${reason ? `<p style="font-size:13.5px;color:#55524e;margin:0 0 6px"><strong>Reason:</strong> ${reason}</p>` : ""}
          ${note ? `<p style="font-size:13.5px;color:#55524e;margin:0;font-style:italic">"${note}"</p>` : ""}`)
      );
      await send(tok, visitor.email,
        `Withdrawn from ${host.name}'s class`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px">You've withdrawn from this visit.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#55524e;margin:0">${host.name} has been told. You can sign up again any time.</p>`)
      );
    }

    else return res.status(400).json({ error: "unknown kind: " + kind });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("notify:", e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}
