'use client';
// 帳票・会計連携: 固定帳票12種のうち RPT-01 と RPT-06（IF-ACC-01）をCSVで出力。他の帳票は範囲外（README参照）
import { useState } from 'react';
import { useMe } from '@/components/app-shell';
import { Card, Field, Input, Message, PageHeader } from '@/components/ui-primitives';

const REPORTS = [
  ['daily-trades', 'RPT-01 業務日ごとの日次取引集計', '当日の全取引（相対・せり・赤黒）を明細で出力'],
  ['accounting', 'RPT-06 会計照合用出力（IF-ACC-01）', 'ロック済み業務日のみ。参加者別の総額・税額・行ステータス・バッチコード'],
];

export default function ReportsPage() {
  const { me, can } = useMe();
  const [day, setDay] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const current = day || me?.businessDay || '';

  // ダウンロード前にAPIの応答を確認し、エラー（ロック前など）は画面に表示する
  async function download(key: string) {
    setMessage(null);
    const res = await fetch(`/api/reports/${key}?day=${current}`);
    if (!res.ok) {
      setMessage({ kind: 'error', text: (await res.json().catch(() => ({}))).error ?? '出力に失敗しました' });
      return;
    }
    const name = decodeURIComponent(res.headers.get('Content-Disposition')?.split("''")[1] ?? `${key}.csv`);
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: 'ok', text: `${name} を出力しました` });
  }

  return (
    <>
      <PageHeader title="帳票・会計連携" description="CSV は UTF-8（BOM付き）。会計システムへの送信（SFTP等）はモックで、ファイルのダウンロードまでを実装しています。" />
      {!can('report.export') ? <Message message={{ kind: 'error', text: '帳票出力の権限がありません' }} /> : (
        <>
          <div className="mb-4 w-52"><Field label="業務日"><Input type="date" value={current} onChange={(e) => setDay(e.target.value)} /></Field></div>
          <div className="grid gap-4 md:grid-cols-2">
            {REPORTS.map(([key, title, desc]) => (
              <Card key={key} title={title}>
                <p className="mb-3 text-sm text-slate-600">{desc}</p>
                <button onClick={() => download(key)} className="rounded bg-sky-700 px-3 py-1.5 text-sm text-white hover:bg-sky-800">CSVを出力</button>
              </Card>
            ))}
          </div>
          <div className="mt-4"><Message message={message} /></div>
        </>
      )}
    </>
  );
}
