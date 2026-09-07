import { adToBs } from "./bsCalendar";

export const ACCOUNTING_CALENDARS = ["AD", "BS"];

export const isAccountingCalendar = (value) =>
  ACCOUNTING_CALENDARS.includes(value);

export const formatAccountingDate = (isoDate, calendarType = "AD") => {
  if (!isoDate) return "-";
  if (calendarType === "AD") return isoDate;
  const bs = adToBs(new Date(`${isoDate}T00:00:00`));
  return bs
    ? `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`
    : isoDate;
};
