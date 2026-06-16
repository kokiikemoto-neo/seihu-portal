/**
 * ページ永続化層（③ システム系）
 *
 * Page の CRUD と publish（draftLayout → publishedLayout コピー）を提供する。
 * まずはインメモリ実装。後で Prisma 実装に差し替えられるよう、
 * PageRepository インターフェースを境界に置く（呼び出し側はインターフェースに依存）。
 *
 * 共有契約 types.ts（①管理）の Page / PageStatus / PageLayout を使う。重複定義しない。
 */
import { randomUUID } from 'node:crypto';
import type { BlockInstance, Page, PageLayout } from '@/lib/blocks/types';

/** ページ新規作成の入力（id/日時/status はストアが付与）。 */
export interface CreatePageInput {
  slug: string;
  title: string;
  /** 初期の編集中配置（省略時は空配置） */
  draftLayout?: PageLayout;
}

/** ページ更新の入力（指定したフィールドのみ更新）。 */
export interface UpdatePageInput {
  slug?: string;
  title?: string;
  draftLayout?: PageLayout;
}

/**
 * ページ永続化のリポジトリ抽象。
 * インメモリ／Prisma など実装を差し替え可能にする境界。
 */
export interface PageRepository {
  list(): Promise<Page[]>;
  getById(id: string): Promise<Page | null>;
  getBySlug(slug: string): Promise<Page | null>;
  create(input: CreatePageInput): Promise<Page>;
  update(id: string, input: UpdatePageInput): Promise<Page | null>;
  remove(id: string): Promise<boolean>;
  /** draftLayout を publishedLayout にコピーし status を 'published' にする。 */
  publish(id: string): Promise<Page | null>;
}

/** ISO 8601 文字列の現在時刻。 */
function now(): string {
  return new Date().toISOString();
}

/**
 * インメモリ実装。プロセス内 Map で保持する（開発・テスト用）。
 * 本番では Prisma 実装に差し替える想定（PageRepository を実装する別クラス）。
 */
export class InMemoryPageRepository implements PageRepository {
  private readonly pages = new Map<string, Page>();

  async list(): Promise<Page[]> {
    return Array.from(this.pages.values());
  }

  async getById(id: string): Promise<Page | null> {
    return this.pages.get(id) ?? null;
  }

  async getBySlug(slug: string): Promise<Page | null> {
    for (const page of this.pages.values()) {
      if (page.slug === slug) return page;
    }
    return null;
  }

  async create(input: CreatePageInput): Promise<Page> {
    const timestamp = now();
    const page: Page = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      status: 'draft',
      draftLayout: input.draftLayout ?? [],
      publishedLayout: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.pages.set(page.id, page);
    return page;
  }

  async update(id: string, input: UpdatePageInput): Promise<Page | null> {
    const existing = this.pages.get(id);
    if (!existing) return null;
    const updated: Page = {
      ...existing,
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.draftLayout !== undefined ? { draftLayout: input.draftLayout } : {}),
      updatedAt: now(),
    };
    this.pages.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<boolean> {
    return this.pages.delete(id);
  }

  async publish(id: string): Promise<Page | null> {
    const existing = this.pages.get(id);
    if (!existing) return null;
    const published: Page = {
      ...existing,
      status: 'published',
      // draft の内容を公開面にコピー（参照共有を避けるためディープコピー）。
      publishedLayout: structuredClone(existing.draftLayout),
      updatedAt: now(),
    };
    this.pages.set(id, published);
    return published;
  }

  /**
   * 初期データ（デモページ）を直接投入する（開発・動作確認用）。
   * create() を介さず Page 全体を構築できるよう、ストア内部で完結させる。
   */
  seed(page: Page): void {
    this.pages.set(page.id, page);
  }
}

/**
 * デモページ（slug: home）を1件生成する。
 * draftLayout に hero / notice / richtext の BlockInstance を各1つ含む（status=draft）。
 * ビルダー・保存・公開フローの動作確認用。
 */
export const DEMO_PAGE_ID = 'demo-home';

function buildDemoPage(): Page {
  const timestamp = '2026-06-16T00:00:00.000Z';
  const draftLayout: PageLayout = [
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
    } satisfies BlockInstance,
    {
      id: 'demo-notice-1',
      type: 'notice',
      props: {
        heading: 'お知らせ',
        items: [
          {
            date: '2026-06-16',
            title: '窓口受付時間の変更について',
            href: '/news/1',
            level: 'normal',
          },
          {
            date: '2026-06-10',
            title: '【重要】システムメンテナンスのお知らせ',
            href: '/news/2',
            level: 'important',
          },
        ],
      },
    } satisfies BlockInstance,
    {
      id: 'demo-richtext-1',
      type: 'richtext',
      props: {
        heading: '当ポータルについて',
        headingLevel: 'h2',
        body: 'このポータルでは、各種行政手続きやお知らせをまとめてご案内します。\nお探しの情報が見つからない場合はお問い合わせ窓口をご利用ください。',
      },
    } satisfies BlockInstance,
  ];

  return {
    id: DEMO_PAGE_ID,
    slug: 'home',
    title: 'トップページ',
    status: 'draft',
    draftLayout,
    publishedLayout: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** 新規のインメモリリポジトリを生成し、デモページを投入して返す。 */
function createSeededRepository(): InMemoryPageRepository {
  const repo = new InMemoryPageRepository();
  repo.seed(buildDemoPage());
  return repo;
}

/**
 * アプリ全体で共有する既定のリポジトリインスタンス。
 * dev の HMR でモジュールが再評価されてもデータを保持するため globalThis に退避する。
 * 本番で Prisma 実装へ切り替える際は、ここの生成箇所のみ差し替えればよい。
 */
const globalForPageStore = globalThis as unknown as {
  __seihuPageRepository?: PageRepository;
};

export const pageRepository: PageRepository =
  globalForPageStore.__seihuPageRepository ?? createSeededRepository();

if (process.env.NODE_ENV !== 'production') {
  globalForPageStore.__seihuPageRepository = pageRepository;
}
