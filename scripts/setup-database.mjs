// DB初期化: テーブル・関数の作成 → デモユーザー作成（Supabase Auth）→ モックデータ投入
// 実行: npm run db:setup   （.env.local の SUPABASE_DB_URL と SUPABASE_SERVICE_ROLE_KEY を使用）
// 注意: 既存のアプリ用テーブルを削除して作り直す（研修用プロトタイプ専用のDBで実行すること）
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local') });

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Sakura#2026';
const DEMO_ACCOUNTS = [
  ['admin@sakura-demo.example.com', 'システム管理者（講師レビュー用）', 'ROLE-SYS-ADMIN'],
  ['intake@sakura-demo.example.com', '受付担当 佐藤', 'ROLE-INTAKE'],
  ['judge@sakura-demo.example.com', '評価担当 鈴木', 'ROLE-JUDGE'],
  ['trade@sakura-demo.example.com', '取引担当 高橋', 'ROLE-TRADE'],
  ['delivery@sakura-demo.example.com', '配送担当 田中', 'ROLE-DELIVERY'],
  ['settle@sakura-demo.example.com', '照合事務局 伊藤', 'ROLE-SETTLEMENT'],
  ['approver@sakura-demo.example.com', '照合部門長 渡辺（承認者）', 'ROLE-APPROVER'],
  ['rule@sakura-demo.example.com', 'ルール管理者 山本', 'ROLE-RULE-ADMIN'],
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`.env.local に ${name} がありません（README の手順を参照）`);
  return value;
}

async function runSqlFile(db, file) {
  const sql = await readFile(path.join(root, 'supabase', file), 'utf8');
  await db.query(sql);
  console.log(`  ✓ ${file}`);
}

async function recreateDemoUsers(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const emails = new Set(DEMO_ACCOUNTS.map(([email]) => email));
  for (const user of data.users.filter((u) => emails.has(u.email))) {
    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) throw delError;
  }
  const created = [];
  for (const [email, name, role] of DEMO_ACCOUNTS) {
    const { data: res, error: createError } = await admin.auth.admin.createUser({
      email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { display_name: name },
    });
    if (createError) throw createError;
    created.push({ id: res.user.id, email, name, role });
  }
  console.log(`  ✓ デモユーザー ${created.length} 件`);
  return created;
}

async function main() {
  const db = new pg.Client({ connectionString: requireEnv('SUPABASE_DB_URL'), ssl: { rejectUnauthorized: false } });
  const admin = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await db.connect();
  try {
    console.log('1/3 テーブル・関数');
    for (const f of ['schema-tables.sql', 'schema-functions.sql', 'schema-functions-corrections.sql', 'seed-master-data.sql']) {
      await runSqlFile(db, f);
    }
    console.log('2/3 デモユーザー');
    const users = await recreateDemoUsers(admin);
    for (const u of users) {
      await db.query('insert into profiles(id, email, display_name, role) values ($1, $2, $3, $4)', [u.id, u.email, u.name, u.role]);
    }
    console.log('3/3 モックデータ');
    await runSqlFile(db, 'seed-transactions.sql');
    const { rows } = await db.query(`select (select count(*) from lots) lots, (select count(*) from trades) trades,
      (select count(*) from parties) parties, fn_business_day() business_day`);
    console.log('完了:', rows[0]);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('DB初期化に失敗しました:', err.message);
  process.exit(1);
});
