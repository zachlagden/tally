const MIN_CONTRAST_ON_BLACK = 4.5;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

function parseHex(hex: string): [number, number, number] | undefined {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return undefined;
  const value = parseInt(match[1]!, 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

export function contrastOnBlack(hex: string): number {
  const rgb = parseHex(hex);
  return rgb ? (luminance(rgb) + 0.05) / 0.05 : 0;
}

export function readableColor(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb || contrastOnBlack(hex) >= MIN_CONTRAST_ON_BLACK) return hex;
  for (let step = 1; step <= 100; step++) {
    const t = step / 100;
    const candidate = toHex(rgb.map((c) => c + (255 - c) * t) as [number, number, number]);
    if (contrastOnBlack(candidate) >= MIN_CONTRAST_ON_BLACK) return candidate;
  }
  return "#ffffff";
}
