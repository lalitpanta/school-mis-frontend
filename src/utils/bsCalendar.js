export const BS_DATA = {
  2079: [31,32,31,32,31,30,30,29,30,29,30,30],
  2080: [31,31,32,32,31,30,30,30,29,29,30,30],
  2081: [31,31,32,32,31,30,30,30,29,30,29,31],
  2082: [30,32,31,32,31,30,30,30,29,30,30,30],
  2083: [31,31,32,31,31,31,30,29,30,29,30,30],
  2084: [31,31,32,32,31,30,30,29,30,29,30,30],
  2085: [31,32,31,32,31,30,30,29,30,29,30,30],
  2086: [31,31,32,31,31,30,30,29,30,30,29,31],
};

// Baisakh 1 of each BS year = AD date
export const BS_YEAR_START_AD = {
  2079: new Date(2022,3,14),
  2080: new Date(2023,3,14),
  2081: new Date(2024,3,13), // Baisakh 1 2081 = Apr 13 2024
  2082: new Date(2025,3,14),
  2083: new Date(2026,3,14),
  2084: new Date(2027,3,14),
  2085: new Date(2028,3,13),
  2086: new Date(2029,3,14),
};

export const BS_MONTHS = [
  'Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin',
  'Kartik','Mangsir','Poush','Magh','Falgun','Chaitra',
];

const DAY_MS = 86400000;

export function bsToAd(bsYear, bsMonth, bsDay) {
  const data  = BS_DATA[bsYear];
  const start = BS_YEAR_START_AD[bsYear];
  if (!data || !start) return null;
  let offset = bsDay - 1;
  for (let m = 0; m < bsMonth - 1; m++) offset += data[m];
  return new Date(start.getTime() + offset * DAY_MS);
}

export function adToBs(adDate) {
  const d = new Date(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  const years = Object.keys(BS_YEAR_START_AD).map(Number).sort();
  for (let i = 0; i < years.length - 1; i++) {
    const yr   = years[i];
    const s    = BS_YEAR_START_AD[yr];
    const next = BS_YEAR_START_AD[years[i+1]];
    if (d >= s && d < next) {
      let rem  = Math.round((d - s) / DAY_MS);
      const yd = BS_DATA[yr];
      let mo   = 0;
      while (mo < 12 && rem >= yd[mo]) { rem -= yd[mo]; mo++; }
      return { year: yr, month: mo + 1, day: rem + 1 };
    }
  }
  return null;
}

export function getTodayBs() { return adToBs(new Date()); }

export function getDaysInBsMonth(bsYear, bsMonth) {
  return BS_DATA[bsYear]?.[bsMonth - 1] ?? 30;
}

export function prevBsMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function nextBsMonth(year, month) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}
