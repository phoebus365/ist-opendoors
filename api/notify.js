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

/* Email-safe inline colors mirror src/config.js and the Open Doors login screen.
   A red masthead and orange divider also work in Outlook/desktop mail clients. */
const EMAIL = Object.freeze({
  red: "#cd2129", orange: "#f89c26", paper: "#f7f7f7",
  ink: "#2b2929", muted: "#5c6474", line: "#e6e3dd"
});

const SHELL = (body) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
  style="background-color:${EMAIL.paper};border-collapse:collapse;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${EMAIL.ink}">
  <tr><td align="center" style="padding:16px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
      style="width:100%;max-width:600px;background-color:#ffffff;border-collapse:collapse">
      <tr><td style="background-color:${EMAIL.red};padding:23px 28px;color:#ffffff;font-size:24px;font-weight:700">
        Open <em style="color:#ffffff;font-style:italic;font-weight:700">Doors</em>
      </td></tr>
      <tr><td style="background-color:${EMAIL.orange};height:5px;font-size:0;line-height:5px">&nbsp;</td></tr>
      <tr><td style="padding:28px;border:1px solid ${EMAIL.line};border-top:none;color:${EMAIL.ink};font-size:15px;line-height:1.55">
        ${body}
        <p style="font-size:12px;color:${EMAIL.muted};margin:28px 0 0;border-top:1px solid ${EMAIL.line};padding-top:15px">
          International School of Tianjin · 10/19/2026 – 11/06/2026
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>`;

// Format stored ISO dates without timezone conversion; keep UI-formatted dates intact.
const emailDate = value => String(value ?? "").replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$2/$3/$1");

const slot = (e) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"
    style="font-size:14px;color:${EMAIL.ink};border-collapse:collapse;margin:16px 0 22px">
    <tr><td style="padding:5px 20px 5px 0;color:${EMAIL.muted};vertical-align:top">When</td><td style="padding:5px 0"><strong>${emailDate(e.date)}</strong> · ${e.period}</td></tr>
    <tr><td style="padding:5px 20px 5px 0;color:${EMAIL.muted};vertical-align:top">Class</td><td style="padding:5px 0">${e.subject} · ${e.grade}</td></tr>
    ${e.room ? `<tr><td style="padding:5px 20px 5px 0;color:${EMAIL.muted};vertical-align:top">Room</td><td style="padding:5px 0">${e.room}</td></tr>` : ""}
  </table>`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.MS_TENANT_ID || !process.env.MS_CLIENT_SECRET) {
    return res.status(503).json({ error: "email not configured yet" });
  }

  // Invitation emails require a verified signed-in host and their own posted class.
  // Never trust a browser-supplied sender or recipient list without verification.
  if (req.body?.kind === "class_invitation") {
    const { access_token, entry_id, invitees } = req.body;
    const origin = process.env.VITE_SUPABASE_URL;
    const anon = process.env.VITE_SUPABASE_ANON_KEY;
    if (!origin || !anon || !access_token || !entry_id ||
        !Array.isArray(invitees) || invitees.length < 1 || invitees.length > 12) {
      return res.status(400).json({error:"Invalid invitation request"});
    }
    const addresses = [...new Set(invitees.map(x => String(x).trim().toLowerCase()))];
    if (addresses.length > 12 || addresses.some(x => !/^[a-z0-9._%+-]+@istianjin\.org\.cn$/.test(x))) {
      return res.status(400).json({error:"Invitations require IST email addresses"});
    }
    try {
      const headers = { apikey: anon, Authorization: "Bearer " + access_token };
      const identity = await fetch(origin + "/auth/v1/user", {headers});
      if (!identity.ok) return res.status(401).json({error:"Please sign in again"});
      const user = await identity.json();
      const email = (user.email || "").toLowerCase();
      if (!email || addresses.includes(email)) return res.status(403).json({error:"Invalid invitation recipients"});
      const lookup = await fetch(origin + "/rest/v1/opendoors_entries?id=eq." +
        encodeURIComponent(entry_id) + "&select=id,host_name,host_email,subject,grade,room,date_str,period_key,division", {headers});
      if (!lookup.ok) throw Error("Could not verify the opened class");
      const [record] = await lookup.json();
      if (!record || record.host_email.toLowerCase() !== email) {
        return res.status(403).json({error:"Only the host may invite colleagues"});
      }
      const escape = value => String(value || "").replace(/[&<>"']/g,
        ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
      const link = "https://opendoors.commonpractices.org/?visit=" + encodeURIComponent(record.id);
      const body = SHELL(`
        <p style="font-size:15px"><strong>${escape(record.host_name)}</strong> invites you to visit their classroom.</p>
        ${slot({date:escape(record.date_str),period:escape(record.period_key),subject:escape(record.subject),grade:escape(record.grade),room:escape(record.room)})}
        <p><a href="${link}" style="background:#cd2129;color:white;padding:11px 18px;border-radius:5px;text-decoration:none;display:inline-block">View class and book a visit</a></p>
        <p style="font-size:12px;color:#666">This invitation doesn't reserve a place. Sign in and choose “I'll visit this class” to book.</p>`);
      const tok = await token();
      const results = await Promise.allSettled(addresses.map(to => send(tok,to,
        `Invitation: visit ${record.host_name}'s ${record.subject} class`,body)));
      const failed = results.filter(x=>x.status==="rejected");
      if (failed.length) return res.status(502).json({error:`Could not send ${failed.length} invitation(s)`});
      return res.status(200).json({ok:true,count:addresses.length});
    } catch (error) {
      console.error("Invitation delivery:",error);
      return res.status(500).json({error:"Invitation delivery failed"});
    }
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
          <p style="font-size:13.5px;color:#5c6474;margin:0">
            If something comes up, open the board and withdraw — ${host.name.split(" ")[0]} will be told.
          </p>`)
      );
      await send(tok, host.email,
        `${visitor.name} is coming to your ${entry.subject} class`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px"><strong>${visitor.name}</strong> has signed up to visit.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#5c6474;margin:0">Nothing to do — just letting you know.</p>`)
      );
    }

    else if (kind === "class_cancelled") {
      await send(tok, visitor.email,
        `Class visit cancelled: ${entry.subject}`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px"><strong>${host.name}</strong> has cancelled this open classroom session.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#5c6474">Your booking is cancelled. You can choose another class on Open Doors.</p>`)
      );
    }

    else if (kind === "visit_cancelled") {
      await send(tok, host.email,
        `${visitor.name} can no longer visit`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px"><strong>${visitor.name}</strong> has withdrawn from your class.</p>
          ${slot(entry)}
          ${reason ? `<p style="font-size:13.5px;color:#5c6474;margin:0 0 6px"><strong>Reason:</strong> ${reason}</p>` : ""}
          ${note ? `<p style="font-size:13.5px;color:#5c6474;margin:0;font-style:italic">"${note}"</p>` : ""}`)
      );
      await send(tok, visitor.email,
        `Withdrawn from ${host.name}'s class`,
        SHELL(`
          <p style="font-size:15px;margin:0 0 4px">You've withdrawn from this visit.</p>
          ${slot(entry)}
          <p style="font-size:13.5px;color:#5c6474;margin:0">${host.name} has been told. You can sign up again any time.</p>`)
      );
    }

    else return res.status(400).json({ error: "unknown kind: " + kind });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("notify:", e);
    return res.status(500).json({ error: String(e.message || e) });
  }
}