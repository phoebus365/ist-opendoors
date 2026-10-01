# Open Doors — IST

Classroom visit calendar. Teachers open their doors; colleagues sign up to visit.

- **Window:** 19 October – 6 November 2026
- **Sign-in:** school Microsoft account
- **Supabase project:** `ist-opendoors` · `unvrlyfqxdlevokxqstp` · ap-northeast-1
- **Separate from Cover Board.** Nothing here touches that project.

## Stack

| Piece | What |
|---|---|
| Frontend | React + Vite |
| Hosting | Vercel, builds from this repo |
| Data + auth | Supabase |
| Login | Microsoft / Entra via Supabase's Azure provider |
| Email | Microsoft Graph, from a school mailbox (`/api/notify`) |

Nothing builds on your Mac. Push to `main`, Vercel rebuilds.

## How it works

After signing in, you pick a path:

**Open my classroom** → choose a division → click every day/period cell you're
happy to host → one form lists all of them → per class: subject, grade, room,
what you'll be highlighting, and a note about that particular lesson.

**Visit a class** → Elementary / Secondary tabs → calendar or list → click a
class to see what's planned → "I'll visit this class". Withdrawing asks for a
reason and an optional line for the host.

Emails go out on both: the visitor gets a confirmation, the host is told
someone's coming, and both are told when a visit is withdrawn.

## Setup

### 1. Database — done

`supabase-opendoors.sql` has been run. It creates `opendoors_entries`,
`opendoors_visits`, the `opendoors-files` storage bucket, row-level security,
and the `opendoors_board` reporting view. Safe to re-run.

### 2. Entra — what IT needs to do

Add this redirect URI to an app registration:

```
https://unvrlyfqxdlevokxqstp.supabase.co/auth/v1/callback
```

Then supply **Tenant ID**, **Application (client) ID**, and a **client secret**.

For email, the same registration also needs **Mail.Send** as an *Application*
permission (not Delegated) with admin consent, plus a sending mailbox —
`opendoors@istianjin.org.cn` or similar.

### 3. Supabase — turn on Microsoft sign-in

Authentication → Providers → Azure. Paste the client ID and secret. Azure
Tenant URL:

```
https://login.microsoftonline.com/<tenant-id>
```

Then Authentication → URL Configuration → Redirect URLs:

```
https://opendoors.commonpractices.org/**
https://<vercel-name>.vercel.app/**
```

### 4. Vercel

Import the repo. Framework preset **Vite**, build `npm run build`, output `dist`.

Environment variables:

| Name | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | `https://unvrlyfqxdlevokxqstp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Settings → API Keys → publishable |
| `MS_TENANT_ID` | from IT |
| `MS_CLIENT_ID` | from IT |
| `MS_CLIENT_SECRET` | from IT |
| `MS_SENDER` | the sending mailbox |

The first two are needed for the app to work at all. The last four are needed
only for email — without them `/api/notify` returns 503 and sign-ups still
work silently.

### 5. DNS — Bluehost

CNAME, host `opendoors`, pointing at the target Vercel gives you. Same pattern
as `cover`.

## Who can do what

Enforced by row-level security, not just hidden in the interface.

- Anyone signed in sees the whole board
- You can only post a class under your own email
- You can only remove your own class
- You can only sign yourself up, or withdraw yourself
- A host can also clear a visitor from their own class

Names come from the Microsoft profile, so there's no teacher list to maintain
and no name collisions to resolve.

## Yearly maintenance

Everything that changes lives in `src/config.js`:

| What | Constant |
|---|---|
| Dates and A/B labels | `WEEKS` |
| Elementary periods | `ES_PERIODS` |
| Secondary blocks | `SEC_BLOCKS` |
| Subject dropdowns | `SUBJECTS_ES`, `SUBJECTS_SEC` |
| Grade dropdowns | `GRADES_ES`, `GRADES_SEC` |
| Observation checklist | `FOCUS_PEDAGOGY`, `FOCUS_GENERAL` |
| Cancellation reasons | `CANCEL_REASONS` |
| Colors and fonts | `T`, `FONT` |

To clear a previous year: `delete from opendoors_entries;` in the SQL Editor.
Visits cascade automatically.

## Reporting

`opendoors_board` is a view over entries with a live visitor count attached —
useful for a post-event summary of who opened up and how much traffic each
class drew.

## Not built yet

- **Attachments.** The `attachment` column and storage bucket exist and the
  policies are in place, but the upload control isn't wired into the form.
  Worth adding once you've seen whether teachers want it.
- **Secondary block times** in `SEC_BLOCKS` are inferred from the elementary
  timetable. Check them against the secondary bell schedule.
