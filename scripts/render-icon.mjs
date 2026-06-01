/**
 * Renders logo.svg at multiple sizes using Chrome (via puppeteer-core),
 * so Google Fonts / @import loads correctly. Outputs PNG files that
 * Tauri uses as app icons.
 */
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'src', 'assets', 'logo.svg');
const ICONS_DIR = path.join(ROOT, 'src-tauri', 'icons');

// Sizes needed by Tauri for Windows desktop icons
const SIZES = [32, 64, 128, 256, 512];

const svgContent = fs.readFileSync(SVG_PATH, 'utf8');
// Inline the SVG into an HTML page so Chrome renders it with full font support
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: transparent; }
  svg { display: block; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' }); // wait for Google Fonts

for (const size of SIZES) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });

  // Resize the SVG to match viewport
  await page.evaluate((s) => {
    const svg = document.querySelector('svg');
    svg.setAttribute('width', s);
    svg.setAttribute('height', s);
  }, size);

  const outPath = path.join(ICONS_DIR, `${size}x${size}.png`);
  await page.screenshot({ path: outPath, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`✓ ${size}x${size}.png`);
}

await browser.close();

// Copy key sizes to names Tauri expects
fs.copyFileSync(path.join(ICONS_DIR, '32x32.png'),   path.join(ICONS_DIR, '32x32.png'));
fs.copyFileSync(path.join(ICONS_DIR, '128x128.png'), path.join(ICONS_DIR, '128x128.png'));
fs.copyFileSync(path.join(ICONS_DIR, '256x256.png'), path.join(ICONS_DIR, '128x128@2x.png'));
fs.copyFileSync(path.join(ICONS_DIR, '512x512.png'), path.join(ICONS_DIR, 'icon.png'));
console.log('✓ Copied alias sizes');
console.log('Done! Re-run: npx @tauri-apps/cli icon src-tauri/icons/icon.png to regenerate ICO/ICNS from the new PNG.');
