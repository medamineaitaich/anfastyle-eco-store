const COLOR_NAME_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#9333ea',
  pink: '#ec4899',
  gray: '#6b7280',
  grey: '#6b7280',
  brown: '#7c4a2d',
  navy: '#1e3a8a',
  beige: '#d6c4a0',
  khaki: '#b9aa7b',
  olive: '#556b2f',
  maroon: '#7f1d1d',
  teal: '#0f766e',
  cyan: '#06b6d4',
  gold: '#ca8a04',
  silver: '#9ca3af',
};

export function colorToCss(option: string): string | null {
  const value = String(option || '').trim();
  if (!value) return null;

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value;
  }

  if (/^(rgb|rgba|hsl|hsla)\(/i.test(value)) {
    return value;
  }

  const normalized = value.toLowerCase().replace(/\s+/g, '');
  if (COLOR_NAME_MAP[normalized]) {
    return COLOR_NAME_MAP[normalized];
  }

  if (typeof CSS !== 'undefined' && CSS.supports('color', value)) {
    return value;
  }

  return null;
}
