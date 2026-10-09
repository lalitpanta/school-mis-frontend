const normalizeHeader = (header, index) =>
  header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_") || `column_${index}`;

export const parseRecordCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted value.");
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  if (rows.length < 2) {
    throw new Error("CSV must contain a header and at least one data row.");
  }

  const headers = rows[0].map(normalizeHeader);
  if (new Set(headers).size !== headers.length) {
    throw new Error("CSV contains duplicate column headers.");
  }
  return rows.slice(1).map((cells, index) => {
    if (cells.length > headers.length) {
      throw new Error(`CSV row ${index + 2} has more values than the header.`);
    }
    const record = {};
    headers.forEach((header, column) => {
      record[header] = (cells[column] || "").trim();
    });
    return { rowNumber: index + 2, values: record };
  });
};

const escapeCsvCell = (value) => {
  const text = Array.isArray(value)
    ? value.join("; ")
    : value === null || value === undefined
      ? ""
      : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadRecordCsv = (filename, columns, records) => {
  const content = [
    columns.map((column) => escapeCsvCell(column.label)).join(","),
    ...records.map((record) =>
      columns
        .map((column) => escapeCsvCell(column.value(record)))
        .join(","),
    ),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
