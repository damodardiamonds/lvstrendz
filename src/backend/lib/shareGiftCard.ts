/**
 * Share Gift Card via WhatsApp URL scheme (no API keys required)
 */
export function shareGiftCardWhatsApp({
  code,
  senderName,
  value,
  recipientPhone,
}: {
  code: string;
  senderName: string;
  value: number;
  recipientPhone?: string;
}) {
  const formattedValue = value.toLocaleString("en-IN");
  const sender = senderName ? senderName : "a friend";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lvstrendz.vercel.app";

  const text =
    `🎁 *You've received a ₹${formattedValue} Gift Card from ${sender}!*\n\n` +
    `Use this code at checkout on LV's Trendz:\n\n` +
    `🎟️ Code: *${code}*\n` +
    `💰 Value: ₹${formattedValue}\n\n` +
    `Shop now 👉 ${appUrl}\n\n` +
    `_Powered by LV's Trendz_`;

  const message = encodeURIComponent(text);

  let cleanPhone = recipientPhone ? recipientPhone.replace(/\D/g, "") : "";
  if (cleanPhone && !cleanPhone.startsWith("91") && cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
    : `https://api.whatsapp.com/send?text=${message}`;

  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}

/**
 * Native Mobile Share API wrapper with WhatsApp fallback
 */
export async function nativeShare({
  code,
  senderName,
  value,
}: {
  code: string;
  senderName: string;
  value: number;
}) {
  const formattedValue = value.toLocaleString("en-IN");
  const sender = senderName ? senderName : "a friend";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lvstrendz.vercel.app";

  const shareData = {
    title: "🎁 Gift Card from LV's Trendz",
    text: `${sender} sent you a ₹${formattedValue} Gift Card!\n\nCode: ${code}\nShop now: ${appUrl}`,
    url: appUrl,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.warn("Native share failed, falling back to WhatsApp:", e);
        shareGiftCardWhatsApp({ code, senderName, value });
      }
      return false;
    }
  } else {
    shareGiftCardWhatsApp({ code, senderName, value });
    return true;
  }
}
