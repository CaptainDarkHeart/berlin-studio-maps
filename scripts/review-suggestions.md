# Studio suggestion review (scheduled, autonomous)

Runbook for the recurring job that fact-checks queued studio suggestions and
auto-adds the ones that check out. Runs unattended, no human approval step,
per an explicit choice made 2026-09-08: bad calls here go live on
berlinstudiomaps.com without a review gate, so be conservative, not just
thorough.

## 1. Pull the queue

Query D1 database `berlin-studio-suggestions`
(`d6cd0950-bb8d-4943-ab0f-858221ea327c`):

```sql
SELECT * FROM suggestions WHERE status = 'pending' ORDER BY created_at ASC;
```

If empty, stop. Nothing to do this run.

## 2. Fact-check each row

For each pending suggestion, use WebFetch/WebSearch to check:

- **Is it real and rentable.** The website must describe an actual
  photography studio available to hire, not a photographer's portfolio, an
  agency, an audio/film studio, a coworking space, or a permanently closed
  business. This exact mistake happened before in this dataset (see the
  2026-09-08 audit that removed 4 bad entries for these reasons) — don't
  repeat it.
- **Berlin, plausible neighbourhood.** Confirm the address or service area is
  actually in Berlin and the claimed neighbourhood is real. Map the
  neighbourhood to one of the existing `area` values in
  `src/data/studios.json` (e.g. Alt-Hohenschönhausen → Lichtenberg,
  Prenzlauer Berg → Prenzlauer Berg). If it's a Berlin district not yet in
  the dataset, use the district name as-is for both `area` and
  `neighbourhood`.
- **Amenities.** Only keep a feature flag (`daylight`, `blackout`,
  `ciclorama`, `driveIn`, `kitchen`, `makeup`, `greenRoom`, `wifi`) as `true`
  if the studio's own site corroborates it, or it's a submitter claim you
  have no reason to doubt and isn't safety/legally sensitive. If a claimed
  feature can't be corroborated at all and seems like a stretch, drop it to
  `false` rather than guessing.
- **Rate / size / ceiling.** Copy from the submission if plausible; trim or
  correct against the site if it disagrees.
- **Coordinates.** Try to find a street address on the studio's site and
  geocode that (not the business name) via Nominatim:
  `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=<address>`
  with a `User-Agent` header. If that fails, approximate using the average
  `lat`/`lng` of existing studios sharing the same `neighbourhood` in
  `src/data/studios.json`, or the district centroid if none exist. This is
  best-effort map-pin precision, not exact geocoding, and that's fine.

## 3. Decide

- **Approve** only if you're confident it's a real, rentable Berlin
  photography studio and you've verified name + category + rough location
  independently of the submitter's word. When genuinely unsure, reject —
  the bar is "would I bet this doesn't need a correction email in a month."
- **Reject** anything that fails the checks above, plus anything already
  caught as `auto_rejected` by the Worker's prefilter (those won't appear
  here, they never reach `pending`).

## 4. Apply an approval

1. Compute the next `id` as `max(existing ids) + 1` from
   `src/data/studios.json`.
2. Build the studio object matching the existing schema exactly (see any
   entry in `src/data/studios.json` for the field list: `id, name, area,
   neighbourhood, lat, lng, sqm, ceil, rate, daylight, blackout, ciclorama,
   driveIn, kitchen, makeup, greenRoom, wifi, facing, extras, web, v, email,
   badge`). Set `v: 1` (verified), `facing: null` unless known, `extras: []`
   unless there's genuinely useful detail worth a bullet (mirror the style
   of existing entries).
3. Append the object to **both** `src/data/studios.json` and
   `public/studios.json` — they must stay identical, this has drifted before.
4. `git add`, commit with a message naming the studio and what was verified
   (mirror the style of the "Add Birkenstudio (Moabit)" commit), sign off
   `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`, and push
   directly to `main`. This triggers Cloudflare Workers Builds and goes
   live in under a minute — that's expected and intended for this job.
5. Update the D1 row: `status = 'approved'`, `reviewed_at = datetime('now')`,
   `reviewed_by = 'claude-scheduled'`, `review_notes = '<what you verified
   and how>'`.

## 5. Apply a rejection

Update the D1 row: `status = 'rejected'`, `reviewed_at = datetime('now')`,
`reviewed_by = 'claude-scheduled'`, `reject_reason = '<short reason>'`.
Do not touch the site files.

## 6. Report

After processing the whole batch, send one summary email to
`dantaylormedia@gmail.com` via the Gmail connector: subject
"Berlin Studio Map: suggestion review — N approved, M rejected", body listing
each studio name with its outcome and one-line reason. Skip the email if the
queue was empty (step 1).
