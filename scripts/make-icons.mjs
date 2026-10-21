// Renders the app icon, Android adaptive layers, splash mark and favicon from one SVG lotus node.
// Usage: PLAYWRIGHT=/path/to/playwright/index.mjs CHROME=/path/to/chromium node scripts/make-icons.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.resolve(here, '../assets');
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');

const MIDNIGHT = '#1C2140';
const LAVENDER = '#B9A8E0';
const LAVENDER_DEEP = '#9C88CF';
const MIST = '#F2F0F6';

// Large marks use slimmer, separated petals so they read as the mat's spike cluster, not a cartoon flower.
const petals = (fill, big) =>
  [0, 60, 120, 180, 240, 300]
    .map((d) => (big ? `<ellipse cx="0" cy="-6.1" rx="2.15" ry="3.5" fill="${fill}" transform="rotate(${d})"/>` : `<ellipse cx="0" cy="-5.4" rx="2.9" ry="3.9" fill="${fill}" transform="rotate(${d})"/>`))
    .join('');
const lotus = (cx, cy, scale, fill, center, big = scale > 8) =>
  `<g transform="translate(${cx} ${cy}) scale(${scale})">${petals(fill, big)}<circle r="${big ? 1.7 : 1.9}" fill="${center ?? fill}"/></g>`;

// A faint mat texture behind the big node on the full-bleed icon.
function texture(size, fill) {
  let out = '';
  const gap = size / 7;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * gap + (row % 2 ? gap / 2 : 0);
      const y = row * gap * 0.9;
      out += lotus(x, y, size / 260, fill);
    }
  }
  return out;
}

const svg = (size, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`;

const files = [
  // Full icon (iOS / store / legacy Android)
  ['icon.png', 1024, svg(1024, texture(1024, '#252B52') + lotus(512, 512, 28, LAVENDER, MIST), MIDNIGHT)],
  // Adaptive icon foreground: keep the mark inside the central 66% safe zone
  ['android-icon-foreground.png', 1024, svg(1024, lotus(512, 512, 22, LAVENDER, MIST))],
  ['android-icon-monochrome.png', 1024, svg(1024, lotus(512, 512, 22, '#FFFFFF'))],
  // Splash mark (shown centred on midnight)
  ['splash-icon.png', 512, svg(512, lotus(256, 256, 18, LAVENDER, MIST))],
  ['favicon.png', 96, svg(96, lotus(48, 48, 3.6, LAVENDER_DEEP, MIDNIGHT))],
];

const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const page = await browser.newPage();
for (const [name, size, markup] of files) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await page.locator('svg').screenshot({ path: path.join(assets, name), omitBackground: true });
  console.log('wrote', name);
}
await browser.close();
