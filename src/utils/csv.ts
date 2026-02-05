export function exportToCsv(
  filename: string,
  rows: Record<string, string | number | null | undefined>[],
) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) => {
    const stringValue =
      value === null || value === undefined ? "" : String(value);
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const csv = [headers.map(escape).join(",")]
    .concat(
      rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
