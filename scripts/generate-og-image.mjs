#!/usr/bin/env node
/**
 * Renders public/og-image.svg -> public/og-image.png
 *
 * Tile SVGs referenced via <image href="tiles/..."> are inlined as base64
 * data URIs before passing to resvg, which does not load external files.
 *
 * @see https://ogp.me/ -- 1200x630 recommended for og:image
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const svgSrc = join(publicDir, 'og-image.svg');
const svgTmp = join(publicDir, 'og-image-render.svg');
const png = join(publicDir, 'og-image.png');

// Inline any tile/<file>.svg href as a base64 data URI.
let svg = readFileSync(svgSrc, 'utf8');
svg = svg.replace(/href="(tiles\/[^"]+\.svg)"/g, (_match, relPath) => {
  const absPath = join(publicDir, relPath);
  const data = readFileSync(absPath);
  const b64 = data.toString('base64');
  return `href="data:image/svg+xml;base64,${b64}"`;
});

writeFileSync(svgTmp, svg, 'utf8');

try {
  execFileSync('npx', ['--yes', '@resvg/resvg-js-cli', svgTmp, png], { stdio: 'inherit', cwd: root });
} finally {
  unlinkSync(svgTmp);
}

const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', png], { encoding: 'utf8' });
if (!dims.includes(`pixelWidth: ${OG_WIDTH}`) || !dims.includes(`pixelHeight: ${OG_HEIGHT}`)) {
  console.error('Unexpected dimensions (expected 1200x630):\n', dims);
  process.exit(1);
}

const size = execFileSync('wc', ['-c', png], { encoding: 'utf8' }).trim().split(/\s+/)[0];
console.log(`Wrote ${png} (${OG_WIDTH}x${OG_HEIGHT}, ${size} bytes)`);
