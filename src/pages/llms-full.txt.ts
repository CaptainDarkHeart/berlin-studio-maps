import type { APIRoute } from 'astro';
import studios from '../data/studios.json';
import { slugify, areaSlug } from '../lib/slug';

const yn = (v: unknown) => (v ? 'yes' : 'no');

export const GET: APIRoute = () => {
  const list = [...(studios as any[])].sort((a, b) => a.name.localeCompare(b.name));
  const areas = Array.from(new Set(list.map(s => s.area))).sort();
  const base = 'https://berlinstudiomap.com';

  const lines: string[] = [];
  lines.push('# Berlin Studio Map: full studio details');
  lines.push('');
  lines.push(`> ${list.length} photography studios for hire in Berlin across ${areas.length} areas. Each listing is manually checked against the studio's own site. Berlin Studio Map is a free directory with no booking system or commission: contact each studio directly. Short index: ${base}/llms.txt. Structured data: ${base}/studios.json.`);
  lines.push('');
  lines.push('Rates are as listed on each studio's own site when checked and can change. Confirm with the studio before booking.');
  lines.push('');
  for (const s of list) {
    lines.push(`## ${s.name}`);
    lines.push(`- Page: ${base}/studios/${slugify(s)}/`);
    lines.push(`- Location: ${s.neighbourhood === s.area ? `${s.area}, Berlin` : `${s.neighbourhood}, ${s.area} Berlin`} (area page: ${base}/areas/${areaSlug(s.area)}/)`);
    lines.push(`- Coordinates: ${s.lat}, ${s.lng}`);
    lines.push(`- Rate: ${s.rate}`);
    if (s.sqm) lines.push(`- Size: ${s.sqm} m²`);
    if (s.ceil) lines.push(`- Ceiling height: ${s.ceil}`);
    if (s.facing) lines.push(`- Light / style: ${s.facing}`);
    lines.push(`- Daylight: ${yn(s.daylight)} · Blackout: ${yn(s.blackout)} · Infinity cyclorama: ${yn(s.ciclorama)} · Drive-in access: ${yn(s.driveIn)}`);
    lines.push(`- Kitchen: ${yn(s.kitchen)} · Makeup area: ${yn(s.makeup)} · Green room: ${yn(s.greenRoom)} · WiFi: ${yn(s.wifi)}`);
    if (s.web) lines.push(`- Website: ${s.web.startsWith('http') ? s.web : `https://${s.web}`}`);
    if (s.extras?.length) {
      lines.push('- Notes:');
      for (const e of s.extras) lines.push(`  - ${e}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
