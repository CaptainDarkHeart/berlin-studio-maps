function deumlaut(s: string) {
  return s
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue');
}

function toSlug(s: string) {
  return deumlaut(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function slugify(s: { name: string; neighbourhood: string }) {
  return toSlug(s.name) + '-' + toSlug(s.neighbourhood);
}

export function areaSlug(a: string) {
  return toSlug(a);
}
