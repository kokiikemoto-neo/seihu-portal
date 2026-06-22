// デモページ投入スクリプト（開発・動作確認用）
//   node prisma/seed.mjs   または   npm run db:seed
// slug 'home' を upsert する（既にあれば内容を更新、なければ作成）。
// layout は JSON 文字列で保存（リポジトリ層の保存形式に一致）。
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const draftLayout = [
  {
    id: 'demo-hero-1',
    type: 'hero',
    props: {
      organization: '〇〇省',
      headline: 'くらしに役立つ手続きとお知らせ',
      description: '各種手続き・申請・相談窓口へのご案内です。',
      ctas: [
        { label: '手続きを探す', href: '/tetsuzuki' },
        { label: 'お問い合わせ', href: '/contact' },
      ],
    },
  },
  {
    id: 'demo-notice-1',
    type: 'notice',
    props: {
      heading: 'お知らせ',
      items: [
        { date: '2026-06-16', title: '窓口受付時間の変更について', href: '/news/1', level: 'normal' },
        { date: '2026-06-10', title: '【重要】システムメンテナンスのお知らせ', href: '/news/2', level: 'important' },
      ],
    },
  },
  {
    id: 'demo-richtext-1',
    type: 'richtext',
    props: {
      heading: '当ポータルについて',
      headingLevel: 'h2',
      body: 'このポータルでは、各種行政手続きやお知らせをまとめてご案内します。\nお探しの情報が見つからない場合はお問い合わせ窓口をご利用ください。',
    },
  },
];

async function main() {
  const page = await prisma.page.upsert({
    where: { slug: 'home' },
    update: { title: 'トップページ', draftLayout: JSON.stringify(draftLayout) },
    create: {
      slug: 'home',
      title: 'トップページ',
      status: 'draft',
      draftLayout: JSON.stringify(draftLayout),
      publishedLayout: null,
    },
  });
  console.log(`seeded demo page: id=${page.id} slug=${page.slug}`);

  // 初期管理者ユーザー（環境変数 ADMIN_EMAIL / ADMIN_PASSWORD）。本番では必ず変更すること。
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.lg.jp';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: '管理者', role: 'admin' },
    create: { email: adminEmail, name: '管理者', role: 'admin', passwordHash },
  });
  console.log(`seeded admin user: ${admin.email}（パスワードは ADMIN_PASSWORD）`);

  // サンプル案件＋必要書類（閲覧確認用）。固定IDで idempotent に。
  const projects = [
    {
      id: 'proj-sample-1',
      name: '新サービス導入申請',
      description: '社内向け新サービスの導入にあたり必要な申請・書類一式。',
      owner: '情報システム課',
      dueDate: new Date('2026-07-31'),
      documents: [
        { name: '導入企画書', docType: '企画', status: 'done', assignee: '山田', order: 0 },
        { name: 'セキュリティチェックシート', docType: 'セキュリティ', status: 'reviewing', assignee: '佐藤', order: 1 },
        { name: '稟議書', docType: '稟議', status: 'in_progress', assignee: '鈴木', order: 2 },
        { name: '利用規約同意書', docType: '契約', status: 'not_started', assignee: null, order: 3 },
      ],
    },
    {
      id: 'proj-sample-2',
      name: '備品購入手続き',
      description: '部署の備品購入に必要な手続き書類。',
      owner: '総務課',
      dueDate: new Date('2026-06-30'),
      documents: [
        { name: '見積書', docType: '見積', status: 'done', assignee: '田中', order: 0 },
        { name: '購入申請書', docType: '申請', status: 'done', assignee: '田中', order: 1 },
        { name: '検収書', docType: '検収', status: 'not_started', assignee: null, order: 2 },
      ],
    },
  ];
  for (const proj of projects) {
    const { documents, ...data } = proj;
    await prisma.project.upsert({
      where: { id: proj.id },
      update: { name: data.name, description: data.description, owner: data.owner, dueDate: data.dueDate },
      create: data,
    });
    // 書類は一旦消してから入れ直す（サンプルの再現性のため）
    await prisma.document.deleteMany({ where: { projectId: proj.id } });
    await prisma.document.createMany({
      data: documents.map((d) => ({ ...d, projectId: proj.id })),
    });
  }
  console.log(`seeded ${projects.length} sample projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
