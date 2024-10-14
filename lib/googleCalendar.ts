// lib/googleCalendar.ts

export interface ShiftDetail {
  start: string; // ISO形式の開始時間
  end: string; // ISO形式の終了時間
  hours: number; // 勤務時間
}

export interface EmployeeHourDetail {
  totalHours: number;
  details: ShiftDetail[];
}

export const getTotalHours = async (
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarIds: string[],
): Promise<{ [name: string]: EmployeeHourDetail }> => {
  const fetchPromises = calendarIds.map((calendarId) =>
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${
        encodeURIComponent(calendarId)
      }/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      },
    ).then((response) => response.json())
  );

  const eventsArrays = await Promise.all(fetchPromises);

  const hoursByName: { [name: string]: EmployeeHourDetail } = {};

  eventsArrays.forEach((events) => {
    events.items.forEach((event: any) => {
      const name = event.summary; // イベントのタイトルを従業員名と仮定
      if (name && name.includes("募集")) {
        return;
      }
      const start = event.start.dateTime || event.start.date;
      const end = event.end.dateTime || event.end.date;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = (endDate.getTime() - startDate.getTime()) /
        (1000 * 60 * 60); // 時間単位

      if (!hoursByName[name]) {
        hoursByName[name] = { totalHours: 0, details: [] };
      }

      hoursByName[name].totalHours += duration;
      hoursByName[name].details.push({ start, end, hours: duration });
    });
  });

  return hoursByName;
};
