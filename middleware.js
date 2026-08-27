const BOT_UA = /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot|zalo|whatsapp|telegrambot|slackbot|discordbot|oai-searchbot|perplexitybot|applebot/i;

export const config = {
  matcher: ['/bien/:path*', '/bai-viet/:path*'],
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return;

  const apiBase = process.env.VITE_API_URL;
  if (!apiBase) return;

  const { pathname } = new URL(request.url);
  const renderPath = pathname.replace('/bien/', '/render/bien/').replace('/bai-viet/', '/render/bai-viet/');

  try {
    const upstream = await fetch(apiBase + renderPath, { headers: { accept: 'text/html' } });
    if (!upstream.ok) return;
    const html = await upstream.text();
    return new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  } catch {
    return;
  }
}
