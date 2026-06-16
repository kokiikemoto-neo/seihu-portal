// デモページ投入スクリプト（開発・動作確認用）
//   node prisma/seed.mjs   または   npm run db:seed
// slug 'home' を upsert する（既にあれば内容を更新、なければ作成）。
// layout は JSON 文字列で保存（リポジトリ層の保存形式に一致）。
import { PrismaClient } from '@prisma/client';

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
