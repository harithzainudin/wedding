import type { WeddingConfig } from "@/types";
import type { DisplayNameOrder } from "@/types/weddingDetails";

function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Helper to get ordered couple names based on display order
function getOrderedNicknames(
  couple: WeddingConfig["couple"],
  displayNameOrder: DisplayNameOrder = "bride_first",
): { first: string; second: string } {
  if (displayNameOrder === "groom_first") {
    return { first: couple.groom.nickname, second: couple.bride.nickname };
  }
  return { first: couple.bride.nickname, second: couple.groom.nickname };
}

export function generateGoogleCalendarUrl(
  config: WeddingConfig,
  displayNameOrder: DisplayNameOrder = "bride_first",
): string {
  const { event, couple } = config;
  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000); // 5 hours duration

  const ordered = getOrderedNicknames(couple, displayNameOrder);
  const title = `Majlis Perkahwinan ${ordered.first} & ${ordered.second}`;
  const details = `Anda dijemput ke majlis perkahwinan kami.\n\nTempat: ${event.venue.name}\nAlamat: ${event.venue.address}`;

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", title);
  googleUrl.searchParams.set(
    "dates",
    `${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}`,
  );
  googleUrl.searchParams.set("details", details);
  googleUrl.searchParams.set("location", event.venue.address);

  return googleUrl.toString();
}

export function generateIcsContent(
  config: WeddingConfig,
  displayNameOrder: DisplayNameOrder = "bride_first",
): string {
  const { event, couple } = config;
  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);

  const ordered = getOrderedNicknames(couple, displayNameOrder);
  const title = `Majlis Perkahwinan ${ordered.first} & ${ordered.second}`;

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Wedding Invitation//EN
BEGIN:VEVENT
DTSTART:${formatDateForCalendar(startDate)}
DTEND:${formatDateForCalendar(endDate)}
SUMMARY:${title}
LOCATION:${event.venue.address}
DESCRIPTION:Anda dijemput ke majlis perkahwinan kami.
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

export function downloadIcsFile(
  config: WeddingConfig,
  displayNameOrder: DisplayNameOrder = "bride_first",
): void {
  const content = generateIcsContent(config, displayNameOrder);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const ordered = getOrderedNicknames(config.couple, displayNameOrder);
  link.download = `wedding-${ordered.first}-${ordered.second}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
