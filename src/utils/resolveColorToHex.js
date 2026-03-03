const COLOR_MAP = {
  // neutrals
  black: '#111111',
  white: '#ffffff',
  ivory: '#f8f1e1',
  cream: '#f6ebd5',
  beige: '#e8d8b7',
  sand: '#d8c3a5',
  tan: '#d2b48c',

  // greys / heathers
  grey: '#9e9e9e',
  gray: '#9e9e9e',
  'sport grey': '#9e9e9e',
  'sport gray': '#9e9e9e',
  'dark heather': '#5f6368',
  heather: '#8b8f94',
  'heather grey': '#8a8a8a',
  charcoal: '#424242',

  // greens
  'forest green': '#1b5e20',
  'irish green': '#0b8f3a',
  'military green': '#4b5320',
  olive: '#556b2f',

  // blues
  navy: '#0b1f3a',
  royal: '#1f4fbf',
  'heather royal': '#3b5bdc',
  'sky blue': '#6ec6ff',

  // reds/pinks
  red: '#c62828',
  maroon: '#7b1e1e',
  burgundy: '#6d1a1a',
  pink: '#ec407a',

  // others
  purple: '#6a1b9a',
  yellow: '#fbc02d',
  gold: '#d4af37',
  orange: '#fb8c00',
  brown: '#6d4c41',
};

function compact(value) {
  return String(value || '').replace(/\s+/g, '');
}

const COLOR_LOOKUP = Object.entries(COLOR_MAP).reduce((acc, [key, value]) => {
  const normalizedKey = normalizeColorName(key);
  const compactKey = compact(normalizedKey);
  acc[normalizedKey] = value;
  acc[compactKey] = value;
  return acc;
}, {});

export function normalizeColorName(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeColorName(input) {
  const normalized = normalizeColorName(input);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const forms = new Set(tokens);
  forms.add(compact(normalized));

  for (let i = 0; i < tokens.length; i += 1) {
    let combined = '';
    for (let j = i; j < tokens.length; j += 1) {
      combined += tokens[j];
      if (combined) forms.add(combined);
    }
  }

  return Array.from(forms);
}

function hasAny(haystack, values) {
  return values.some((value) => haystack.includes(value));
}

function detectKeywordHex(normalized, tokens) {
  const isDark = hasAny(tokens, ['dark', 'deep']);
  const isLight = hasAny(tokens, ['light', 'soft', 'pale']);
  const isHeather = hasAny(tokens, ['heather', 'speckle']);

  if (isHeather) {
    if (isDark) return '#5f6368';
    if (isLight) return '#aab0b6';
    return '#7d8288';
  }

  if (normalized.includes('black')) return '#111111';
  if (normalized.includes('white')) return '#ffffff';
  if (normalized.includes('navy')) return '#0b1f3a';
  if (normalized.includes('olive')) return '#556b2f';
  if (normalized.includes('forest')) return '#1b5e20';
  if (normalized.includes('military')) return '#4b5320';
  if (normalized.includes('irish')) return '#0b8f3a';
  if (normalized.includes('royal')) return '#1f4fbf';

  if (normalized.includes('green')) {
    if (isDark) return '#1b5e20';
    if (isLight) return '#66bb6a';
    return '#2e7d32';
  }

  if (normalized.includes('blue')) {
    if (isDark) return '#0d47a1';
    if (isLight) return '#64b5f6';
    return '#1976d2';
  }

  if (normalized.includes('red')) {
    if (isDark) return '#8e0000';
    if (isLight) return '#ef5350';
    return '#c62828';
  }

  if (normalized.includes('grey') || normalized.includes('gray')) {
    if (isDark) return '#616161';
    if (isLight) return '#bdbdbd';
    return '#9e9e9e';
  }

  return null;
}

export function resolveColorToHex(optionName) {
  const raw = String(optionName || '').trim();
  if (!raw) return null;

  const hexMatch = raw.match(/(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/);
  if (hexMatch && hexMatch[1]) {
    return hexMatch[1].toLowerCase();
  }

  const normalized = normalizeColorName(raw);
  if (!normalized) return null;

  const compactName = compact(normalized);
  if (COLOR_LOOKUP[normalized]) return COLOR_LOOKUP[normalized];
  if (COLOR_LOOKUP[compactName]) return COLOR_LOOKUP[compactName];

  const tokenForms = tokenizeColorName(normalized);
  for (const token of tokenForms) {
    if (COLOR_LOOKUP[token]) {
      return COLOR_LOOKUP[token];
    }
  }

  return detectKeywordHex(normalized, tokenForms);
}

export function isProbablyColorAttribute(attributeName) {
  const raw = String(attributeName || '').trim().toLowerCase();
  if (!raw) return false;

  const normalized = normalizeColorName(attributeName);
  const compactName = compact(normalized);

  return (
    raw.includes('color') ||
    raw.includes('colour') ||
    raw.startsWith('pa_color') ||
    raw.startsWith('pa_colour') ||
    normalized.includes('color') ||
    normalized.includes('colour') ||
    compactName.startsWith('pacolor') ||
    compactName.startsWith('pacolour')
  );
}

