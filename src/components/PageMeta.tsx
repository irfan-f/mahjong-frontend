import { Helmet } from 'react-helmet-async';
import { DEFAULT_DESCRIPTION, OG_IMAGE_URL, SITE_NAME, SITE_URL, siteUrl } from '../data/site';

export type PageMetaProps = {
  /** Page segment after the site name in `<title>`. Omit for home. */
  title?: string;
  description?: string;
  /** Hash route path, e.g. `/lobby/abc` or `/`. */
  path?: string;
  /** When true, adds `noindex` for in-session views crawlers should not rank. */
  noIndex?: boolean;
};

export function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noIndex = false,
}: PageMetaProps) {
  const documentTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const canonical = path === '/' ? `${SITE_URL}/` : siteUrl(path);

  return (
    <Helmet>
      <title>{documentTitle}</title>
      <link rel="canonical" href={canonical} />
      <meta name="description" content={description} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — play Mahjong online with friends`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={documentTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} — play Mahjong online with friends`} />
    </Helmet>
  );
}
