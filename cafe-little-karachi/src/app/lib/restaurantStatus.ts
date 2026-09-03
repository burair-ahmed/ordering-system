export function toKarachi(now = new Date()): Date {
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
}

export function isOpenAt(karachiDate: Date = toKarachi()): boolean {
  // Allow test override via localStorage if present
  if (typeof window !== "undefined") {
    const override = localStorage.getItem("overrideRestaurantOpen");
    if (override === "true") return true;
    if (override === "false") return false;
  }

  let day = karachiDate.getDay();
  const h = karachiDate.getHours();
  const m = karachiDate.getMinutes();
  const minutes = h * 60 + m;

  // Early morning hours (00:00 to 03:00) count towards previous day's shift
  const isEarlyMorning = minutes < 180;
  if (isEarlyMorning) {
    day = (day + 6) % 7;
  }

  const openStart = 18 * 60 + 30; // 6:30 PM

  // Weekend nights (Fri, Sat, Sun) close at 2:45 AM; Weekdays close at 12:45 AM
  const weekendDays = [5, 6, 0];
  const cutoff = weekendDays.includes(day)
    ? 2 * 60 + 45 // 2:45 AM
    : 0 * 60 + 45; // 12:45 AM

  return minutes >= openStart || minutes < cutoff;
}

export function getNextOpenAndLastClose(karachiNow: Date = toKarachi()) {
  const openStart = new Date(karachiNow);
  openStart.setHours(18, 30, 0, 0);

  const nextOpen = new Date(openStart);
  if (
    karachiNow.getHours() > 18 ||
    (karachiNow.getHours() === 18 && karachiNow.getMinutes() >= 30)
  ) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }

  const lastClose = new Date(karachiNow);
  lastClose.setHours(2, 0, 0, 0);

  if (karachiNow.getHours() < 2) {
    lastClose.setDate(lastClose.getDate() - 1);
  }
  if (lastClose.getTime() > karachiNow.getTime()) {
    lastClose.setDate(lastClose.getDate() - 1);
  }

  return { nextOpen, lastClose };
}
