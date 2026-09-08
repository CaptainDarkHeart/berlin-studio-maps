import type { APIRoute } from 'astro';
import studios from '../data/studios.json';
import { slugify, areaSlug } from '../lib/slug';
import { FEATURES } from '../lib/features';

export const GET: APIRoute = () => {
  const list = studios as any[];
  const areas = Array.from(new Set(list.map(s => s.area))).sort();
  const daylightCount = list.filter(s => s.daylight).length;
  const cicloramaCount = list.filter(s => s.ciclorama).length;
  const base = 'https://berlinstudiomaps.com';

  const lines: string[] = [];
  lines.push('# Berlin Studio Map');
  lines.push('');
  lines.push(`> Free, independent directory of ${list.length} photography studios for hire in Berlin. Every listing is manually fact-checked against the studio's own site, not AI-estimated. Filterable by daylight, blackout, infinity cyclorama, drive-in access, and facilities, with a build-time and live sunrise/sunset/golden-hour calculator for each studio's Berlin location. No booking system or commission: this site links directly to each studio's own contact channel.`);
  lines.push('');
  lines.push('## About');
  lines.push(`- [About Berlin Studio Map](${base}/about/): what this directory is, data sourcing and accuracy policy, who built it (Berlin photographer Beto Ruiz Alonso together with Dan Taylor), and contact.`);
  lines.push(`- [Suggest a Studio](${base}/suggest/): add a missing studio or report a correction.`);
  lines.push('');
  lines.push('## Studios');
  lines.push(`- [All studios A-Z](${base}/studios/): full list of ${list.length} studios across ${areas.length} Berlin areas.`);
  for (const s of [...list].sort((a, b) => a.name.localeCompare(b.name))) {
    const feats = [
      s.daylight && 'daylight',
      s.ciclorama && 'infinity cyclorama',
      s.blackout && 'blackout',
      s.driveIn && 'drive-in',
    ].filter(Boolean).join(', ');
    lines.push(`- [${s.name}](${base}/studios/${slugify(s)}/): ${s.neighbourhood}, ${s.area} Berlin. ${s.rate}.${feats ? ` Features: ${feats}.` : ''}`);
  }
  lines.push('');
  lines.push('## Areas');
  for (const a of areas) {
    const count = list.filter(s => s.area === a).length;
    lines.push(`- [${a} Berlin](${base}/areas/${areaSlug(a)}/): ${count} studio${count === 1 ? '' : 's'}.`);
  }
  lines.push('');
  lines.push('## Features');
  for (const [slug, f] of Object.entries(FEATURES)) {
    const count = list.filter(s => (s as any)[f.key]).length;
    lines.push(`- [${f.label}](${base}/features/${slug}/): ${count} ${f.noun}.`);
  }
  lines.push('');
  lines.push('## Guides');
  lines.push(`- [The Complete Guide to Photography Studio Hire in Berlin](${base}/blog/complete-guide-photography-studio-hire-berlin/)`);
  lines.push(`- [Best Daylight Photography Studios in Berlin](${base}/blog/best-daylight-studios-berlin/): ${daylightCount} daylight studios compared.`);
  lines.push(`- [Photography Studios with Infinity Cycloramas in Berlin](${base}/blog/studios-with-infinity-coves-berlin/): ${cicloramaCount} studios with infinity cycloramas.`);
  lines.push('');
  lines.push('## Data');
  lines.push(`- [studios.json](${base}/studios.json): raw structured data backing every page on this site (id, name, area, neighbourhood, coordinates, rate, and feature flags).`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
