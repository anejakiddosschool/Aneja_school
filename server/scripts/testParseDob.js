// Quick sanity test for parseDob logic (kept in sync with the helper in
// server/controllers/studentController.js). Not a permanent test file.
const MONTH_NAMES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

const parseDob = (value) => {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number" && isFinite(value) && value > 0) {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  // Excel serials that arrived as text (plausible range 1954-2064)
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = parseFloat(raw);
    if (serial >= 20000 && serial <= 60000) {
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  // ISO: YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  let m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d.getTime()) || d.getUTCMonth() !== +m[2] - 1 ? null : d;
  }

  // DD<sep>MM(M)<sep>YYYY with - / . or space separators
  m = raw.match(/^(\d{1,2})[-/. ]([A-Za-z]{3,9}|\d{1,2})[-/. ](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthRaw = m[2].toLowerCase();
    const month = /^\d+$/.test(monthRaw)
      ? parseInt(monthRaw, 10) - 1
      : MONTH_NAMES[monthRaw.slice(0, 4)] ?? MONTH_NAMES[monthRaw.slice(0, 3)];
    if (month === undefined || month < 0 || month > 11) return null;
    let year = parseInt(m[3], 10);
    if (year < 100) year += year <= 30 ? 2000 : 1900;
    if (day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month, day));
    return isNaN(d.getTime()) || d.getUTCDate() !== day ? null : d;
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const cases = [
  // [input, expected ISO or null]
  ["15-05-2010", "2010-05-15"],
  ["15/05/2010", "2010-05-15"],
  ["15.05.2010", "2010-05-15"],
  ["15 05 2010", "2010-05-15"],
  ["5-5-2010", "2010-05-05"],
  ["05-1-2012", "2012-01-05"],
  ["15-May-2010", "2010-05-15"],
  ["15-September-2010", "2010-09-15"],
  ["2010-05-15", "2010-05-15"],
  [40313, "2010-05-15"],
  ["40313", "2010-05-15"],
  [new Date(Date.UTC(2010, 4, 15)), "2010-05-15"],
  ["31-02-2010", null],
  ["abc", null],
  ["", null],
  [null, null],
  [undefined, null],
  ["2010-13-01", null],
];

let pass = 0, fail = 0;
for (const [input, expected] of cases) {
  const d = parseDob(input);
  const out = d ? d.toISOString().split("T")[0] : null;
  if (out === expected) {
    pass++;
  } else {
    fail++;
    console.log(
      `FAIL: ${String(input)} -> ${out} (expected: ${expected})`
    );
  }
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
