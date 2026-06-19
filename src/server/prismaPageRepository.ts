/**
 * PageRepository の Prisma 実装（① 永続化）
 *
 * layout 系（draftLayout / publishedLayout）は DB 上は JSON 文字列。
 * この層で PageLayout <-> 文字列 を相互変換し、上位（actions / routes）は
 * PageRepository インターフェース越しに型付き Page を扱う。
 */
import type { PrismaClient } from '@prisma/client';
import type { Page, PageLayout, PageStatus } from '@/lib/blocks/types';
import type {
  CreatePageInput,
  PageRepository,
  UpdatePageInput,
} from '@/server/pageStore';

/** Prisma の Page 行（必要なフィールドのみの構造的型）。 */
interface PageRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  draftLayout: string;
  publishedLayout: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function parseLayout(json: string | null): PageLayout | null {
  if (json == null) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as PageLayout) : [];
  } catch {
    return [];
  }
}

/** DB 行をドメインの Page に変換する。 */
function toPage(row: PageRow): Page {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    status: row.status as PageStatus,
    draftLayout: parseLayout(row.draftLayout) ?? [],
    publishedLayout: parseLayout(row.publishedLayout),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaPageRepository implements PageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(): Promise<Page[]> {
    const rows = await this.prisma.page.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toPage);
  }

  async getById(id: string): Promise<Page | null> {
    const row = await this.prisma.page.findUnique({ where: { id } });
    return row ? toPage(row) : null;
  }

  async getBySlug(slug: string): Promise<Page | null> {
    const row = await this.prisma.page.findUnique({ where: { slug } });
    return row ? toPage(row) : null;
  }

  async create(input: CreatePageInput): Promise<Page> {
    const row = await this.prisma.page.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description ?? null,
        status: 'draft',
        draftLayout: JSON.stringify(input.draftLayout ?? []),
        publishedLayout: null,
      },
    });
    return toPage(row);
  }

  async update(id: string, input: UpdatePageInput): Promise<Page | null> {
    try {
      const row = await this.prisma.page.update({
        where: { id },
        data: {
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.draftLayout !== undefined
            ? { draftLayout: JSON.stringify(input.draftLayout) }
            : {}),
        },
      });
      return toPage(row);
    } catch {
      // レコードが存在しない（P2025）など
      return null;
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.page.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async publish(id: string): Promise<Page | null> {
    const existing = await this.prisma.page.findUnique({ where: { id } });
    if (!existing) return null;
    const row = await this.prisma.page.update({
      where: { id },
      data: {
        status: 'published',
        // draft の内容をそのまま公開面へコピー（JSON 文字列のまま複製）。
        publishedLayout: existing.draftLayout,
      },
    });
    return toPage(row);
  }
}
