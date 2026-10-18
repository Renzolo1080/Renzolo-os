/** Where the app lives. Every "start" button on the website goes there,
 * tagged so the app can see which page sent the founder. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://app.renzoloenterprises.com").replace(/\/+$/, "");

export function appLink(path: string, campaign: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${APP_URL}${path}${sep}utm_source=website&utm_medium=referral&utm_campaign=${campaign}`;
}

export const STAGES = ["Discover", "Validate", "Build", "Acquire", "Prepare", "Fund", "Scale", "Exit"];

/** WhatsApp chat link (e.g. https://wa.me/27XXXXXXXXX). The floating button
 * and footer link appear only when NEXT_PUBLIC_WHATSAPP_URL is set. */
export const WHATSAPP_URL = /^https:\/\/wa\.me\/\d+/.test(process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "") ? process.env.NEXT_PUBLIC_WHATSAPP_URL! : null;
