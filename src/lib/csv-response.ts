// CSV（UTF-8 BOM付き。Excelで文字化けしない）のダウンロード応答
const escape = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

export function toCsv(header: string[], rows: unknown[][]): string {
  return '﻿' + [header, ...rows].map((r) => r.map(escape).join(',')).join('\r\n') + '\r\n';
}

export function toCsvResponse(filename: string, header: string[], rows: unknown[][]): Response {
  return new Response(toCsv(header, rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
