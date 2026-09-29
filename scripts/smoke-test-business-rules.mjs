// 業務ルールの結合テスト（実DB・実API）。npm run db:setup 直後に、起動中のアプリへ対して実行する
// 実行: npm run dev（別ターミナル） → npm run test:smoke   ／  本番: BASE_URL=https://xxx.vercel.app npm run test:smoke
// 注意: 取引・承認などのデータを実際に書き込む。実行後は npm run db:setup で初期状態に戻せる
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local') });
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = process.env.DEMO_PASSWORD || 'Sakura#2026';
const email = (who) => `${who}@sakura-demo.example.com`;

async function session(who) {
  const res = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email(who), password: PASSWORD }) });
  assert.equal(res.status, 200, `${who} でログインできること`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const call = async (method, url, body) => {
    const r = await fetch(`${BASE}${url}`, { method, headers: { cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => null) };
  };
  return { get: (u) => call('GET', u), post: (u, b) => call('POST', u, b), put: (u, b) => call('PUT', u, b) };
}

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(['✔', name]); } catch (e) { results.push(['✖', `${name}\n    ${e.message}`]); }
}

const trade = await session('trade');
const approver = await session('approver');
const settle = await session('settle');
const admin = await session('admin');
const masters = (await trade.get('/api/masters')).body;
const lot = masters.lotsForSale.find((l) => Number(l.available_qty) >= 3);
const buyer = (code) => masters.buyers.find((b) => b.code === code).id;
const countTrades = async () => (await trade.get('/api/trades')).body.trades.length;

await check('未ログインの API は 401、画面は /login へ転送', async () => {
  assert.equal((await fetch(`${BASE}/api/me`)).status, 401);
  const page = await fetch(`${BASE}/lots`, { redirect: 'manual' });
  assert.equal(page.status, 307);
  assert.match(page.headers.get('location'), /\/login/);
});

await check('期限切れの仲卸（N03, 許可）との確定は拒否され、取引は作られない', async () => {
  const before = await countTrades();
  const r = await trade.post('/api/trades', { trade_type: '相対', lot_id: lot.id, buyer_party_id: buyer('N03'), qty: 1, unit_price: 1000, confirm: true });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /参加資格エラー.*許可の有効期限切れ/);
  assert.equal(await countTrades(), before);
});

await check('一時停止中の売買参加者（B02, 承認）は拒否', async () => {
  const r = await trade.post('/api/trades', { trade_type: '相対', lot_id: lot.id, buyer_party_id: buyer('B02'), qty: 1, unit_price: 1000, confirm: true });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /承認.*一時停止/);
});

await check('利用可能数量を超える確定は拒否（過剰販売防止）', async () => {
  const r = await trade.post('/api/trades', { trade_type: '相対', lot_id: lot.id, buyer_party_id: buyer('N01'), qty: Number(lot.available_qty) + 1, unit_price: 1000, confirm: true });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /数量不足/);
});

await check('有効な相対取引は確定され、ロットの利用可能数量が減る', async () => {
  const r = await trade.post('/api/trades', { trade_type: '相対', lot_id: lot.id, buyer_party_id: buyer('N01'), qty: 1, unit_price: 1000, confirm: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.status, '確定');
  const after = (await trade.get(`/api/lots/${lot.id}`)).body.lot;
  assert.equal(Number(after.available_qty), Number(lot.available_qty) - 1);
});

await check('せり結果: 入力者本人は確定できず、別の担当者（承認者）が確定する', async () => {
  const created = await trade.post('/api/trades', { trade_type: 'せり', lot_id: lot.id, buyer_party_id: buyer('B01'), qty: 1, unit_price: 2000, seri_time: '06:45' });
  assert.equal(created.body.status, '確認待ち');
  const self = await trade.post(`/api/trades/${created.body.id}`, { action: 'confirm' });
  assert.equal(self.status, 409);
  assert.match(self.body.error, /職務分離/);
  const ok = await approver.post(`/api/trades/${created.body.id}`, { action: 'confirm' });
  assert.equal(ok.body.status, '確定');
});

await check('権限のない操作は 403（取引担当は業務日をロックできない）', async () => {
  assert.equal((await trade.post('/api/settlement', { day: masters.businessDay })).status, 403);
});

await check('ロック済み業務日の取引は取消できない（直接修正の遮断）', async () => {
  const days = (await settle.get('/api/settlement')).body.recentDays.filter((d) => d.locked);
  const lockedTrades = (await settle.get(`/api/trades?day=${days[0].day}`)).body.trades.filter((t) => t.entry_kind === '通常');
  const r = await trade.post(`/api/trades/${lockedTrades[0].id}`, { action: 'cancel', reason: 'テスト' });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /ロック済み/);
});

await check('修正依頼の承認で赤黒レコードが生成され、元の取引は変わらない', async () => {
  const pending = (await approver.get('/api/corrections?status=承認待ち')).body[0];
  const original = (await approver.get(`/api/trades/${pending.trade_id}`)).body.trade;
  assert.equal((await settle.post(`/api/corrections/${pending.id}`, { decision: '承認' })).status, 403);
  const r = await approver.post(`/api/corrections/${pending.id}`, { decision: '承認', comment: 'テスト承認' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const detail = (await approver.get(`/api/trades/${pending.trade_id}`)).body;
  assert.equal(Number(detail.trade.qty), Number(original.qty));
  assert.deepEqual(detail.adjustments.map((a) => a.entry_kind), ['赤', '黒']);
  assert.equal(Number(detail.adjustments[0].amount), -Number(original.amount));
});

await check('完納奨励金: 期日内完納は支給、期日超過（K02）・一部入金（B03）は0円', async () => {
  const [y, m] = masters.businessDay.split('-').map(Number);
  const period = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const run = await settle.post('/api/incentives', { period });
  assert.equal(run.status, 200, JSON.stringify(run.body));
  const rows = (await settle.get(`/api/incentives?period=${period}`)).body.results.filter((r) => r.kind === '本計算');
  const byCode = Object.fromEntries(rows.map((r) => [r.parties.code, r]));
  assert.equal(byCode.K02.on_time, false);
  assert.equal(Number(byCode.K02.incentive_amount), 0);
  assert.equal(Number(byCode.B03.incentive_amount), 0);
  const paid = rows.find((r) => r.on_time && Number(r.eligible_amount) >= 100000);
  assert.equal(Number(paid.incentive_amount), Math.floor((Number(paid.eligible_amount) * 150 * 110) / 1_000_000));
});

await check('システム管理者から管理権限は外せない（締め出し防止）', async () => {
  assert.equal((await admin.put('/api/admin/roles', { role: 'ROLE-SYS-ADMIN', permission: 'admin.roles', granted: false })).status, 409);
});

await check('ブラウザ用の anon キーではテーブルもDB関数も直接使えない（RLS・実行権限）', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const rows = await (await fetch(`${url}/rest/v1/trades?select=id&limit=1`, { headers })).json();
  assert.deepEqual(rows, []);
  const rpc = await fetch(`${url}/rest/v1/rpc/fn_cancel_trade`, { method: 'POST', headers, body: JSON.stringify({ p_trade_id: 1, p_actor: null, p_reason: 'x' }) });
  assert.ok([401, 403, 404].includes(rpc.status), `rpc status ${rpc.status}`);
});

for (const [mark, name] of results) console.log(`${mark} ${name}`);
const failed = results.filter(([m]) => m === '✖').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
