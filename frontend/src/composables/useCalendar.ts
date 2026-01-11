import type { WeddingConfig } from "@/types";

function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateGoogleCalendarUrl(config: WeddingConfig): string {
  const { event, couple } = config;
  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000); // 5 hours duration

  const title = `Majlis Perkahwinan ${couple.bride.nickname} & ${couple.groom.nickname}`;
  const details = `Anda dijemput ke majlis perkahwinan kami.\n\nTempat: ${event.venue.name}\nAlamat: ${event.venue.address}`;

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", title);
  googleUrl.searchParams.set(
    "dates",
    `${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}`
  );
  googleUrl.searchParams.set("details", details);
  googleUrl.searchParams.set("location", event.venue.address);

  return googleUrl.toString();
}

export function generateIcsContent(config: WeddingConfig): string {
  const { event, couple } = config;
  const startDate = event.date;
  const endDate = new Date(startDate.getTime() + 5 * 60 * 60 * 1000);

  const title = `Majlis Perkahwinan ${couple.bride.nickname} & ${couple.groom.nickname}`;

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

export function downloadIcsFile(config: WeddingConfig): void {
  const content = generateIcsContent(config);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wedding-${config.couple.bride.nickname}-${config.couple.groom.nickname}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
