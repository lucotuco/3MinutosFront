import * as Calendar from "expo-calendar";

export type UpcomingCalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  calendarTitle: string;
  allDay: boolean;
};

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isValidDate(value: unknown) {
  const date = new Date(String(value));
  return !Number.isNaN(date.getTime());
}

export async function getUpcomingCalendarEvents(
  daysAhead = 7,
  maxEvents = 4
): Promise<UpcomingCalendarEvent[] | null> {
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();

    if (permission.status !== "granted") {
      return null;
    }

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );

    const readableCalendars = calendars.filter((calendar) => {
      return calendar.allowsModifications !== false || calendar.source;
    });

    const calendarIds = readableCalendars
      .map((calendar) => calendar.id)
      .filter(Boolean);

    if (calendarIds.length === 0) {
      return [];
    }

    const now = new Date();
    const endDate = addDays(now, daysAhead);

    const events = await Calendar.getEventsAsync(calendarIds, now, endDate);

    const calendarTitleById = new Map(
      calendars.map((calendar) => [calendar.id, calendar.title || "Calendario"])
    );

    return events
      .filter((event) => event.title)
      .filter((event) => isValidDate(event.startDate))
      .filter((event) => new Date(String(event.startDate)).getTime() >= now.getTime())
      .sort((a, b) => {
        return (
          new Date(String(a.startDate)).getTime() -
          new Date(String(b.startDate)).getTime()
        );
      })
      .slice(0, maxEvents)
      .map((event) => ({
        id: String(event.id),
        title: String(event.title),
        startDate: String(event.startDate),
        endDate: String(event.endDate),
        calendarTitle: calendarTitleById.get(event.calendarId) || "Calendario",
        allDay: Boolean(event.allDay),
      }));
  } catch {
    return null;
  }
}