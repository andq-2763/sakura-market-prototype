// 完納奨励金計算のテスト（RFP Appendix C.3 DS-INC-EDGE-01〜03 相当）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateIncentive, dueDateOf, deltaForNextPeriod, type RateVersion } from './incentive-calculation.ts';

const rate: RateVersion = { rateBp: 150, thresholdAmount: 100_000, taxNumerator: 110, taxDenominator: 100, paymentDueDays: 10 };
const base = { period: '2026-08', payments: [] as { amount: number; paidOn: string }[] };

test('支払期日は期末日＋支払日数（期日当日を含む）', () => {
  assert.equal(dueDateOf('2026-08', 10), '2026-09-10');
  assert.equal(dueDateOf('2026-02', 10), '2026-03-10');
});

test('INC-EDGE-01: 最低閾値ちょうどは対象（以上）', () => {
  const billed = Math.floor(100_000 * 108 / 100);
  const r = calculateIncentive({ ...base, eligibleAmount: 100_000, rate, payments: [{ amount: billed, paidOn: '2026-09-10' }] });
  assert.equal(r.onTime, true);
  assert.equal(r.incentiveAmount, 1650); // 100,000 × 1.5% × 110/100
});

test('閾値未満は0円', () => {
  const r = calculateIncentive({ ...base, eligibleAmount: 99_999, rate, payments: [{ amount: 200_000, paidOn: '2026-09-01' }] });
  assert.equal(r.incentiveAmount, 0);
});

test('INC-EDGE-03: 税係数乗算後の小数はJPY切捨て', () => {
  // 123,457 × 150 × 110 / 1,000,000 = 2037.0405 → 2037
  const r = calculateIncentive({ ...base, eligibleAmount: 123_457, rate, payments: [{ amount: 999_999, paidOn: '2026-09-05' }] });
  assert.equal(r.incentiveAmount, 2037);
});

test('期日を1日でも過ぎた入金で完納した場合は0円（猶予期間なし）', () => {
  const billed = Math.floor(200_000 * 108 / 100);
  const r = calculateIncentive({ ...base, eligibleAmount: 200_000, rate, payments: [{ amount: billed, paidOn: '2026-09-11' }] });
  assert.equal(r.onTime, false);
  assert.equal(r.incentiveAmount, 0);
});

test('期日内でも一部入金のみなら完納ではなく0円', () => {
  const r = calculateIncentive({ ...base, eligibleAmount: 200_000, rate, payments: [{ amount: 100_000, paidOn: '2026-09-01' }] });
  assert.equal(r.onTime, false);
  assert.equal(r.incentiveAmount, 0);
});

test('分割入金は期日までの合計で判定する', () => {
  const r = calculateIncentive({ ...base, eligibleAmount: 200_000, rate,
    payments: [{ amount: 100_000, paidOn: '2026-09-01' }, { amount: 116_000, paidOn: '2026-09-10' }, { amount: 1, paidOn: '2026-09-20' }] });
  assert.equal(r.onTime, true);
  assert.equal(r.incentiveAmount, 3300);
});

test('INC-EDGE-02: 確定済みの期を再計算した差は次期の差分にする', () => {
  assert.deepEqual(deltaForNextPeriod('2026-08', 3300, 3135), { period: '2026-09', amount: -165 });
  assert.equal(deltaForNextPeriod('2026-12', 1000, 1000), null);
  assert.deepEqual(deltaForNextPeriod('2026-12', 0, 500), { period: '2027-01', amount: 500 });
});
