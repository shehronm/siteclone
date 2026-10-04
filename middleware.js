import { next } from '@vercel/functions';

export const config = {
  runtime: 'nodejs',
  matcher: ['/', '/ru'],
};

// This is the site's configured language group, not a claim about membership.
const RUSSIAN_COUNTRIES = new Set(['AM', 'AZ', 'BY', 'KZ', 'KG', 'MD', 'RU', 'TJ', 'TM', 'UZ']);
const LANGUAGE_COOKIE = 'mirwink_lang';
const CRAWLER = /bot\b|crawler|spider|slurp|yandex|google-inspectiontool|googleother|google-extended|mediapartners-google|bingpreview|facebookexternalhit/i;
const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

function readLanguageCookie(header) {
  for (const part of (header || '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === LANGUAGE_COOKIE) {
      const language = value.join('=');
      return language === 'en' || language === 'ru' ? language : null;
    }
  }
  return null;
}

function languageCookie(language, secure) {
  return `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
}

function redirect(url, pathname, headers) {
  // Relative URLs cannot redirect to a supplied Host; all query parameters stay.
  return new Response(null, {
    status: 307,
    headers: { ...PRIVATE_HEADERS, ...headers, Location: `${pathname}${url.search}` },
  });
}

export default function middleware(request) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || !['/', '/ru'].includes(url.pathname)) {
    return next();
  }

  // Crawlers discover the two stable, canonical language URLs, with no guessing.
  if (CRAWLER.test(request.headers.get('user-agent') || '')) {
    return next(url.pathname === '/' ? { headers: PRIVATE_HEADERS } : undefined);
  }

  const explicitLanguage = url.searchParams.get('lang');
  if (explicitLanguage === 'en' || explicitLanguage === 'ru') {
    const pathname = explicitLanguage === 'ru' ? '/ru' : '/';
    const headers = {
      ...PRIVATE_HEADERS,
      'Set-Cookie': languageCookie(explicitLanguage, url.protocol === 'https:'),
    };
    // Keep ?lang= in the URL: manual selection also works when cookies are off.
    return url.pathname === pathname ? next({ headers }) : redirect(url, pathname, headers);
  }

  // A shared /ru link is always Russian, including for visitors outside this group.
  if (url.pathname === '/ru') return next();

  const preference = readLanguageCookie(request.headers.get('cookie'));
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const language = preference || (RUSSIAN_COUNTRIES.has(country) ? 'ru' : 'en');
  return language === 'ru' ? redirect(url, '/ru') : next({ headers: PRIVATE_HEADERS });
}
