// WhatsApp/iMessage/Telegram vb. link önizleme botları (iMessage
// "facebookexternalhit … Twitterbot" ile gelir). Arama motoru botları BİLEREK
// yok: onlara kart sayfası verilirse kurumsal site/SEO bozulur. proxy.ts de
// kullandığı için bu dosya bağımlılıksız kalmalı.
const PREVIEW_BOT =
  /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|Pinterestbot|redditbot|Viber|vkShare|Embedly/i;

export function isLinkPreviewBot(userAgent: string | null) {
  return Boolean(userAgent && PREVIEW_BOT.test(userAgent));
}
