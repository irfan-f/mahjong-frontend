/** Canonical production origin. */
export const SITE_URL = 'https://mahjong.irfan-f.com';

export const SITE_NAME = 'Mahjong with Friends';

export const DEFAULT_DESCRIPTION =
  'Play Mahjong with Friends online. Create a lobby, share the code, and start a game.';

/** Absolute URL for Open Graph / Twitter card image (1200×630 PNG in public/). */
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

/** Hash-router path prefix for shareable in-app URLs. */
export const HASH_BASE = '/#';

export function siteUrl(hashPath = ''): string {
  if (!hashPath || hashPath === '/') return `${SITE_URL}/`;
  const path = hashPath.startsWith('/') ? hashPath : `/${hashPath}`;
  return `${SITE_URL}${HASH_BASE}${path}`;
}
